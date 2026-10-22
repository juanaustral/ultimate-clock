/* Ultimate Clock · copia local por tablas (IndexedDB) y cola de cambios para sincronizar.
   Las funciones puras (entidades, diferencias, reconstrucción) no usan el DOM y se prueban en Node.
   localStorage sigue siendo la lectura inmediata del arranque; esta capa guarda lo mismo por partes,
   no depende de su cuota y deja anotado en `outbox` cada cambio para subirlo al servidor (fase 3). */
(function (root) {
  'use strict';
  const DB_NAME = 'ultimate-clock-local';
  const DB_VERSION = 1;
  const TABLAS = ['ajustes', 'partidoActivo', 'partidos', 'torneos'];

  const clon = (x) => JSON.parse(JSON.stringify(x));
  const uuid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  /* Estado completo -> { 'tabla:id': { tabla, id, data } }. Cada partido guardado y cada torneo es un registro. */
  function entidades(state) {
    const out = {};
    const poner = (tabla, id, data) => { out[tabla + ':' + id] = { tabla, id, data }; };
    poner('ajustes', 'ajustes', {
      version: state.version, settings: state.settings, customThemes: state.customThemes || [],
      customRulesets: state.customRulesets || [], pendingAlerts: state.pendingAlerts || [], timerProfiles: state.timerProfiles || []
    });
    poner('partidoActivo', 'activo', state.activeMatch);
    (state.savedMatches || []).forEach((m, orden) => poner('partidos', m.id, { orden, match: m }));
    if (state.tournament) poner('torneos', state.tournament.id, { activo: true, orden: 0, tournament: state.tournament });
    (state.otherTournaments || []).forEach((t, i) => poner('torneos', t.id, { activo: false, orden: i, tournament: t }));
    return out;
  }

  /* Cambios entre el mapa anterior de textos JSON y las entidades nuevas. Devuelve { cambios, siguiente }. */
  function diferencias(anterior, ents) {
    const cambios = [];
    const siguiente = {};
    for (const [clave, e] of Object.entries(ents)) {
      const texto = JSON.stringify(e.data);
      siguiente[clave] = texto;
      if (anterior[clave] !== texto) cambios.push({ tabla: e.tabla, id: e.id, op: 'put', data: e.data });
    }
    for (const clave of Object.keys(anterior)) {
      if (!(clave in ents)) {
        const i = clave.indexOf(':');
        cambios.push({ tabla: clave.slice(0, i), id: clave.slice(i + 1), op: 'delete' });
      }
    }
    return { cambios, siguiente };
  }

  /* Inversa de entidades(): arma el estado desde los registros guardados. null si faltan los esenciales. */
  function reconstruir(registros) {
    const por = (tabla) => registros.filter((r) => r.tabla === tabla);
    const aj = por('ajustes').find((r) => r.id === 'ajustes');
    const act = por('partidoActivo').find((r) => r.id === 'activo');
    if (!aj || !act) return null;
    const torneos = por('torneos').sort((a, b) => a.data.orden - b.data.orden);
    return {
      ...clon(aj.data),
      tournament: (torneos.find((r) => r.data.activo) || { data: {} }).data.tournament || null,
      otherTournaments: torneos.filter((r) => !r.data.activo).map((r) => r.data.tournament),
      activeMatch: act.data,
      savedMatches: por('partidos').sort((a, b) => a.data.orden - b.data.orden).map((r) => r.data.match)
    };
  }

  /* ---- IndexedDB ---- */
  function pedir(req) {
    return new Promise((ok, mal) => { req.onsuccess = () => ok(req.result); req.onerror = () => mal(req.error); });
  }
  function fin(tx) {
    return new Promise((ok, mal) => { tx.oncomplete = ok; tx.onerror = () => mal(tx.error); tx.onabort = () => mal(tx.error || new Error('abortada')); });
  }

  function abrir(idb) {
    idb = idb || root.indexedDB;
    if (!idb) return Promise.reject(new Error('IndexedDB no disponible'));
    return new Promise((ok, mal) => {
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const t of TABLAS) db.createObjectStore(t, { keyPath: 'id' });
        db.createObjectStore('meta', { keyPath: 'id' });
        db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => mal(req.error);
      req.onblocked = () => mal(new Error('IndexedDB bloqueada'));
    });
  }

  async function leerTodo(db) {
    const registros = [];
    for (const tabla of TABLAS) {
      const filas = await pedir(db.transaction(tabla).objectStore(tabla).getAll());
      for (const f of filas) registros.push({ tabla, id: f.id, data: f.data });
    }
    const meta = await pedir(db.transaction('meta').objectStore('meta').get('estado'));
    return { registros, guardadoEn: meta ? meta.guardadoEn : 0 };
  }

  /* Una sola transacción: registros + entradas de outbox + marca de tiempo. Todo o nada. */
  async function aplicar(db, cambios, guardadoEn, dispositivo) {
    if (!cambios.length) return;
    const tx = db.transaction([...TABLAS, 'meta', 'outbox'], 'readwrite');
    for (const c of cambios) {
      const store = tx.objectStore(c.tabla);
      if (c.op === 'put') store.put({ id: c.id, data: c.data }); else store.delete(c.id);
      tx.objectStore('outbox').add({ cambio: uuid(), tabla: c.tabla, id: c.id, op: c.op, dispositivo, creado: guardadoEn });
    }
    tx.objectStore('meta').put({ id: 'estado', guardadoEn });
    await fin(tx);
  }

  async function pendientes(db) {
    return pedir(db.transaction('outbox').objectStore('outbox').getAll());
  }
  async function quitarDeOutbox(db, seqs) {
    const tx = db.transaction('outbox', 'readwrite');
    for (const s of seqs) tx.objectStore('outbox').delete(s);
    await fin(tx);
  }

  /* Guardador con memoria de lo último escrito. Serializa las escrituras para que no se pisen. */
  function crearGuardador(db, dispositivo) {
    let previo = {};
    let cola = Promise.resolve();
    return {
      /* registros: lo que IndexedDB ya tiene; lo que falte o difiera se escribe en el próximo guardado. */
      precargar(registros) {
        previo = {};
        for (const r of registros) previo[r.tabla + ':' + r.id] = JSON.stringify(r.data);
      },
      guardar(state, guardadoEn) {
        const { cambios, siguiente } = diferencias(previo, entidades(state));
        if (!cambios.length) return cola;
        const anteriorPrevio = previo;
        previo = siguiente;
        const p = cola.then(() => aplicar(db, cambios, guardadoEn, dispositivo));
        cola = p.catch(() => {});
        p.catch(() => { previo = anteriorPrevio; }); // se reintenta en el próximo guardado
        return p;
      }
    };
  }

  const api = { TABLAS, entidades, diferencias, reconstruir, abrir, leerTodo, aplicar, pendientes, quitarDeOutbox, crearGuardador };
  if (typeof module !== 'undefined') module.exports = api; else root.UCLocal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
