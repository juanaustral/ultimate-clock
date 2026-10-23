/* Ultimate Clock · fixture en vivo (página pública, solo lectura). Lee /api/publico/<usuario>/<torneo> cada pocos segundos
   y dibuja: partidos en juego con reloj, fixture con logos, posiciones, feed en vivo y estadísticas por partido y por equipo.
   No guarda nada en el dispositivo. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const user = params.get('u') || '', slug = params.get('t') || '';
  const lang = UCI18N.initial(null);
  const t = (s, v) => UCI18N.t(lang, s, v);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const main = document.getElementById('vivo'), updated = document.getElementById('vivoUpdated'), liveTag = document.getElementById('vivoLive'), sheet = document.getElementById('vivoSheet');
  const wide = window.matchMedia('(min-width: 900px)');
  let data = null, last = 0, timer = null, offline = false;
  let filter = 'all', openPanel = null; // openPanel: { kind: 'match' | 'team', id }
  const seen = new Set(), lastScore = new Map();

  document.documentElement.lang = lang;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
  liveTag.querySelector('span').textContent = t('EN VIVO');

  /* ---------- Datos derivados ---------- */
  const teamsMap = () => new Map((data.torneo.teams || []).map(x => [x.id, x]));
  const clock = v => v.clock.elapsed + (v.clock.running && v.clock.startedAt ? Math.max(0, Date.now() - v.clock.startedAt) / 1000 : 0);
  const mmss = sec => { const s = Math.max(0, Math.floor(sec)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const minute = e => `${Math.floor((e.elapsed || 0) / 60) + 1}'`;
  const when = e => Date.parse(e.at) || 0;

  /* Cada cruce con su estado, su resultado y todos sus eventos (partido guardado o en curso). */
  function model() {
    const tour = data.torneo, teams = teamsMap();
    const vivos = new Map((data.vivos || []).map(v => [v.fixtureId, v]));
    const rows = tour.fixture ? UCFixture.view(tour.fixture, data.partidos, new Set(vivos.keys())) : [];
    const events = new Map(), all = new Map();
    for (const src of [...(data.partidos || []).map(p => p.eventos || []), ...(data.vivos || []).map(v => v.eventos || [])]) {
      for (const e of src) { if (!all.has(e.id)) all.set(e.id, e); }
    }
    for (const e of all.values()) { if (!events.has(e.match)) events.set(e.match, []); events.get(e.match).push(e); }
    for (const list of events.values()) list.sort((a, b) => when(a) - when(b) || a.elapsed - b.elapsed);
    return { tour, teams, vivos, rows, events, all: [...all.values()].sort((a, b) => when(b) - when(a) || b.elapsed - a.elapsed) };
  }
  const rowOf = (m, id) => m.rows.find(r => r.id === id);
  const scoreOf = (m, row) => {
    const v = m.vivos.get(row.id);
    if (row.result) return [row.result.home, row.result.away];
    if (v && row.state === 'jugando') { const s = [v.teams[0].score, v.teams[1].score]; return v.teams[0].tid === row.home ? s : [s[1], s[0]]; }
    return null;
  };

  /* ---------- Piezas ---------- */
  const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function badge(team, size = 36) {
    if (!team) return `<span class="vv-badge is-tbd" style="--s:${size}px">?</span>`;
    if (team.logo) return `<img class="vv-badge" style="--s:${size}px" src="${esc(team.logo)}" alt="" width="${size}" height="${size}">`;
    return `<span class="vv-badge" style="--s:${size}px;background:${esc(team.color)}" aria-hidden="true">${esc(initials(team.name))}</span>`;
  }
  const nameOf = (m, id) => esc(m.teams.get(id)?.name || t('A definir'));
  const tagFor = row => row.state === 'jugando' ? `<span class="fx-tag is-live"><i aria-hidden="true"></i>${esc(t('EN JUEGO'))}</span>` : row.state === 'terminado' ? `<span class="fx-tag is-done">${esc(t('FINALIZADO'))}</span>` : `<span class="fx-tag">${esc(t('PRÓXIMO'))}</span>`;

  /* Texto corto de un evento (última jugada de la tarjeta en vivo). */
  function plain(e, m) {
    const team = m.teams.get(e.tid)?.name || '';
    return { goal: t('Gol de {team}', { team }), start: t('Comienza el partido'), half: t('Medio tiempo'), timeout: t('Time out de {team}', { team }), call: t('Llamado de {team}', { team }),
      incident: t('Incidencia'), limit: t(e.label || 'Tiempo cumplido'), saved: t('Final'), 'manual-result': t('Final') }[e.type] || '';
  }

  /* Una línea del feed. */
  function line(e, m, showMatch) {
    const row = rowOf(m, e.match), team = e.tid ? m.teams.get(e.tid) : null;
    let icon = '•', text = '';
    switch (e.type) {
      case 'goal': icon = '⚽'; text = `<b>${esc(t('Gol de {team}', { team: team?.name || '' }))}</b>${e.scorer ? ` — ${esc(e.scorer)}` : ''}${e.assist ? ` <small>(${esc(t('pase de {name}', { name: e.assist }))})</small>` : ''}`; break;
      case 'start': icon = '▶'; text = `<b>${esc(t('Comienza el partido'))}</b>`; break;
      case 'half': icon = '⏸'; text = `<b>${esc(t('Medio tiempo'))}</b>`; break;
      case 'timeout': icon = '⏱'; text = `<b>${esc(t('Time out de {team}', { team: team?.name || '' }))}</b>`; break;
      case 'call': icon = '📣'; text = `${esc(t('Llamado de {team}', { team: team?.name || '' }))}${e.label ? `: ${esc(t(e.label))}` : ''}`; break;
      case 'incident': icon = '⚠'; text = `${esc(t('Incidencia'))}${e.label ? `: ${esc(e.label)}` : ''}${e.note ? ` <small>${esc(e.note)}</small>` : ''}`; break;
      case 'limit': icon = '⌛'; text = esc(t(e.label || 'Tiempo cumplido')); break;
      case 'saved': case 'manual-result': {
        icon = '🏁';
        const s = row && scoreOf(m, row);
        text = `<b>${esc(t('Final'))}</b>${s && row ? `: ${esc(m.teams.get(row.home)?.name || '')} ${s[0]} – ${s[1]} ${esc(m.teams.get(row.away)?.name || '')}` : ''}`;
        break;
      }
    }
    const vs = showMatch && row ? `<span class="vv-feed-match">${nameOf(m, row.home)} – ${nameOf(m, row.away)}</span>` : '';
    const fresh = seen.size && !seen.has(e.id) ? ' is-new' : '';
    return `<li class="vv-ev is-${esc(e.type)}${fresh}" data-id="${esc(e.id)}"><span class="vv-ev-min">${esc(minute(e))}</span><span class="vv-ev-ico" aria-hidden="true">${icon}</span><span class="vv-ev-txt">${text}${vs}</span></li>`;
  }

  /* ---------- Secciones ---------- */
  function liveCards(m) {
    if (!m.vivos.size) return '';
    const cards = [...m.vivos.values()].map(v => {
      const row = rowOf(m, v.fixtureId), a = v.teams[0].tid, b = v.teams[1].tid;
      const [home, away] = [m.teams.get(a), m.teams.get(b)], list = m.events.get(v.fixtureId) || [], lastEv = list[list.length - 1];
      const phase = v.descanso ? t('MEDIO TIEMPO') : v.half === 2 ? t('2.º TIEMPO') : t('1.er TIEMPO');
      const prev = lastScore.get(v.fixtureId), now = v.teams[0].score + '-' + v.teams[1].score;
      const lastText = lastEv ? `${minute(lastEv)} ${plain(lastEv, m)}` : t('Tocá para ver las estadísticas');
      return `<button type="button" class="vv-live-card${prev && prev !== now ? ' is-goal' : ''}" data-open="match" data-id="${esc(row?.id || v.fixtureId)}">
        <span class="vv-live-top"><span class="fx-tag is-live"><i aria-hidden="true"></i>${esc(phase)}</span><span class="vv-clock" data-clock="${esc(v.fixtureId)}">${mmss(clock(v))}</span></span>
        <span class="vv-live-teams"><span class="vv-side">${badge(home, 52)}<b>${esc(home?.name || '')}</b></span><span class="vv-score">${v.teams[0].score}<i>–</i>${v.teams[1].score}</span><span class="vv-side">${badge(away, 52)}<b>${esc(away?.name || '')}</b></span></span>
        <span class="vv-live-last">${esc(lastText)}</span></button>`;
    }).join('');
    return `<section class="vv-live"><h2 class="vv-h">${esc(t('Ahora en juego'))}<span>${m.vivos.size}</span></h2><div class="vv-live-grid">${cards}</div></section>`;
  }

  function feedSection(m) {
    const teamIds = [...new Set(m.all.map(e => e.tid).filter(Boolean))];
    const chips = [`<button type="button" class="vv-chip" data-filter="all" aria-pressed="${filter === 'all'}">${esc(t('TODOS'))}</button>`, ...teamIds.map(id => `<button type="button" class="vv-chip" data-filter="${esc(id)}" aria-pressed="${filter === id}">${badge(m.teams.get(id), 18)}${nameOf(m, id)}</button>`)].join('');
    const list = m.all.filter(e => filter === 'all' || e.tid === filter).slice(0, 60);
    const body = list.length ? `<ol class="vv-feed">${list.map(e => line(e, m, true)).join('')}</ol>` : `<p class="vv-empty">${esc(t('Todavía no pasó nada. Los goles y las jugadas aparecen acá apenas ocurren.'))}</p>`;
    return `<section class="vv-feed-box"><h2 class="vv-h">${esc(t('Feed en vivo'))}</h2><div class="vv-chips" role="group" aria-label="${esc(t('Filtrar por equipo'))}">${chips}</div>${body}</section>`;
  }

  function standingsSection(m) {
    if (m.tour.fixture?.type !== 'rr') return '';
    const st = UCTournament.standings(m.tour, data.partidos);
    if (!st.some(r => r.played)) return '';
    const rows = st.map((r, i) => `<tr data-open="team" data-id="${esc(r.team.id)}" tabindex="0" role="button"><td>${i + 1}</td><td><span class="vv-team-cell">${badge(r.team, 24)}${esc(r.team.name)}</span></td><td>${r.played}</td><td>${r.won}-${r.drawn}-${r.lost}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.points}</b></td></tr>`).join('');
    return `<section class="settings-section vv-table"><div class="section-heading"><h2>${esc(t('Posiciones'))}</h2></div><table class="tournament-stats standings"><thead><tr><th>#</th><th>${esc(t('Equipo'))}</th><th>${esc(t('PJ'))}</th><th>${esc(t('G-E-P'))}</th><th>${esc(t('DG'))}</th><th>${esc(t('PTS'))}</th></tr></thead><tbody>${rows}</tbody></table><p class="vv-hint">${esc(t('Tocá un equipo para ver sus estadísticas.'))}</p></section>`;
  }

  /* ---------- Paneles de estadísticas ---------- */
  const count = (list, type, tid) => list.filter(e => e.type === type && e.tid === tid).length;
  const tally = (list, field) => { const c = new Map(); for (const e of list) if (e.type === 'goal' && e[field]) c.set(e[field], (c.get(e[field]) || 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); };
  const people = (list, field) => tally(list, field).slice(0, 5).map(([n, c]) => `<li>${esc(n)} <b>${c}</b></li>`).join('');

  function matchPanel(m, id) {
    const row = rowOf(m, id);
    if (!row) return `<p class="vv-empty">${esc(t('Este partido ya no está disponible.'))}</p>`;
    const list = m.events.get(id) || [], s = scoreOf(m, row), [home, away] = [m.teams.get(row.home), m.teams.get(row.away)];
    const v = m.vivos.get(id);
    const stat = (label, a, b) => `<div class="vv-stat"><b>${a}</b><span>${esc(label)}</span><b>${b}</b></div>`;
    const goals = list.filter(e => e.type === 'goal');
    return `<header class="vv-sheet-head"><div class="vv-sheet-teams"><button type="button" class="vv-side" data-open="team" data-id="${esc(row.home || '')}">${badge(home, 56)}<b>${esc(home?.name || t('A definir'))}</b></button><div class="vv-sheet-score">${s ? `${s[0]}<i>–</i>${s[1]}` : '–'}${v ? `<small class="vv-clock" data-clock="${esc(v.fixtureId)}">${mmss(clock(v))}</small>` : ''}</div><button type="button" class="vv-side" data-open="team" data-id="${esc(row.away || '')}">${badge(away, 56)}<b>${esc(away?.name || t('A definir'))}</b></button></div>${tagFor(row)}</header>
      <section><h3 class="vv-h3">${esc(t('Estadísticas del partido'))}</h3>
        ${stat(t('Goles'), s ? s[0] : 0, s ? s[1] : 0)}${stat(t('Time outs'), count(list, 'timeout', row.home), count(list, 'timeout', row.away))}${stat(t('Llamados'), count(list, 'call', row.home), count(list, 'call', row.away))}${stat(t('Incidencias'), list.filter(e => e.type === 'incident').length, '')}</section>
      ${goals.length ? `<section><h3 class="vv-h3">${esc(t('Goles'))}</h3><ol class="vv-feed">${goals.map(e => line(e, m, false)).join('')}</ol></section>` : ''}
      ${tally(list, 'scorer').length ? `<section class="vv-two"><div><h3 class="vv-h3">${esc(t('Goleadores'))}</h3><ul class="vv-people">${people(list, 'scorer')}</ul></div><div><h3 class="vv-h3">${esc(t('Asistencias'))}</h3><ul class="vv-people">${people(list, 'assist') || '<li>—</li>'}</ul></div></section>` : ''}
      <section><h3 class="vv-h3">${esc(t('Cronología'))}</h3>${list.length ? `<ol class="vv-feed">${[...list].reverse().map(e => line(e, m, false)).join('')}</ol>` : `<p class="vv-empty">${esc(t('Sin jugadas registradas todavía.'))}</p>`}</section>`;
  }

  function teamPanel(m, id) {
    const team = m.teams.get(id);
    if (!team) return `<p class="vv-empty">${esc(t('Este equipo ya no está disponible.'))}</p>`;
    const mine = m.rows.filter(r => r.home === id || r.away === id);
    const evs = [...m.events.values()].flat().filter(e => e.tid === id);
    const st = m.tour.fixture?.type === 'rr' ? UCTournament.standings(m.tour, data.partidos).find(r => r.team.id === id) : null;
    const games = mine.map(r => { const s = scoreOf(m, r), rival = r.home === id ? r.away : r.home; return `<li><button type="button" class="vv-game" data-open="match" data-id="${esc(r.id)}">${badge(m.teams.get(rival), 24)}<span>${esc(t('vs'))} ${nameOf(m, rival)}</span><b>${s ? (r.home === id ? `${s[0]} – ${s[1]}` : `${s[1]} – ${s[0]}`) : esc(t('PRÓXIMO'))}</b>${tagFor(r)}</button></li>`; }).join('');
    return `<header class="vv-sheet-head is-team" style="--team:${esc(team.color)}">${badge(team, 72)}<h2>${esc(team.name)}</h2></header>
      ${st ? `<section><h3 class="vv-h3">${esc(t('En el torneo'))}</h3><div class="vv-kpis"><div><b>${st.points}</b><span>${esc(t('PTS'))}</span></div><div><b>${st.played}</b><span>${esc(t('PJ'))}</span></div><div><b>${st.won}-${st.drawn}-${st.lost}</b><span>${esc(t('G-E-P'))}</span></div><div><b>${st.gf}-${st.ga}</b><span>${esc(t('Goles'))}</span></div></div></section>` : ''}
      ${tally(evs, 'scorer').length ? `<section class="vv-two"><div><h3 class="vv-h3">${esc(t('Goleadores'))}</h3><ul class="vv-people">${people(evs, 'scorer')}</ul></div><div><h3 class="vv-h3">${esc(t('Asistencias'))}</h3><ul class="vv-people">${people(evs, 'assist') || '<li>—</li>'}</ul></div></section>` : ''}
      <section><h3 class="vv-h3">${esc(t('Partidos'))}</h3>${games ? `<ul class="vv-games">${games}</ul>` : `<p class="vv-empty">${esc(t('Todavía no tiene partidos.'))}</p>`}</section>`;
  }

  function renderPanel(m) {
    if (!openPanel) { if (sheet.open) sheet.close(); return; }
    const body = openPanel.kind === 'match' ? matchPanel(m, openPanel.id) : teamPanel(m, openPanel.id);
    const keep = sheet.querySelector('.vv-sheet-body')?.scrollTop || 0;
    sheet.innerHTML = `<div class="vv-sheet-bar"><button type="button" class="vv-close" data-close aria-label="${esc(t('Cerrar'))}">×</button></div><div class="vv-sheet-body">${body}</div>`;
    sheet.querySelector('.vv-sheet-body').scrollTop = keep;
    if (!sheet.open) sheet.showModal();
  }

  /* ---------- Página ---------- */
  function status() {
    if (!last) { updated.textContent = ''; return; }
    const s = Math.max(0, Math.round((Date.now() - last) / 1000));
    updated.textContent = offline ? t('Sin conexión: se reintenta solo.') : t('Actualizado {when}', { when: t('hace {n} s', { n: s }) });
    liveTag.classList.toggle('is-off', offline);
  }
  function tick() {
    if (!data) return;
    for (const v of data.vivos || []) document.querySelectorAll(`[data-clock="${CSS.escape(v.fixtureId)}"]`).forEach(el => { el.textContent = mmss(clock(v)); });
  }
  function message(text) { main.innerHTML = `<p class="vivo-msg">${esc(text)}</p>`; }

  function render() {
    if (!data) return;
    const m = model(), tour = m.tour;
    document.title = `${tour.name} · ${t('Fixture en vivo')} · Ultimate Clock`;
    const head = `<div class="vivo-head"><span class="screen-eyebrow">${esc(t('Fixture en vivo'))}</span><h1>${esc(tour.name)}</h1><button type="button" class="vv-share" data-share>${esc(t('COMPARTIR'))}</button></div>`;
    if (!tour.fixture) { main.innerHTML = head + `<p class="vivo-msg">${esc(t('Todavía no hay fixture. Se muestra apenas lo generen.'))}</p>`; return; }
    const live = new Map();
    for (const r of m.rows) { const s = r.state === 'jugando' ? scoreOf(m, r) : null; if (s) live.set(r.id, s); }
    const board = UCFixtureView.render(tour, m.rows, { t, esc, interactive: true, mirrored: wide.matches, live });
    const scroll = main.querySelector('.fx-board')?.scrollLeft || 0, feedTop = main.querySelector('.vv-feed-box')?.scrollTop || 0;
    main.innerHTML = `${head}${liveCards(m)}<div class="vv-cols"><div class="vv-col-main"><section class="settings-section"><div class="section-heading"><h2>${esc(t('Fixture'))}</h2></div>${board}</section>${standingsSection(m)}</div><aside class="vv-col-side">${feedSection(m)}</aside></div><p class="vivo-cta"><a class="button" href="./">${esc(t('Seguilo en vivo con Ultimate Clock'))}</a></p>`;
    const b = main.querySelector('.fx-board'); if (b) b.scrollLeft = scroll;
    const fb = main.querySelector('.vv-feed-box'); if (fb) fb.scrollTop = feedTop;
    for (const v of data.vivos || []) lastScore.set(v.fixtureId, v.teams[0].score + '-' + v.teams[1].score);
    m.all.forEach(e => seen.add(e.id));
    renderPanel(m);
  }

  async function load() {
    clearTimeout(timer);
    try {
      const r = await fetch(new URL(`api/publico/${encodeURIComponent(user)}/${encodeURIComponent(slug)}`, document.baseURI), { cache: 'no-store' });
      if (r.status === 404) { data = null; last = Date.now(); offline = false; message(t('Este link no existe o dejó de compartirse.')); }
      else if (!r.ok) throw new Error('http');
      else { data = await r.json(); last = Date.now(); offline = false; render(); }
    } catch { offline = true; if (!data) message(t('Sin conexión: se reintenta solo.')); }
    status();
    timer = setTimeout(load, document.hidden ? 30000 : 5000);
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]'), fx = e.target.closest('[data-action="t-fx-open"]'), chip = e.target.closest('[data-filter]');
    if (e.target.closest('[data-close]') || e.target === sheet) { openPanel = null; if (sheet.open) sheet.close(); return; }
    if (open) { openPanel = { kind: open.dataset.open, id: open.dataset.id }; render(); return; }
    if (fx) { openPanel = { kind: 'match', id: fx.dataset.id }; render(); return; }
    if (chip) { filter = chip.dataset.filter; render(); return; }
    if (e.target.closest('[data-share]')) {
      const url = location.href;
      if (navigator.share) navigator.share({ title: data?.torneo?.name || 'Ultimate Clock', url }).catch(() => {});
      else navigator.clipboard?.writeText(url).then(() => { updated.textContent = t('Link copiado.'); setTimeout(status, 2000); }).catch(() => {});
    }
  });
  document.addEventListener('keydown', e => { const row = e.target.closest?.('tr[data-open]'); if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); } });
  sheet.addEventListener('close', () => { openPanel = null; });

  if (!user || !slug) { message(t('Este link no existe o dejó de compartirse.')); return; }
  message(t('Cargando el fixture…'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  wide.addEventListener?.('change', render);
  setInterval(status, 1000);
  setInterval(tick, 1000);
  load();
})();
