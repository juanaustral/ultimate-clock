'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { abrir } = require('../server/db');
const auth = require('../server/auth');
const sync = require('../server/sync');

function base() {
  const db = abrir(':memory:');
  auth.crearCuenta(db, 'Mendoza', 'clave-de-prueba-1');
  auth.crearCuenta(db, 'Santafe', 'otra-clave-123');
  const id = (u) => db.prepare('SELECT id FROM cuentas WHERE usuario = ?').get(u).id;
  return { db, a: id('Mendoza'), b: id('Santafe') };
}
const put = (cambio, id, base, data = { n: 1 }, tabla = 'partidos') => ({ cambio, tabla, id, op: 'put', base, data });

test('crear un registro y bajarlo desde otro dispositivo', () => {
  const { db, a } = base();
  const r = sync.subir(db, a, 'tel1', [put('c1', 'm1', 0, { match: 'uno' })]);
  assert.deepStrictEqual(r[0], { cambio: 'c1', estado: 'ok', version: 1 });
  const bajada = sync.bajar(db, a, 0);
  assert.strictEqual(bajada.cambios.length, 1);
  assert.deepStrictEqual(bajada.cambios[0].data, { match: 'uno' });
  assert.strictEqual(sync.bajar(db, a, bajada.cursor).cambios.length, 0);
});

test('reenviar el mismo cambio no duplica ni sube la versión', () => {
  const { db, a } = base();
  sync.subir(db, a, 'tel1', [put('c1', 'm1', 0)]);
  const r = sync.subir(db, a, 'tel1', [put('c1', 'm1', 0)]);
  assert.strictEqual(r[0].estado, 'ok');
  assert.strictEqual(r[0].version, 1);
  assert.strictEqual(sync.bajar(db, a, 0).cambios.length, 1);
});

test('dos dispositivos sobre el mismo registro: el segundo recibe conflicto con el dato actual', () => {
  const { db, a } = base();
  sync.subir(db, a, 'tel1', [put('c1', 't1', 0, { v: 'del-1' }, 'torneos')]);
  const r = sync.subir(db, a, 'tel2', [put('c2', 't1', 0, { v: 'del-2' }, 'torneos')]);
  assert.strictEqual(r[0].estado, 'conflicto');
  assert.strictEqual(r[0].actual.dispositivo, 'tel1');
  assert.deepStrictEqual(r[0].actual.data, { v: 'del-1' });
  // elegir "este dispositivo es el oficial": reenviar con la versión actual
  const ok = sync.subir(db, a, 'tel2', [put('c3', 't1', r[0].version, { v: 'del-2' }, 'torneos')]);
  assert.strictEqual(ok[0].estado, 'ok');
  assert.strictEqual(ok[0].version, 2);
});

test('partidos distintos desde dos dispositivos no se pisan', () => {
  const { db, a } = base();
  sync.subir(db, a, 'tel1', [put('c1', 'm1', 0)]);
  sync.subir(db, a, 'tel2', [put('c2', 'm2', 0)]);
  assert.deepStrictEqual(sync.bajar(db, a, 0).cambios.map((c) => c.id).sort(), ['m1', 'm2']);
});

test('una cuenta no ve los datos de otra', () => {
  const { db, a, b } = base();
  sync.subir(db, a, 'tel1', [put('c1', 'm1', 0)]);
  assert.strictEqual(sync.bajar(db, b, 0).cambios.length, 0);
  // mismo id y mismo uuid de cambio en otra cuenta: independientes
  assert.strictEqual(sync.subir(db, b, 'tel9', [put('c1', 'm1', 0)])[0].estado, 'ok');
});

test('borrar deja una baja que los demás dispositivos reciben', () => {
  const { db, a } = base();
  sync.subir(db, a, 'tel1', [put('c1', 'm1', 0)]);
  sync.subir(db, a, 'tel1', [{ cambio: 'c2', tabla: 'partidos', id: 'm1', op: 'delete', base: 1 }]);
  const c = sync.bajar(db, a, 0).cambios[0];
  assert.strictEqual(c.borrado, true);
  assert.strictEqual(c.data, null);
});

test('rechaza tablas y cambios inválidos', () => {
  const { db, a } = base();
  assert.throws(() => sync.subir(db, a, 'tel1', [put('c1', 'x', 0, {}, 'cuentas')]));
  assert.throws(() => sync.subir(db, a, 'tel1', [put('c1', 'x', -1)]));
  assert.throws(() => sync.subir(db, a, '', [put('c1', 'x', 0)]));
});

test('la API exige sesión y sincroniza por HTTP', async () => {
  const http = require('node:http');
  const { crearManejador } = require('../server/app');
  const { db, a } = base();
  const srv = http.createServer(crearManejador(db));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + srv.address().port + '/api';
  assert.strictEqual((await fetch(url + '/sync/bajar')).status, 401);
  const { token } = await (await fetch(url + '/login', { method: 'POST', body: JSON.stringify({ usuario: 'Mendoza', clave: 'clave-de-prueba-1' }) })).json();
  const h = { Authorization: 'Bearer ' + token };
  const s = await fetch(url + '/sync/subir', { method: 'POST', headers: h, body: JSON.stringify({ dispositivo: 'tel1', cambios: [put('c1', 'm1', 0)] }) });
  assert.strictEqual((await s.json()).resultados[0].estado, 'ok');
  const b = await (await fetch(url + '/sync/bajar?desde=0', { headers: h })).json();
  assert.strictEqual(b.cambios.length, 1);
  assert.strictEqual((await fetch(url + '/sync/bajar?desde=-3', { headers: h })).status, 400);
  void a;
  srv.closeAllConnections(); srv.close();
});

test('el partido en curso de cada dispositivo es un registro propio y otro dispositivo puede bajarlo',() => {
  const { db, a } = base();
  sync.subir(db, a, 'tel1', [put('c1', 'tel1', 0, { id: 'm', events: [1] }, 'partidoActivo')]);
  sync.subir(db, a, 'tel1', [put('c2', 'tel1', 1, { id: 'm', events: [1, 2] }, 'partidoActivo')]);
  const b = sync.bajar(db, a, 0).cambios;
  assert.strictEqual(b.length, 1);
  assert.deepStrictEqual(b[0].data.events, [1, 2]);
  // quien retoma borra el registro del otro dispositivo
  sync.subir(db, a, 'tel2', [{ cambio: 'd1', tabla: 'partidoActivo', id: 'tel1', op: 'delete', base: 2 }]);
  assert.strictEqual(sync.bajar(db, a, 0).cambios[0].borrado, true);
});

test('link público: solo el torneo compartido, sin la plantilla ni otras cuentas (goleadores sí, DEC-031)', () => {
  const publico = require('../server/publico');
  const { db, a, b } = base();
  const torneo = (on) => ({ tournament: { id: 't1', name: 'Copa', teams: [{ id: 'A', name: 'Pumas', color: '#c62525', players: [{ id: 'p', name: 'Ana', number: '7' }] }, { id: 'B', name: 'Toros', color: '#000000', players: [] }], fixture: { type: 'rr', matches: [{ id: 'rr-A-B', round: 1, pos: 0, home: 'A', away: 'B' }] }, share: { on, slug: 'copa' } } });
  sync.subir(db, a, 'tel1', [put('c1', 't1', 0, torneo(false), 'torneos')]);
  assert.strictEqual(publico.obtener(db, 'mendoza', 'copa'), null);
  sync.subir(db, a, 'tel1', [put('c2', 't1', 1, torneo(true), 'torneos')]);
  sync.subir(db, a, 'tel1', [put('c3', 'm1', 0, { match: { id: 'm1', status: 'saved', fixtureId: 'rr-A-B', teams: [{ tid: 'A', name: 'Pumas', score: 2 }, { tid: 'B', name: 'Toros', score: 1 }], events: [{ type: 'goal', team: 0, scorer: 'Ana', scorerId: 'p' }] } })]);
  sync.subir(db, a, 'tel2', [put('c4', 'tel2', 0, { id: 'x', status: 'active', fixtureId: 'rr-A-B', teams: [{ tid: 'A', score: 3 }, { tid: 'B', score: 0 }], clock: { elapsed: 60 } }, 'partidoActivo')]);
  const r = publico.obtener(db, 'Mendoza', 'copa');
  assert.ok(r);
  assert.deepStrictEqual(r.torneo.teams[0].players, []);
  assert.deepStrictEqual(r.partidos[0].events, [{ type: 'goal', team: 0 }]);
  assert.strictEqual(r.vivos[0].teams[0].score, 3);
  assert.strictEqual(r.partidos[0].eventos[0].scorer, 'Ana'); // el goleador figura en el feed del partido
  assert.ok(!JSON.stringify(r).includes('"number"') && !JSON.stringify(r).includes('"players":[{'), 'la plantilla (números y jugadores sin goles) no se publica');
  assert.strictEqual(publico.obtener(db, 'Santafe', 'copa'), null);
  assert.strictEqual(publico.obtener(db, 'Mendoza', '../x'), null);
  void b;
});
