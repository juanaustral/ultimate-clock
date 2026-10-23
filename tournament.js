/* Ultimate Clock · modo torneo. Lógica pura (sin DOM): fichas de equipo, jugadores, importación de listas,
   estadísticas y archivo de torneo. La pantalla vive en ultimate-clock.js. */
(function (root) {
  'use strict';
  const FORMAT = 'ultimate-clock-tournament';
  const LIMITS = { teams: 64, players: 60, name: 40, number: 3, tournaments: 12 };
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const isHex = value => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value));
  /* El número es opcional: vacío o hasta tres dígitos. */
  const cleanNumber = value => { const s = String(value ?? '').replace(/^#/, '').trim(); return /^\d{1,3}$/.test(s) ? String(Number(s)) : ''; };

  function makePlayer(name, number) {
    const clean = text(name, LIMITS.name);
    return clean ? { id: uid('player'), name: clean, number: cleanNumber(number) } : null;
  }
  function makeTeam(name, color) {
    const clean = text(name, LIMITS.name);
    return clean ? { id: uid('team'), name: clean, color: isHex(color) ? color : '#1b47e2', players: [] } : null;
  }
  const TIEBREAKS = ['diff', 'gf', 'h2h'];
  /* Puntos por resultado y orden de desempate: lo elige el usuario por torneo. Por defecto 3-1-0, diferencia, goles a favor, cabeza a cabeza. */
  function sanitizeScoring(input) {
    const n = (v, d) => (Number.isInteger(v) && v >= 0 && v <= 99 ? v : d);
    const order = Array.isArray(input?.tiebreaks) ? input.tiebreaks.filter((t, i, a) => TIEBREAKS.includes(t) && a.indexOf(t) === i) : [];
    for (const t of TIEBREAKS) if (!order.includes(t)) order.push(t);
    return { win: n(input?.win, 3), draw: n(input?.draw, 1), loss: n(input?.loss, 0), tiebreaks: order };
  }
  /* Marcador de un partido recalculado desde sus eventos (goles menos correcciones); sin eventos, el marcador guardado. */
  function finalScore(match) {
    /* Un resultado corregido a mano (desde el fixture) manda sobre los eventos. */
    const fixed = match?.scoreOverride;
    if (Array.isArray(fixed) && fixed.length === 2 && fixed.every(n => Number.isInteger(n) && n >= 0 && n <= 999)) return fixed.slice();
    const events = Array.isArray(match?.events) ? match.events : [];
    if (events.some(e => e.type === 'goal' || e.type === 'adjustment')) {
      const score = [0, 0];
      for (const e of events) {
        if (e.team !== 0 && e.team !== 1) continue;
        if (e.type === 'goal') score[e.team]++;
        else if (e.type === 'adjustment') score[e.team] = Math.max(0, score[e.team] - 1);
      }
      return score;
    }
    return [Number(match?.teams?.[0]?.score) || 0, Number(match?.teams?.[1]?.score) || 0];
  }
  function makeTournament(name) {
    const clean = text(name, LIMITS.name);
    return clean ? { id: uid('tournament'), name: clean, createdAt: new Date().toISOString(), timing: sanitizeTiming(null), scoring: sanitizeScoring(null), fixture: null, teams: [] } : null;
  }
  /* "#7 Ana", "7 - Ana", "Ana 7", "Ana, 7" o solo "Ana": una persona por línea. */
  function parsePlayers(input) {
    const out = [];
    for (const raw of String(input ?? '').split(/\r?\n|;/)) {
      const line = raw.trim().replace(/^[-•*]\s+/, '');
      if (!line) continue;
      let number = '', name = line, m;
      if ((m = line.match(/^#?(\d{1,3})\s*[-.,:)]?\s+(.+)$/))) { number = m[1]; name = m[2]; }
      else if ((m = line.match(/^(.+?)[\s,\-–]+#?(\d{1,3})$/))) { name = m[1]; number = m[2]; }
      const player = makePlayer(name.replace(/[,\-–\s]+$/, ''), number);
      if (player) out.push(player);
    }
    return out;
  }
  /* Lista de jugadores como texto, una persona por línea ("7 Ana"), y de vuelta: conserva el id de quien no cambió. */
  const rosterToText = players => (players || []).map(p => (p.number !== '' ? `${p.number} ${p.name}` : p.name)).join('\n');
  function rosterFromText(input, existing = []) {
    const used = new Set();
    return parsePlayers(input).slice(0, LIMITS.players).map(p => {
      const same = existing.find(e => !used.has(e.id) && e.name === p.name && e.number === p.number);
      if (same) { used.add(same.id); return same; }
      return p;
    });
  }
  const playerLabel = player => player ? (player.number !== '' ? `#${player.number} ${player.name}` : player.name) : '';
  const sortPlayers = players => [...players].sort((a, b) => (a.number === '' ) - (b.number === '') || (Number(a.number) - Number(b.number)) || a.name.localeCompare(b.name));

  /* Tiempos del torneo: un perfil oficial ('wfdf', 'usau') o uno propio, del que se guarda una copia para llevarlo en el archivo. */
  function sanitizeTiming(input) {
    const id = typeof input?.id === 'string' && input.id && input.id.length <= 80 ? input.id : 'wfdf';
    const official = id === 'wfdf' || id === 'usau';
    const config = !official && input?.config && typeof input.config === 'object' && !Array.isArray(input.config) ? JSON.parse(JSON.stringify(input.config)) : null;
    return { id: official || config ? id : 'wfdf', name: official ? '' : text(input?.name, LIMITS.name), config: official ? null : config };
  }
  /* Valida un torneo leído de un archivo o del almacenamiento. Devuelve una copia limpia o null. */
  /* Link público del fixture: lo activa el usuario; el slug va en la URL junto al nombre de la cuenta. */
  const slugify = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  function sanitizeShare(input) {
    if (!input || typeof input !== 'object') return null;
    const slug = slugify(input.slug);
    return slug ? { on: input.on === true, slug } : null;
  }
  function sanitize(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.teams)) return null;
    const name = text(input.name, LIMITS.name);
    if (!name) return null;
    const seen = new Set();
    const unique = (id, prefix) => { let next = typeof id === 'string' && id && !seen.has(id) ? id : uid(prefix); seen.add(next); return next; };
    const teams = [];
    for (const team of input.teams.slice(0, LIMITS.teams)) {
      const teamName = text(team?.name, LIMITS.name);
      if (!teamName) continue;
      const players = [];
      for (const p of (Array.isArray(team.players) ? team.players : []).slice(0, LIMITS.players)) {
        const playerName = text(p?.name, LIMITS.name);
        if (playerName) players.push({ id: unique(p.id, 'player'), name: playerName, number: cleanNumber(p.number) });
      }
      teams.push({ id: unique(team.id, 'team'), name: teamName, color: isHex(team.color) ? team.color : '#1b47e2', players });
    }
    const fixture = root.UCFixture ? root.UCFixture.sanitize(input.fixture, teams.map(t => t.id)) : (typeof require !== 'undefined' ? require('./fixture.js').sanitize(input.fixture, teams.map(t => t.id)) : null);
    const out = { id: typeof input.id === 'string' && input.id ? input.id : uid('tournament'), name, createdAt: typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString(), timing: sanitizeTiming(input.timing), scoring: sanitizeScoring(input.scoring), fixture, teams };
    if (input.format === 'rr' || input.format === 'elim') out.format = input.format;
    const share = sanitizeShare(input.share);
    if (share) out.share = share;
    return out;
  }

  /* Partidos guardados en los que juega algún equipo del torneo (los equipos se vinculan con `tid`). */
  function tournamentMatches(tournament, matches) {
    const ids = new Set((tournament?.teams || []).map(team => team.id));
    return (matches || []).filter(match => match?.status === 'saved' && (match.teams || []).some(team => ids.has(team.tid)));
  }
  /* Goles y pases por jugador. Se cuenta por id; los goles escritos a mano ("Otro") no suman a nadie. */
  function stats(tournament, matches) {
    const rows = new Map();
    for (const team of tournament?.teams || []) for (const p of team.players) rows.set(p.id, { player: p, team, goals: 0, assists: 0 });
    for (const match of tournamentMatches(tournament, matches)) {
      for (const event of match.events || []) {
        if (event.type !== 'goal') continue;
        if (rows.has(event.scorerId)) rows.get(event.scorerId).goals++;
        if (rows.has(event.assistId)) rows.get(event.assistId).assists++;
      }
    }
    return [...rows.values()].filter(r => r.goals || r.assists).sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.goals - a.goals || a.player.name.localeCompare(b.player.name));
  }
  /* Tabla de posiciones con los partidos guardados entre equipos del torneo, según los puntos y desempates del torneo. */
  function standings(tournament, matches) {
    const sc = sanitizeScoring(tournament?.scoring);
    const rows = new Map((tournament?.teams || []).map(team => [team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }]));
    const duels = [];
    for (const match of matches || []) {
      if (match?.status !== 'saved' || !Array.isArray(match.teams) || match.teams.length !== 2) continue;
      const [a, b] = match.teams.map(team => rows.get(team?.tid));
      if (!a || !b || a === b) continue;
      const [sa, sb] = finalScore(match);
      for (const [row, f, c] of [[a, sa, sb], [b, sb, sa]]) {
        row.played++; row.gf += f; row.ga += c;
        if (f > c) { row.won++; row.points += sc.win; } else if (f === c) { row.drawn++; row.points += sc.draw; } else { row.lost++; row.points += sc.loss; }
      }
      duels.push({ a, b, sa, sb });
    }
    /* Cabeza a cabeza: puntos solo en los partidos entre los equipos empatados. */
    const miniPoints = group => {
      const pts = new Map(group.map(r => [r, 0]));
      for (const { a, b, sa, sb } of duels) {
        if (!pts.has(a) || !pts.has(b)) continue;
        pts.set(a, pts.get(a) + (sa > sb ? sc.win : sa === sb ? sc.draw : sc.loss));
        pts.set(b, pts.get(b) + (sb > sa ? sc.win : sa === sb ? sc.draw : sc.loss));
      }
      return pts;
    };
    const keyFor = (name, group) => {
      if (name === 'diff') return r => r.gf - r.ga;
      if (name === 'gf') return r => r.gf;
      const pts = miniPoints(group);
      return r => pts.get(r);
    };
    const resolve = (group, order) => {
      if (group.length < 2) return group;
      if (!order.length) return group.slice().sort((x, y) => x.team.name.localeCompare(y.team.name));
      const key = keyFor(order[0], group);
      const sorted = group.slice().sort((x, y) => key(y) - key(x));
      const out = [];
      for (let i = 0; i < sorted.length;) {
        let j = i;
        while (j < sorted.length && key(sorted[j]) === key(sorted[i])) j++;
        out.push(...resolve(sorted.slice(i, j), order.slice(1)));
        i = j;
      }
      return out;
    };
    const all = [...rows.values()].sort((x, y) => y.points - x.points);
    const out = [];
    for (let i = 0; i < all.length;) {
      let j = i;
      while (j < all.length && all[j].points === all[i].points) j++;
      out.push(...resolve(all.slice(i, j), sc.tiebreaks));
      i = j;
    }
    return out;
  }
  /* Partidos del torneo entre dos de sus equipos, del más reciente al más antiguo. */
  function results(tournament, matches) {
    const ids = new Set((tournament?.teams || []).map(team => team.id));
    return (matches || []).filter(m => m?.status === 'saved' && Array.isArray(m.teams) && m.teams.length === 2 && m.teams.every(team => ids.has(team?.tid)))
      .sort((x, y) => String(y.savedAt).localeCompare(String(x.savedAt)));
  }
  /* Historial de un equipo: partidos del torneo con su resultado, goles a favor y en contra, y goleadores y pases. */
  function teamHistory(tournament, matches, teamId) {
    const team = (tournament?.teams || []).find(x => x.id === teamId);
    if (!team) return null;
    const games = [];
    const out = { team, games, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, players: [] };
    for (const match of results(tournament, matches).reverse()) {
      const i = match.teams.findIndex(x => x.tid === teamId);
      if (i < 0) continue;
      const score = finalScore(match), f = score[i], c = score[1 - i];
      const rival = (tournament.teams.find(x => x.id === match.teams[1 - i].tid) || {}).name || match.teams[1 - i].name;
      games.push({ id: match.id, savedAt: match.savedAt, rival, gf: f, ga: c, result: f > c ? 'G' : f === c ? 'E' : 'P' });
      out.played++; out.gf += f; out.ga += c;
      if (f > c) out.won++; else if (f === c) out.drawn++; else out.lost++;
    }
    out.players = stats(tournament, matches).filter(r => r.team.id === teamId);
    return out;
  }
  function exportPayload(tournament, matches) {
    return { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), tournament, matches: tournamentMatches(tournament, matches) };
  }
  /* Lee un archivo de torneo. Devuelve {tournament, matches} o null si no es válido. */
  function parseFile(raw) {
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
    if (!data || data.format !== FORMAT || data.version !== 1) return null;
    const tournament = sanitize(data.tournament);
    if (!tournament) return null;
    const matches = (Array.isArray(data.matches) ? data.matches : []).filter(m => m && typeof m.id === 'string' && m.status === 'saved' && Array.isArray(m.teams) && m.teams.length === 2 && m.clock && Array.isArray(m.events));
    return { tournament, matches };
  }
  const csvCell = value => { let s = String(value ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  /* Jugadores con sus goles y pases: una fila por jugador, incluso sin estadísticas. */
  function statsCSV(tournament, matches, labels = {}) {
    const byId = new Map(stats(tournament, matches).map(r => [r.player.id, r]));
    const head = [labels.team || 'equipo', labels.number || 'numero', labels.player || 'jugador', labels.goals || 'goles', labels.assists || 'pases'];
    const rows = [head];
    for (const team of tournament.teams) for (const p of sortPlayers(team.players)) { const r = byId.get(p.id); rows.push([team.name, p.number, p.name, r ? r.goals : 0, r ? r.assists : 0]); }
    return '﻿' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }

  const api = { slugify, sanitizeShare, FORMAT, LIMITS, TIEBREAKS, teamHistory, sanitizeScoring, finalScore, cleanNumber, makePlayer, makeTeam, makeTournament, sanitizeTiming, parsePlayers, rosterToText, rosterFromText, playerLabel, sortPlayers, sanitize, tournamentMatches, stats, standings, results, exportPayload, parseFile, statsCSV };
  if (typeof module !== 'undefined') module.exports = api; else root.UCTournament = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
