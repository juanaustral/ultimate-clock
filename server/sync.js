'use strict';
// Sincronización por registros con control de versión. Se sincronizan partidos guardados y torneos;
// el partido en curso y los ajustes quedan en cada dispositivo.
const TABLAS = new Set(['partidos', 'torneos']);
const MAX_REGISTRO = 1024 * 1024;
const MAX_CAMBIOS = 200;

function enTransaccion(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

function errorPedido(msg) { return Object.assign(new Error(msg), { estado: 400 }); }

function validar(c) {
  if (!c || typeof c.cambio !== 'string' || !c.cambio || c.cambio.length > 64) throw errorPedido('cambio');
  if (!TABLAS.has(c.tabla)) throw errorPedido('tabla');
  if (typeof c.id !== 'string' || !c.id || c.id.length > 80) throw errorPedido('id');
  if (c.op !== 'put' && c.op !== 'delete') throw errorPedido('op');
  if (!Number.isInteger(c.base) || c.base < 0) throw errorPedido('base');
  if (c.op === 'put' && (c.data === null || typeof c.data !== 'object')) throw errorPedido('data');
}

// Aplica una lista de cambios. Cada uno devuelve { cambio, estado: 'ok' | 'conflicto', version, actual? }.
function subir(db, cuentaId, dispositivo, cambios) {
  if (typeof dispositivo !== 'string' || !dispositivo || dispositivo.length > 64) throw errorPedido('dispositivo');
  if (!Array.isArray(cambios) || cambios.length > MAX_CAMBIOS) throw errorPedido('cambios');
  cambios.forEach(validar);
  const leer = db.prepare('SELECT data, version, dispositivo, borrado FROM registros WHERE cuenta_id = ? AND tabla = ? AND id = ?');
  const yaAplicado = db.prepare('SELECT 1 x FROM aplicados WHERE cuenta_id = ? AND cambio = ?');
  const marcar = db.prepare('INSERT INTO aplicados (cuenta_id, cambio) VALUES (?, ?)');
  const guardar = db.prepare(`INSERT INTO registros (cuenta_id, tabla, id, data, version, dispositivo, actualizado, borrado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (cuenta_id, tabla, id) DO UPDATE SET data = excluded.data, version = excluded.version,
      dispositivo = excluded.dispositivo, actualizado = excluded.actualizado, borrado = excluded.borrado`);
  const anotar = db.prepare('INSERT INTO cambios (cuenta_id, tabla, id) VALUES (?, ?, ?)');
  return enTransaccion(db, () => cambios.map((c) => {
    const actual = leer.get(cuentaId, c.tabla, c.id);
    if (yaAplicado.get(cuentaId, c.cambio)) return { cambio: c.cambio, estado: 'ok', version: actual ? actual.version : 0 };
    const mismaVersion = actual ? actual.version === c.base : c.base === 0;
    // Un reintento del mismo dispositivo sobre su propia escritura no es conflicto.
    const propio = actual && actual.dispositivo === dispositivo && c.base <= actual.version;
    if (!mismaVersion && !propio) {
      return { cambio: c.cambio, estado: 'conflicto', version: actual ? actual.version : 0,
        actual: actual ? { data: actual.borrado ? null : JSON.parse(actual.data), version: actual.version, dispositivo: actual.dispositivo, borrado: !!actual.borrado } : null };
    }
    const texto = c.op === 'put' ? JSON.stringify(c.data) : null;
    if (texto && texto.length > MAX_REGISTRO) throw errorPedido('registro demasiado grande');
    const version = (actual ? actual.version : 0) + 1;
    guardar.run(cuentaId, c.tabla, c.id, texto, version, dispositivo, Date.now(), c.op === 'delete' ? 1 : 0);
    anotar.run(cuentaId, c.tabla, c.id);
    marcar.run(cuentaId, c.cambio);
    return { cambio: c.cambio, estado: 'ok', version };
  }));
}

// Registros cambiados después de `desde` (último seq conocido). Un registro aparece una vez, con su estado actual.
function bajar(db, cuentaId, desde) {
  const filas = db.prepare(`SELECT MAX(c.seq) seq, r.tabla, r.id, r.data, r.version, r.dispositivo, r.borrado
    FROM cambios c JOIN registros r ON r.cuenta_id = c.cuenta_id AND r.tabla = c.tabla AND r.id = c.id
    WHERE c.cuenta_id = ? AND c.seq > ? GROUP BY r.tabla, r.id ORDER BY seq LIMIT 500`).all(cuentaId, desde);
  const cursor = filas.length ? filas[filas.length - 1].seq : desde;
  const { m } = db.prepare('SELECT COALESCE(MAX(seq), 0) m FROM cambios WHERE cuenta_id = ?').get(cuentaId);
  return {
    cambios: filas.map((f) => ({ seq: f.seq, tabla: f.tabla, id: f.id, version: f.version, dispositivo: f.dispositivo,
      borrado: !!f.borrado, data: f.borrado ? null : JSON.parse(f.data) })),
    cursor,
    pendiente: m > cursor
  };
}

module.exports = { subir, bajar, TABLAS };
