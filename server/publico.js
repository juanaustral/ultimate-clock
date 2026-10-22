'use strict';
// Vista pública de un torneo compartido (link "en vivo"): sin sesión y solo lectura. Devuelve equipos, fixture, resultados
// y los partidos en curso; nunca jugadores, eventos detallados ni datos de la cuenta. Solo si el torneo tiene share.on.
const CACHE_MS = 3000;
const VIVO_MAX_MS = 6 * 3600 * 1000;
const cache = new Map();

const slugValido = (s) => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s);
const texto = (v, max = 60) => String(v ?? '').slice(0, max);
const color = (v) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v)) ? v : '#1b47e2');
const leer = (txt) => { try { return JSON.parse(txt); } catch { return null; } };

function limpiarPartido(m) {
  const out = {
    id: texto(m.id, 80), status: 'saved', fixtureId: texto(m.fixtureId, 80), savedAt: texto(m.savedAt, 40),
    teams: (m.teams || []).slice(0, 2).map((t) => ({ tid: texto(t.tid, 80), name: texto(t.name), color: color(t.color), score: Number(t.score) || 0 })),
    // Solo lo necesario para recalcular el marcador (goles y correcciones), sin quién hizo cada gol.
    events: (m.events || []).filter((e) => e && (e.type === 'goal' || e.type === 'adjustment') && (e.team === 0 || e.team === 1)).map((e) => ({ type: e.type, team: e.team }))
  };
  if (Array.isArray(m.scoreOverride) && m.scoreOverride.length === 2) out.scoreOverride = m.scoreOverride.map((n) => Number(n) || 0);
  return out;
}
function limpiarVivo(m) {
  return {
    fixtureId: texto(m.fixtureId, 80), half: Number(m.half) || 1,
    teams: (m.teams || []).slice(0, 2).map((t) => ({ tid: texto(t.tid, 80), score: Number(t.score) || 0 })),
    clock: { elapsed: Number(m.clock?.elapsed) || 0, running: !!m.clock?.running, startedAt: Number(m.clock?.startedAt) || null }
  };
}

function obtener(db, usuario, slug) {
  if (typeof usuario !== 'string' || !usuario || usuario.length > 64 || !slugValido(slug)) return null;
  const clave = usuario.toLowerCase() + '/' + slug;
  const hit = cache.get(clave);
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.v;
  const v = armar(db, usuario, slug);
  if (!v) { cache.delete(clave); return null; } // un "no encontrado" no se guarda: el link funciona apenas se comparte
  cache.set(clave, { t: Date.now(), v });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return v;
}

function armar(db, usuario, slug) {
  const cuenta = db.prepare('SELECT id FROM cuentas WHERE usuario = ?').get(usuario);
  if (!cuenta) return null;
  const filas = (tabla) => db.prepare('SELECT data, actualizado FROM registros WHERE cuenta_id = ? AND tabla = ? AND borrado = 0').all(cuenta.id, tabla);
  let torneo = null;
  for (const f of filas('torneos')) {
    const t = leer(f.data)?.tournament;
    if (t && t.share && t.share.on === true && t.share.slug === slug) { torneo = t; break; }
  }
  if (!torneo) return null;
  const equipos = (torneo.teams || []).map((t) => ({ id: texto(t.id, 80), name: texto(t.name), color: color(t.color), players: [] }));
  const ids = new Set(equipos.map((t) => t.id));
  const cruces = new Set((torneo.fixture?.matches || []).map((m) => m.id));
  const partidos = [];
  for (const f of filas('partidos')) {
    const m = leer(f.data)?.match;
    if (m && m.status === 'saved' && (m.teams || []).some((t) => ids.has(t.tid))) partidos.push(limpiarPartido(m));
  }
  const vivos = [];
  for (const f of filas('partidoActivo')) {
    const m = leer(f.data);
    if (m && m.status !== 'saved' && m.fixtureId && cruces.has(m.fixtureId) && Date.now() - f.actualizado < VIVO_MAX_MS) vivos.push(limpiarVivo(m));
  }
  return {
    torneo: { id: texto(torneo.id, 80), name: texto(torneo.name), teams: equipos, fixture: torneo.fixture || null, scoring: torneo.scoring || null, format: torneo.format || null },
    partidos, vivos, usuario: texto(usuario, 64), actualizado: Date.now()
  };
}

module.exports = { obtener, limpiarPartido, slugValido };
