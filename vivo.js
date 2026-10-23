/* Ultimate Clock · fixture en vivo (página pública, solo lectura). Lee /api/publico/<usuario>/<torneo> cada pocos
   segundos y dibuja el fixture, los partidos en juego y la tabla. No guarda nada en el dispositivo. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const user = params.get('u') || '', slug = params.get('t') || '';
  const lang = /^en/i.test(navigator.language || '') ? 'en' : 'es';
  const t = (s, v) => UCI18N.t(lang, s, v);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const main = document.getElementById('vivo'), updated = document.getElementById('vivoUpdated'), liveTag = document.getElementById('vivoLive');
  const wide = window.matchMedia('(min-width: 900px)');
  let data = null, last = 0, timer = null, offline = false;

  document.documentElement.lang = lang;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
  liveTag.querySelector('span').textContent = t('EN VIVO');

  function status() {
    if (!last) { updated.textContent = ''; return; }
    const s = Math.max(0, Math.round((Date.now() - last) / 1000));
    updated.textContent = offline ? t('Sin conexión: se reintenta solo.') : t('Actualizado {when}', { when: t('hace {n} s', { n: s }) });
    liveTag.classList.toggle('is-off', offline);
  }
  function message(text) { main.innerHTML = `<p class="vivo-msg">${esc(text)}</p>`; }

  function render() {
    if (!data) return;
    const tour = data.torneo;
    document.title = `${tour.name} · ${t('Fixture en vivo')} · Ultimate Clock`;
    const head = `<div class="vivo-head"><span class="screen-eyebrow">${esc(t('Fixture en vivo'))}</span><h1>${esc(tour.name)}</h1></div>`;
    if (!tour.fixture) { main.innerHTML = head + `<p class="vivo-msg">${esc(t('Todavía no hay fixture. Se muestra apenas lo generen.'))}</p>`; return; }
    const vivos = new Map((data.vivos || []).map(v => [v.fixtureId, v]));
    const rows = UCFixture.view(tour.fixture, data.partidos, new Set(vivos.keys()));
    const live = new Map();
    for (const r of rows) {
      const v = vivos.get(r.id);
      if (v && r.state === 'jugando') { const s = [v.teams[0].score, v.teams[1].score]; live.set(r.id, v.teams[0].tid === r.home ? s : [s[1], s[0]]); }
    }
    const board = UCFixtureView.render(tour, rows, { t, esc, interactive: false, mirrored: wide.matches, live });
    let table = '';
    if (tour.fixture.type === 'rr') {
      const st = UCTournament.standings(tour, data.partidos);
      if (st.some(r => r.played)) table = `<section class="settings-section"><div class="section-heading"><h2>${esc(t('Posiciones'))}</h2></div><table class="tournament-stats standings"><thead><tr><th>${esc(t('Equipo'))}</th><th>${esc(t('PJ'))}</th><th>${esc(t('DG'))}</th><th>${esc(t('PTS'))}</th></tr></thead><tbody>${st.map(r => `<tr><td><span class="dot" style="background:${esc(r.team.color)}"></span>${esc(r.team.name)} <small>${esc(t('{w}G {d}E {l}P · {gf}-{ga}', { w: r.won, d: r.drawn, l: r.lost, gf: r.gf, ga: r.ga }))}</small></td><td>${r.played}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.points}</b></td></tr>`).join('')}</tbody></table></section>`;
    }
    const scroll = main.querySelector('.fx-board')?.scrollLeft || 0;
    main.innerHTML = `${head}<section class="settings-section">${board}</section>${table}<p class="vivo-cta"><a class="button" href="./">${esc(t('Seguilo en vivo con Ultimate Clock'))}</a></p>`;
    const b = main.querySelector('.fx-board'); if (b) b.scrollLeft = scroll;
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
    timer = setTimeout(load, document.hidden ? 30000 : 8000);
  }

  if (!user || !slug) { message(t('Este link no existe o dejó de compartirse.')); return; }
  message(t('Cargando el fixture…'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  wide.addEventListener?.('change', render);
  setInterval(status, 1000);
  load();
})();
