const test = require('node:test');
const assert = require('node:assert/strict');
const { limpiarEventos, limpiarVivo, limpiarPartido } = require('../server/publico');

const equipos = [{ tid: 'A', name: 'Pumas', score: 2 }, { tid: 'B', name: 'Toros', score: 1 }];

test('eventos públicos: goles con goleador y pase, medio tiempo, time outs y llamados; sin ruido de otros relojes', () => {
  const ev = limpiarEventos({ id: 'm1', fixtureId: 'rr-A-B', teams: equipos, events: [
    { id: 'e1', type: 'start', timer: 'clock', at: '2026-10-23T10:00:00Z', elapsed: 0 },
    { id: 'e2', type: 'start', timer: 'pull', at: '2026-10-23T10:00:05Z', elapsed: 5 },
    { id: 'e3', type: 'goal', team: 0, scorer: 'Ana', assist: 'Beto', at: '2026-10-23T10:05:00Z', elapsed: 300 },
    { id: 'e4', type: 'limit', timer: 'call-0', label: 'x' },
    { id: 'e5', type: 'timeout', team: 1, at: '2026-10-23T10:06:00Z', elapsed: 360 },
    { id: 'e6', type: 'call', team: 1, label: 'Stall', timer: 'call-1' },
    { id: 'e7', type: 'half', label: 'Inicio del medio tiempo' },
    { id: 'e8', type: 'joined', team: 0 },
    { id: 'e9', type: 'incident', label: 'Falta', note: 'x'.repeat(500) }
  ] });
  assert.deepEqual(ev.map((e) => e.id), ['e1', 'e3', 'e5', 'e6', 'e7', 'e9']);
  const gol = ev.find((e) => e.id === 'e3');
  assert.deepEqual([gol.scorer, gol.assist, gol.tid, gol.match, gol.elapsed], ['Ana', 'Beto', 'A', 'rr-A-B', 300]);
  assert.equal(ev.find((e) => e.id === 'e5').tid, 'B');
  assert.equal(ev.find((e) => e.id === 'e9').note.length, 120);
});

test('partido en curso: reloj, descanso, time outs usados y eventos', () => {
  const v = limpiarVivo({ fixtureId: 'rr-A-B', half: 1, teams: equipos, clock: { elapsed: 600, running: false }, breakTimer: { running: true }, timeoutState: { usages: [1, 0] }, events: [{ id: 'g', type: 'goal', team: 1, scorer: 'Caro' }] });
  assert.equal(v.descanso, true);
  assert.deepEqual(v.timeouts, [1, 0]);
  assert.equal(v.eventos[0].scorer, 'Caro');
  assert.equal(limpiarVivo({ fixtureId: 'x', half: 2, teams: equipos, breakTimer: { running: true } }).descanso, false);
});

test('partido guardado: conserva sus eventos para las estadísticas', () => {
  const p = limpiarPartido({ id: 'm1', status: 'saved', fixtureId: 'rr-A-B', teams: equipos, events: [{ id: 'g', type: 'goal', team: 0, scorer: 'Ana' }, { id: 'c', type: 'correction', note: 'privado' }] });
  assert.deepEqual(p.events, [{ type: 'goal', team: 0 }]);
  assert.deepEqual(p.eventos.map((e) => e.id), ['g']);
});
