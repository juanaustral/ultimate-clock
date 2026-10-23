/* Ultimate Clock · sincronización. Sube la cola de cambios (outbox) y baja lo nuevo del servidor.
   Nunca bloquea al usuario: toda anotación se guarda primero en el dispositivo.
   Estado para el indicador: verde = cola vacía, sin conflictos y última sincronización correcta; rojo = el resto. */
(function (root) {
  'use strict';
  const LOTE = 40;
  const clave = (tabla, id) => tabla + ':' + id;

  /* opciones: db, local (UCLocal), sesion (UCSession), dispositivo, aplicar(remotos) -> Promise,
     alConflicto(lista), alEstado(estado), fetchFn */
  function crear(o) {
    const { db, local, sesion, dispositivo } = o;
    const conflictos = new Map();
    let ocupado = false, repetir = false, timer = null, intervalo = null, periodo = 15000;
    let estado = { verde: false, razon: 'sin-sincronizar', pendientes: 0 };

    function publicar(parcial) {
      estado = { ...estado, ...parcial };
      if (o.alEstado) o.alEstado(estado);
    }
    const sincronizables = async () => (await local.pendientes(db)).filter((f) => local.SINCRONIZADAS.includes(f.tabla));
    async function versiones() { return (await local.leerMeta(db, 'versiones')) || {}; }

    async function subir() {
      const filas = await sincronizables();
      if (!filas.length) return;
      const grupos = new Map();
      for (const f of filas) {
        const k = clave(f.tabla, f.id);
        const g = grupos.get(k) || { tabla: f.tabla, id: f.id, seqs: [], ultimo: f };
        g.seqs.push(f.seq);
        if (f.seq > g.ultimo.seq) g.ultimo = f;
        grupos.set(k, g);
      }
      const vers = await versiones();
      const lista = [];
      for (const [k, g] of grupos) {
        if (conflictos.has(k)) continue; // espera la decisión del usuario
        const data = await local.leerRegistro(db, g.tabla, g.id);
        lista.push({ k, g, cambio: { cambio: g.ultimo.cambio, tabla: g.tabla, id: g.id, op: data ? 'put' : 'delete', base: vers[k] || 0, data } });
      }
      for (let i = 0; i < lista.length; i += LOTE) {
        const lote = lista.slice(i, i + LOTE);
        const r = await sesion.pedir('sync/subir', { method: 'POST', body: JSON.stringify({ dispositivo, cambios: lote.map((x) => x.cambio) }) }, o.fetchFn);
        if (r.status === 401) { const e = new Error('sesion'); e.sesion = true; throw e; }
        if (!r.ok) throw new Error('http ' + r.status);
        const { resultados } = await r.json();
        const pendientesBorrar = [];
        resultados.forEach((res, j) => {
          const { k, g } = lote[j];
          if (res.estado === 'ok') { vers[k] = res.version; pendientesBorrar.push(...g.seqs); }
          else conflictos.set(k, { k, tabla: g.tabla, id: g.id, seqs: g.seqs, actual: res.actual, version: res.version });
        });
        await local.quitarDeOutbox(db, pendientesBorrar);
        await local.escribirMeta(db, 'versiones', vers);
      }
    }

    async function bajar() {
      let cursor = (await local.leerMeta(db, 'cursor')) || 0;
      const vers = await versiones();
      const pendientesLocales = new Set((await sincronizables()).map((f) => clave(f.tabla, f.id)));
      for (let vuelta = 0; vuelta < 50; vuelta++) {
        const r = await sesion.pedir('sync/bajar?desde=' + cursor, { method: 'GET' }, o.fetchFn);
        if (r.status === 401) { const e = new Error('sesion'); e.sesion = true; throw e; }
        if (!r.ok) throw new Error('http ' + r.status);
        const d = await r.json();
        const remotos = [];
        for (const c of d.cambios) {
          const k = clave(c.tabla, c.id);
          if (c.dispositivo === dispositivo) { vers[k] = Math.max(vers[k] || 0, c.version); continue; }
          if (pendientesLocales.has(k)) continue; // hay cambios locales sin subir: se resuelve al subir
          vers[k] = c.version;
          remotos.push({ tabla: c.tabla, id: c.id, op: c.borrado ? 'delete' : 'put', data: c.data });
        }
        if (remotos.length) await o.aplicar(remotos);
        cursor = d.cursor;
        await local.escribirMeta(db, 'versiones', vers);
        await local.escribirMeta(db, 'cursor', cursor);
        if (!d.pendiente) break;
      }
    }

    async function sincronizar() {
      if (!sesion.token()) { publicar({ verde: false, razon: 'sin-sesion', pendientes: 0 }); return; }
      if (ocupado) { repetir = true; return; }
      ocupado = true;
      try {
        if (root.navigator && root.navigator.onLine === false) throw new Error('sin red');
        await subir();
        await bajar();
        const n = (await sincronizables()).length;
        const hayConflictos = conflictos.size > 0;
        publicar({ verde: n === 0 && !hayConflictos, razon: hayConflictos ? 'conflicto' : n ? 'pendientes' : 'ok', pendientes: n });
        if (hayConflictos && o.alConflicto) o.alConflicto([...conflictos.values()]);
      } catch (e) {
        if (root.console && !e.sesion) root.console.warn('sync:', e && e.message);
        if (e.sesion) { sesion.vencida(); publicar({ verde: false, razon: 'sesion-vencida' }); }
        else publicar({ verde: false, razon: 'sin-conexion' });
        try { publicar({ pendientes: (await sincronizables()).length }); } catch { /* sin acceso a la base local */ }
      } finally {
        ocupado = false;
        if (repetir) { repetir = false; programar(300); }
      }
    }

    function programar(ms = 1500) {
      clearTimeout(timer);
      timer = setTimeout(sincronizar, ms);
    }

    /* eleccion: 'local' (este dispositivo es el oficial) o 'remoto' (se usa el otro dispositivo). */
    async function resolver(k, eleccion) {
      const c = conflictos.get(k);
      if (!c) return;
      const vers = await versiones();
      vers[k] = c.version;
      await local.escribirMeta(db, 'versiones', vers);
      if (eleccion === 'remoto') {
        await local.quitarDeOutbox(db, c.seqs);
        if (c.actual) await o.aplicar([{ tabla: c.tabla, id: c.id, op: c.actual.borrado ? 'delete' : 'put', data: c.actual.data }]);
      }
      conflictos.delete(k);
      programar(100);
    }

    /* Borra en el servidor un registro de otro dispositivo (p. ej. su partido en curso, ya retomado aquí). */
    async function descartar(tabla, id) {
      try {
        const vers = await versiones();
        const k = clave(tabla, id);
        const r = await sesion.pedir('sync/subir', { method: 'POST', body: JSON.stringify({ dispositivo, cambios: [{ cambio: 'desc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), tabla, id, op: 'delete', base: vers[k] || 0 }] }) }, o.fetchFn);
        if (r.ok) { const { resultados } = await r.json(); if (resultados[0].estado === 'ok') { vers[k] = resultados[0].version; await local.escribirMeta(db, 'versiones', vers); } }
      } catch { /* sin conexión: queda como estaba */ }
    }

    function iniciar() {
      intervalo = setInterval(sincronizar, periodo);
      if (root.addEventListener) {
        root.addEventListener('online', () => programar(200));
        root.addEventListener('offline', () => publicar({ verde: false, razon: 'sin-conexion' }));
      }
      if (root.document) root.document.addEventListener('visibilitychange', () => { if (!root.document.hidden) programar(200); });
      programar(200);
    }
    /* Cada cuántos ms se consulta al servidor: más seguido mientras se comparte un partido en vivo. */
    function ritmo(ms) {
      if (ms === periodo) return;
      periodo = ms;
      if (intervalo) { clearInterval(intervalo); intervalo = setInterval(sincronizar, periodo); }
    }
    function detener() { clearInterval(intervalo); clearTimeout(timer); }

    return { sincronizar, programar, resolver, descartar, iniciar, detener, ritmo, pendientes: async () => (await sincronizables()).length,
      estado: () => estado, conflictos: () => [...conflictos.values()] };
  }

  const api = { crear };
  if (typeof module !== 'undefined') module.exports = api; else root.UCSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
