/* Ultimate Clock · modo torneo. Lógica pura (sin DOM): fichas de equipo, jugadores, importación de listas,
   estadísticas y archivo de torneo. La pantalla vive en ultimate-clock.js. */
(function (root) {
  'use strict';
  const FORMAT = 'ultimate-clock-tournament';
  const LIMITS = { teams: 64, players: 60, name: 40, number: 3 };
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
  function makeTournament(name) {
    const clean = text(name, LIMITS.name);
    return clean ? { id: uid('tournament'), name: clean, createdAt: new Date().toISOString(), teams: [] } : null;
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

  /* Valida un torneo leído de un archivo o del almacenamiento. Devuelve una copia limpia o null. */
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
    return { id: typeof input.id === 'string' && input.id ? input.id : uid('tournament'), name, createdAt: typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString(), teams };
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

  const api = { FORMAT, LIMITS, cleanNumber, makePlayer, makeTeam, makeTournament, parsePlayers, rosterToText, rosterFromText, playerLabel, sortPlayers, sanitize, tournamentMatches, stats, exportPayload, parseFile, statsCSV };
  if (typeof module !== 'undefined') module.exports = api; else root.UCTournament = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
