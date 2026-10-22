'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { abrir } = require('../server/db');
const auth = require('../server/auth');
const { crearManejador } = require('../server/app');

function levantar() {
  const db = abrir(':memory:');
  const srv = http.createServer(crearManejador(db));
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => {
    const base = 'http://127.0.0.1:' + srv.address().port + '/api';
    r({ db, srv, base });
  }));
}
const post = (base, ruta, cuerpo, token) => fetch(base + ruta, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  body: JSON.stringify(cuerpo || {})
});

test('la contraseña no queda en claro y el token se guarda solo como hash', async () => {
  const { db, srv, base } = await levantar();
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  const fila = db.prepare('SELECT hash FROM cuentas').get();
  assert.ok(!fila.hash.includes('clave-de-prueba-1'));
  const r = await post(base, '/login', { usuario: 'mendoza', clave: 'clave-de-prueba-1' });
  const { token } = await r.json();
  assert.ok(token);
  const filaS = db.prepare('SELECT token_hash FROM sesiones').get();
  assert.notStrictEqual(filaS.token_hash, token);
  srv.closeAllConnections(); srv.close();
});

test('login, /me y logout', async () => {
  const { db, srv, base } = await levantar();
  auth.crearCuenta(db, 'Santafe', 'otra-clave-123');
  const l = await post(base, '/login', { usuario: 'Santafe', clave: 'otra-clave-123' });
  assert.strictEqual(l.status, 200);
  const { token } = await l.json();
  const me = await fetch(base + '/me', { headers: { Authorization: 'Bearer ' + token } });
  assert.strictEqual((await me.json()).usuario, 'Santafe');
  await post(base, '/logout', {}, token);
  const despues = await fetch(base + '/me', { headers: { Authorization: 'Bearer ' + token } });
  assert.strictEqual(despues.status, 401);
  srv.closeAllConnections(); srv.close();
});

test('error genérico igual para usuario inexistente y clave errónea', async () => {
  const { db, srv, base } = await levantar();
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  const a = await post(base, '/login', { usuario: 'Mendoza', clave: 'mala' });
  const b = await post(base, '/login', { usuario: 'nadie', clave: 'mala' });
  assert.strictEqual(a.status, 401);
  assert.deepStrictEqual(await a.json(), await b.json());
  srv.closeAllConnections(); srv.close();
});

test('bloquea tras 5 intentos fallidos aun con la clave correcta', async () => {
  const { db, srv, base } = await levantar();
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  for (let i = 0; i < 5; i++) await post(base, '/login', { usuario: 'Mendoza', clave: 'x' + i });
  const r = await post(base, '/login', { usuario: 'Mendoza', clave: 'clave-de-prueba-1' });
  assert.strictEqual(r.status, 429);
  srv.closeAllConnections(); srv.close();
});

test('sesión vencida no sirve', () => {
  const db = abrir(':memory:');
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  const { token } = auth.iniciarSesion(db, 'Mendoza', 'clave-de-prueba-1', 1000);
  assert.ok(auth.cuentaDeToken(db, token, 2000));
  assert.strictEqual(auth.cuentaDeToken(db, token, 1000 + 31 * 24 * 3600 * 1000), null);
});

test('cambiar la clave cierra las sesiones abiertas', () => {
  const db = abrir(':memory:');
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  const { token } = auth.iniciarSesion(db, 'Mendoza', 'clave-de-prueba-1');
  auth.cambiarClave(db, 'Mendoza', 'clave-nueva-123');
  assert.strictEqual(auth.cuentaDeToken(db, token), null);
  assert.ok(auth.iniciarSesion(db, 'Mendoza', 'clave-nueva-123').token);
});

test('rechaza contraseñas cortas y cuerpos enormes', async () => {
  const { db, srv, base } = await levantar();
  assert.throws(() => auth.crearCuenta(db, 'Mendoza', 'corta'));
  const r = await post(base, '/login', { usuario: 'a', clave: 'x'.repeat(100000) });
  assert.strictEqual(r.status, 413);
  srv.closeAllConnections(); srv.close();
});
