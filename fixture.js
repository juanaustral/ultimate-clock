/* Ultimate Clock · fixture del torneo. Lógica pura (sin DOM): cruces todos contra todos (método del círculo),
   eliminación simple con siembra, edición en cualquier momento y estado de cada cruce.
   El estado (pendiente / terminado) no se guarda: se deduce de los partidos guardados con `fixtureId`,
   así dos dispositivos que terminan cruces distintos no pisan el registro del torneo. */
(function (root) {
  'use strict';
  const TYPES = ['rr', 'elim'];

  const pairKey = (a, b) => [a, b].sort().join('|');

  /* Método del círculo: devuelve rondas con pares [local, visitante]; con equipos impares, uno queda libre por ronda. */
  function roundRobinRounds(ids) {
    const list = ids.slice();
    if (list.length % 2) list.push(null);
    const n = list.length, rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [], bye = [];
      for (let i = 0; i < n / 2; i++) {
        const a = list[i], b = list[n - 1 - i];
        if (a === null || b === null) { bye.push(a === null ? b : a); continue; }
        pairs.push(r % 2 && i === 0 ? [b, a] : [a, b]);
      }
      rounds.push({ pairs, bye });
      list.splice(1, 0, list.pop());
    }
    return rounds;
  }

  /* Posiciones de siembra: 1 contra el último, 2 contra el anteúltimo, etc. */
  function seedOrder(size) {
    let seeds = [1];
    while (seeds.length < size) { const len = seeds.length * 2; seeds = seeds.flatMap(s => [s, len + 1 - s]); }
    return seeds;
  }

  function generateElimination(ids) {
    let size = 2;
    while (size < ids.length) size *= 2;
    const seeds = seedOrder(size);
    const matches = [];
    const rounds = Math.log2(size);
    for (let r = 1; r <= rounds; r++) {
      const count = size / 2 ** r;
      for (let p = 0; p < count; p++) {
        const m = { id: `e-${r}-${p}`, round: r, pos: p, home: null, away: null };
        if (r === 1) { m.home = ids[seeds[2 * p] - 1] || null; m.away = ids[seeds[2 * p + 1] - 1] || null; }
        else m.from = [`e-${r - 1}-${2 * p}`, `e-${r - 1}-${2 * p + 1}`];
        matches.push(m);
      }
    }
    return matches;
  }

  /* Partido guardado de un cruce (si ya se jugó). */
  function playedFor(fixtureId, saved) {
    return (saved || []).find(m => m && m.status === 'saved' && m.fixtureId === fixtureId) || null;
  }
  function scoreOf(match) {
    const score = (root.UCTournament || (typeof require !== 'undefined' ? require('./tournament.js') : null))?.finalScore;
    return score ? score(match) : [Number(match.teams[0].score) || 0, Number(match.teams[1].score) || 0];
  }
  /* Resultado del cruce desde el punto de vista de local/visitante (los equipos del partido pueden estar en otro orden). */
  function resultOf(fm, home, away, saved) {
    const match = playedFor(fm.id, saved);
    if (!match) return null;
    const [s0, s1] = scoreOf(match);
    const t0 = match.teams[0].tid;
    const [h, a] = t0 === home ? [s0, s1] : t0 === away ? [s1, s0] : [s0, s1];
    return { matchId: match.id, home: h, away: a, winner: h > a ? home : a > h ? away : null };
  }

  /* Cruces con equipos resueltos y estado: 'pendiente', 'jugando' (si coincide activeFixtureId, un id o un Set de ids), 'terminado' o 'libre'. */
  function view(fixture, saved, activeFixtureId) {
    if (!fixture) return [];
    const byId = new Map(), out = [];
    for (const fm of fixture.matches) {
      let home = fm.home, away = fm.away;
      if (fm.from) { home = byId.get(fm.from[0])?.winner || null; away = byId.get(fm.from[1])?.winner || null; }
      const bye = fixture.type === 'elim' && fm.round === 1 && ((home && !away) || (!home && away));
      const result = home && away ? resultOf(fm, home, away, saved) : null;
      const winner = bye ? (home || away) : result?.winner || null;
      const active = activeFixtureId instanceof Set ? activeFixtureId.has(fm.id) : fm.id === activeFixtureId;
      const state = bye ? 'libre' : result ? 'terminado' : active ? 'jugando' : 'pendiente';
      const row = { ...fm, home, away, state, result, winner };
      byId.set(fm.id, row);
      out.push(row);
    }
    return out;
  }

  const startedIds = (fixture, saved, activeFixtureId) =>
    new Set(view(fixture, saved, activeFixtureId).filter(m => m.state === 'terminado' || m.state === 'jugando').map(m => m.id));

  /* Crea o regenera los cruces. Los terminados y los que se están jugando no se tocan. */
  function regenerate(tournament, type, saved, activeFixtureId) {
    const ids = tournament.teams.map(t => t.id);
    const old = tournament.fixture;
    type = TYPES.includes(type) ? type : (old?.type || 'rr');
    if (ids.length < 2) return { ok: false, reason: 'teams' };
    if (old && old.type !== type && startedIds(old, saved, activeFixtureId).size) return { ok: false, reason: 'started' };
    if (type === 'elim') {
      if (old && startedIds(old, saved, activeFixtureId).size) return { ok: false, reason: 'started' };
      return { ok: true, fixture: { type, matches: generateElimination(ids) } };
    }
    const keep = old && old.type === 'rr' ? startedIds(old, saved, activeFixtureId) : new Set();
    const kept = old && old.type === 'rr' ? old.matches.filter(m => keep.has(m.id)) : [];
    const covered = new Set(kept.map(m => pairKey(m.home, m.away)));
    const matches = kept.slice();
    roundRobinRounds(ids).forEach((round, i) => {
      round.pairs.forEach(([home, away], pos) => {
        if (covered.has(pairKey(home, away))) return;
        matches.push({ id: `rr-${home}-${away}`, round: i + 1, pos, home, away });
      });
    });
    matches.sort((a, b) => a.round - b.round || a.pos - b.pos);
    return { ok: true, fixture: { type, matches } };
  }

  /* Equipos ordenables: mueve un equipo una posición. No reasigna cruces ya jugados. */
  function moveTeam(tournament, teamId, delta) {
    const i = tournament.teams.findIndex(t => t.id === teamId), j = i + delta;
    if (i < 0 || j < 0 || j >= tournament.teams.length) return false;
    [tournament.teams[i], tournament.teams[j]] = [tournament.teams[j], tournament.teams[i]];
    return true;
  }

  /* Un equipo se puede dar de baja solo si no tiene cruces terminados ni en juego. */
  function canRemoveTeam(tournament, teamId, saved, activeFixtureId) {
    return !view(tournament.fixture, saved, activeFixtureId)
      .some(m => (m.home === teamId || m.away === teamId) && (m.state === 'terminado' || m.state === 'jugando'));
  }
  function removeTeam(tournament, teamId, saved, activeFixtureId) {
    if (!canRemoveTeam(tournament, teamId, saved, activeFixtureId)) return false;
    tournament.teams = tournament.teams.filter(t => t.id !== teamId);
    if (tournament.fixture) {
      if (tournament.fixture.type === 'rr') tournament.fixture.matches = tournament.fixture.matches.filter(m => m.home !== teamId && m.away !== teamId);
      else tournament.fixture = null; // el cuadro depende de la siembra: se vuelve a generar
    }
    return true;
  }

  function sanitize(input, teamIds) {
    if (!input || !TYPES.includes(input.type) || !Array.isArray(input.matches)) return null;
    const known = new Set(teamIds);
    const matches = [];
    for (const m of input.matches.slice(0, 2000)) {
      if (!m || typeof m.id !== 'string' || !Number.isInteger(m.round) || !Number.isInteger(m.pos)) continue;
      const side = v => (typeof v === 'string' && known.has(v) ? v : null);
      const row = { id: m.id.slice(0, 80), round: m.round, pos: m.pos, home: side(m.home), away: side(m.away) };
      if (Array.isArray(m.from) && m.from.length === 2 && m.from.every(x => typeof x === 'string')) row.from = m.from.slice();
      matches.push(row);
    }
    return { type: input.type, matches };
  }

  const api = { TYPES, roundRobinRounds, seedOrder, generateElimination, view, regenerate, moveTeam, canRemoveTeam, removeTeam, sanitize, playedFor };
  if (typeof module !== 'undefined') module.exports = api; else root.UCFixture = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
