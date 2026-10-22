/* Ultimate Clock · copia local por tablas (IndexedDB) y cola de cambios para sincronizar.
   Las funciones puras (entidades, diferencias, reconstrucción) no usan el DOM y se prueban en Node.
   localStorage sigue siendo la lectura inmediata del arranque; esta capa guarda lo mismo por partes,
   no depende de su cuota y deja anotado en `outbox` cada cambio para subirlo al servidor (fase 3). */
(function (root) {
  'use strict';
  const DB_NAME = 'ultimate-clock-local';
  const DB_VERSION = 1;
  const TABLAS = ['ajustes', 'partidoActivo', 'partidos', 'torneos'];
/* Estas tablas van al servidor. El partido en curso se guarda con el id del dispositivo (uno por dispositivo); los ajustes quedan locales. */
const SINCRONIZADAS = ['partidos', 'torneos', 'partidoActivo'];

  const clon = (x) => JSON.parse(JSON.stringify(x));
  const uuid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  /* Estado completo -> { 'tabla:id': { tabla, id, data } }. Cada partido guardado y cada torneo es un registro. */
  function entidades(state, dispositivo) {
    const out = {};
    const poner = (tabla, id, data) => { out[tabla + ':' + id] = { tabla, id, data }; };
    poner('ajustes', 'ajustes', {
      version: state.version, settings: state.settings, customThemes: state.customThemes || [],
      customRulesets: state.customRulesets || [], pendingAlerts: state.pendingAlerts || [], timerProfiles: state.timerProfiles || [],
      torneoActivo: state.tournament ? state.tournament.id : null
    });
    poner('partidoActivo', dispositivo || 'activo', state.activeMatch);
    (state.savedMatches || []).forEach((m) => poner('partidos', m.id, { match: m }));
    if (state.tournament) poner('torneos', state.tournament.id, { tournament: state.tournament });
    (state.otherTournaments || []).forEach((t) => poner('torneos', t.id, { tournament: t }));
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
  function reconstruir(registros, dispositivo) {
    const por = (tabla) => registros.filter((r) => r.tabla === tabla);
    const aj = por('ajustes').find((r) => r.id === 'ajustes');
    const act = por('partidoActivo').find((r) => r.id === dispositivo) || por('partidoActivo').find((r) => r.id === 'activo');
    if (!aj || !act) return null;
    const { torneoActivo, ...resto } = clon(aj.data);
    const torneos = por('torneos').map((r) => r.data.tournament).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const activo = torneos.find((t) => t.id === torneoActivo) || null;
    return {
      ...resto,
      tournament: activo,
      otherTournaments: torneos.filter((t) => t !== activo),
      activeMatch: act.data,
      savedMatches: por('partidos').map((r) => r.data.match).sort(masNuevoPrimero)
    };
  }
  const masNuevoPrimero = (a, b) => String(b.savedAt).localeCompare(String(a.savedAt));

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
      if (SINCRONIZADAS.includes(c.tabla)) tx.objectStore('outbox').add({ cambio: uuid(), tabla: c.tabla, id: c.id, op: c.op, dispositivo, creado: guardadoEn });
    }
    tx.objectStore('meta').put({ id: 'estado', guardadoEn });
    await fin(tx);
  }

  /* Registros que llegan del servidor: se guardan sin pasar por la cola (no se devuelven al servidor). */
  async function aplicarRemotos(db, cambios) {
    if (!cambios.length) return;
    cambios = cambios.filter((c) => c.tabla !== 'partidoActivo');
    if (!cambios.length) return;
    const tx = db.transaction(SINCRONIZADAS, 'readwrite');
    for (const c of cambios) {
      const store = tx.objectStore(c.tabla);
      if (c.op === 'delete') store.delete(c.id); else store.put({ id: c.id, data: c.data });
    }
    await fin(tx);
  }
  async function leerMeta(db, id) {
    const f = await pedir(db.transaction('meta').objectStore('meta').get(id));
    return f ? f.valor : null;
  }
  async function escribirMeta(db, id, valor) {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ id, valor });
    await fin(tx);
  }
  async function leerRegistro(db, tabla, id) {
    const f = await pedir(db.transaction(tabla).objectStore(tabla).get(id));
    return f ? f.data : null;
  }
  /* Al cerrar sesión: la cola y las versiones eran de esa cuenta y no deben pasar a la siguiente. */
  async function limpiarSincronizacion(db) {
    const tx = db.transaction(['outbox', 'meta'], 'readwrite');
    tx.objectStore('outbox').clear();
    tx.objectStore('meta').delete('versiones');
    tx.objectStore('meta').delete('cursor');
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
      esperar() { return cola; },
      /* Tras aplicar registros remotos: el estado ya los contiene, no deben volver a salir como cambios. */
      registrarRemotos(cambios) {
        for (const c of cambios) {
          const clave = c.tabla + ':' + c.id;
          if (c.op === 'delete') delete previo[clave]; else previo[clave] = JSON.stringify(c.data);
        }
      },
      guardar(state, guardadoEn) {
        const { cambios, siguiente } = diferencias(previo, entidades(state, dispositivo));
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

  const api = { TABLAS, SINCRONIZADAS, aplicarRemotos, limpiarSincronizacion, leerMeta, escribirMeta, leerRegistro, entidades, diferencias, reconstruir, abrir, leerTodo, aplicar, pendientes, quitarDeOutbox, crearGuardador };
  if (typeof module !== 'undefined') module.exports = api; else root.UCLocal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
