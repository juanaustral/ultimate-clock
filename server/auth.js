'use strict';
// Contraseñas con scrypt (incluido en Node) y sesiones con token opaco:
// la base guarda solo el hash SHA-256 del token, nunca el token.
const crypto = require('node:crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };
const VIDA_SESION_MS = 30 * 24 * 3600 * 1000;
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const MIN_CLAVE = 10;

function hashClave(clave) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(clave, sal, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${sal.toString('base64')}$${h.toString('base64')}`;
}

function verificarClave(clave, guardado) {
  const [alg, N, r, p, sal, h] = String(guardado).split('$');
  if (alg !== 'scrypt') return false;
  const esperado = Buffer.from(h, 'base64');
  const calculado = crypto.scryptSync(clave, Buffer.from(sal, 'base64'), esperado.length,
    { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(esperado, calculado);
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Hash de una clave inexistente: iguala el tiempo de respuesta cuando el usuario no existe.
const HASH_FALSO = hashClave(crypto.randomBytes(8).toString('hex'));

function crearCuenta(db, usuario, clave) {
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(usuario)) throw new Error('usuario inválido');
  if (typeof clave !== 'string' || clave.length < MIN_CLAVE) {
    throw new Error(`la contraseña debe tener al menos ${MIN_CLAVE} caracteres`);
  }
  db.prepare('INSERT INTO cuentas (usuario, hash, creada) VALUES (?, ?, ?)')
    .run(usuario, hashClave(clave), Date.now());
}

function cambiarClave(db, usuario, clave) {
  if (typeof clave !== 'string' || clave.length < MIN_CLAVE) {
    throw new Error(`la contraseña debe tener al menos ${MIN_CLAVE} caracteres`);
  }
  const r = db.prepare('UPDATE cuentas SET hash = ? WHERE usuario = ?').run(hashClave(clave), usuario);
  if (!r.changes) throw new Error('la cuenta no existe');
  db.prepare('DELETE FROM sesiones WHERE cuenta_id = (SELECT id FROM cuentas WHERE usuario = ?)').run(usuario);
}

function bloqueado(db, usuario, ahora) {
  const { n } = db.prepare('SELECT COUNT(*) n FROM intentos WHERE usuario = ? AND momento > ?')
    .get(usuario, ahora - VENTANA_MS);
  return n >= MAX_INTENTOS;
}

// Devuelve { token, usuario } o { error: 'credenciales' | 'bloqueado' }.
function iniciarSesion(db, usuario, clave, ahora = Date.now()) {
  usuario = String(usuario || '');
  if (bloqueado(db, usuario, ahora)) return { error: 'bloqueado' };
  const cuenta = db.prepare('SELECT id, usuario, hash FROM cuentas WHERE usuario = ?').get(usuario);
  const ok = verificarClave(String(clave || ''), cuenta ? cuenta.hash : HASH_FALSO) && !!cuenta;
  if (!ok) {
    db.prepare('INSERT INTO intentos (usuario, momento) VALUES (?, ?)').run(usuario, ahora);
    return { error: 'credenciales' };
  }
  db.prepare('DELETE FROM intentos WHERE usuario = ?').run(usuario);
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sesiones (cuenta_id, token_hash, creada, vence) VALUES (?, ?, ?, ?)')
    .run(cuenta.id, hashToken(token), ahora, ahora + VIDA_SESION_MS);
  db.prepare('DELETE FROM sesiones WHERE vence < ?').run(ahora);
  return { token, usuario: cuenta.usuario };
}

function cuentaDeToken(db, token, ahora = Date.now()) {
  if (!token) return null;
  return db.prepare(`SELECT c.id, c.usuario FROM sesiones s JOIN cuentas c ON c.id = s.cuenta_id
    WHERE s.token_hash = ? AND s.vence > ?`).get(hashToken(token), ahora) || null;
}

function cerrarSesion(db, token) {
  if (token) db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(hashToken(token));
}

module.exports = { crearCuenta, cambiarClave, iniciarSesion, cuentaDeToken, cerrarSesion, hashClave, verificarClave, hashToken };
