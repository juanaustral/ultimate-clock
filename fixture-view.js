/* Ultimate Clock · fixture visual. Arma el HTML del cuadro de llaves (eliminación) y de las fechas con la tabla cruzada
   (todos contra todos). Lo usan el editor del torneo y la página pública en vivo; sin estado propio.
   opts: { t, esc, teams (Map id -> {name,color}), interactive, mirrored, live (Map fixtureId -> [local, visitante]) } */
(function (root) {
  'use strict';
  const ink = hex => { const h = String(hex || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(h)) return '#fff'; const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0f1115' : '#fff'; };

  function roundName(round, total, t) {
    const left = total - round;
    return left === 0 ? t('Final') : left === 1 ? t('Semifinal') : left === 2 ? t('Cuartos de final') : left === 3 ? t('Octavos de final') : t('Fase {n}', { n: round });
  }
  function scoresOf(row, live) {
    if (row.result) return [row.result.home, row.result.away];
    if (row.state === 'jugando' && live?.has(row.id)) return live.get(row.id);
    return null;
  }
  function stateTag(row, o, draw) {
    const { t, esc } = o;
    if (draw) return `<span class="fx-tag is-draw">${esc(t('EMPATE'))}</span>`;
    if (row.state === 'jugando') return `<span class="fx-tag is-live"><i aria-hidden="true"></i>${esc(t('EN JUEGO'))}</span>`;
    if (row.state === 'terminado') return `<span class="fx-tag is-done">${esc(t('FINALIZADO'))}</span>`;
    if (row.state === 'libre') return `<span class="fx-tag">${esc(t('PASA DIRECTO'))}</span>`;
    return '';
  }
  /* Logo del equipo si lo tiene; si no, el punto de color de siempre. */
  function teamMark(team, esc, color) {
    return team?.logo ? `<img class="fx-logo" src="${esc(team.logo)}" alt="" width="20" height="20" loading="lazy">` : `<i class="fx-dot" style="background:${esc(color)}"></i>`;
  }
  function teamLine(id, score, row, o, fallback) {
    const { esc, teams } = o, team = id ? teams.get(id) : null;
    const win = row.winner && id && row.winner === id, lose = row.winner && id && row.winner !== id;
    const color = team?.color || 'transparent';
    return `<span class="fx-team${win ? ' is-win' : ''}${lose ? ' is-lose' : ''}${team ? '' : ' is-tbd'}">${teamMark(team, esc, color)}<b>${esc(team ? team.name : fallback)}</b><em>${score ?? ''}</em></span>`;
  }
  /* Tarjeta de un cruce. En el editor es un botón que abre las acciones (jugar, cargar o corregir el resultado). */
  function card(row, o, extra = '') {
    const { t, esc, interactive } = o;
    const s = scoresOf(row, o.live);
    const draw = row.state === 'terminado' && o.elim && !row.winner;
    const tbd = t('A definir');
    const away = row.state === 'libre' ? null : row.away;
    const body = `${stateTag(row, o, draw)}${teamLine(row.home, s?.[0], row, o, row.state === 'libre' && !row.home ? t('LIBRE') : tbd)}${teamLine(away, s?.[1], row, o, row.state === 'libre' ? t('LIBRE') : tbd)}`;
    const cls = `fx-match is-${row.state}${draw ? ' is-draw' : ''}${extra}`;
    const label = `${row.home ? o.teams.get(row.home)?.name : tbd} – ${away ? o.teams.get(away)?.name : row.state === 'libre' ? t('LIBRE') : tbd}`;
    if (interactive && row.state !== 'libre' && row.home && row.away) return `<button type="button" class="${cls}" data-action="t-fx-open" data-id="${esc(row.id)}" aria-label="${esc(label)}">${body}</button>`;
    return `<div class="${cls}" aria-label="${esc(label)}">${body}</div>`;
  }

  /* ---------- Eliminación: cuadro de llaves ---------- */
  function bracket(rows, o) {
    const { t, esc } = o;
    const total = Math.max(...rows.map(r => r.round));
    const byRound = r => rows.filter(x => x.round === r).sort((a, b) => a.pos - b.pos);
    const final = byRound(total)[0];
    const champ = final?.winner ? o.teams.get(final.winner) : null;
    const champion = `<div class="fx-champion${champ ? ' has-winner' : ''}"${champ ? ` style="--champ:${esc(champ.color)};--champ-ink:${ink(champ.color)}"` : ''}><span class="fx-trophy" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1Z"/></svg></span><small>${esc(t('CAMPEÓN'))}</small><strong>${esc(champ ? champ.name : t('A definir'))}</strong></div>`;
    const col = (list, round, side) => `<div class="fx-col${list.length === 1 ? ' is-single' : ''}${side ? ' is-' + side : ''}${round === 1 ? ' is-r1' : ''}"><h4 class="fx-col-title">${esc(roundName(round, total, t))}</h4><div class="fx-slots">${list.map(m => `<div class="fx-slot">${card(m, o)}</div>`).join('')}</div></div>`;
    if (total === 1) return `<div class="fx-bracket is-mirrored is-solo"><div class="fx-col is-center"><h4 class="fx-col-title">${esc(t('Final'))}</h4><div class="fx-slots"><div class="fx-slot is-final">${champion}${card(final, o, ' is-final-card')}</div></div></div></div>`;
    if (o.mirrored) {
      const left = [], right = [];
      for (let r = 1; r < total; r++) {
        const list = byRound(r), half = list.length / 2;
        left.push(col(list.slice(0, half), r, 'left'));
        right.unshift(col(list.slice(half), r, 'right'));
      }
      return `<div class="fx-bracket is-mirrored">${left.join('')}<div class="fx-col is-center"><h4 class="fx-col-title">${esc(t('Final'))}</h4><div class="fx-slots"><div class="fx-slot is-final">${champion}${card(final, o, ' is-final-card')}</div></div></div>${right.join('')}</div>`;
    }
    const cols = [];
    for (let r = 1; r <= total; r++) cols.push(col(byRound(r), r, 'left'));
    return `<div class="fx-bracket is-linear">${cols.join('')}<div class="fx-col is-champ"><h4 class="fx-col-title">${esc(t('Campeón'))}</h4><div class="fx-slots"><div class="fx-slot">${champion}</div></div></div></div>`;
  }

  /* ---------- Todos contra todos: fechas y tabla cruzada ---------- */
  function league(rows, tour, o) {
    const { t, esc } = o;
    const rounds = [...new Set(rows.map(r => r.round))].sort((a, b) => a - b);
    const playing = new Set();
    const fechas = rounds.map(r => {
      const list = rows.filter(x => x.round === r);
      list.forEach(x => { playing.add(`${r}|${x.home}`); playing.add(`${r}|${x.away}`); });
      const free = tour.teams.filter(team => !playing.has(`${r}|${team.id}`));
      const done = list.filter(x => x.state === 'terminado').length;
      return `<section class="fx-round"><h4 class="fx-col-title">${esc(t('Fecha {n}', { n: r }))}<span>${done}/${list.length}</span></h4>${list.map(m => card(m, o)).join('')}${free.length && rows.length ? `<p class="fx-free">${esc(t('Libre'))}: ${free.map(x => esc(x.name)).join(', ')}</p>` : ''}</section>`;
    }).join('');
    /* Tabla cruzada: cada celda es el resultado desde el equipo de la fila. */
    const find = (a, b) => rows.find(x => (x.home === a && x.away === b) || (x.home === b && x.away === a));
    const head = tour.teams.map((team, i) => `<th scope="col" title="${esc(team.name)}"><span class="fx-chip" style="background:${esc(team.color)};color:${ink(team.color)}">${i + 1}</span></th>`).join('');
    const body = tour.teams.map((a, i) => `<tr><th scope="row"><span class="fx-chip" style="background:${esc(a.color)};color:${ink(a.color)}">${i + 1}</span>${esc(a.name)}</th>${tour.teams.map(b => {
      if (a.id === b.id) return '<td class="fx-x is-self"></td>';
      const m = find(a.id, b.id);
      if (!m) return '<td class="fx-x"></td>';
      const s = scoresOf(m, o.live);
      const [mine, theirs] = s ? (m.home === a.id ? s : [s[1], s[0]]) : [null, null];
      const cls = m.state === 'jugando' ? 'is-live' : s ? (mine > theirs ? 'is-w' : mine < theirs ? 'is-l' : 'is-d') : 'is-p';
      const txt = s ? `${mine}-${theirs}` : m.state === 'jugando' ? '●' : '·';
      return o.interactive ? `<td class="fx-x ${cls}"><button type="button" data-action="t-fx-open" data-id="${esc(m.id)}" aria-label="${esc(a.name)} – ${esc(b.name)}">${txt}</button></td>` : `<td class="fx-x ${cls}">${txt}</td>`;
    }).join('')}</tr>`).join('');
    return `<div class="fx-rounds">${fechas}</div>
      <div class="fx-cross-wrap"><h4 class="fx-col-title">${esc(t('Tabla cruzada'))}</h4><div class="fx-scroll"><table class="fx-cross"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="fx-legend"><span class="is-w">${esc(t('Ganó'))}</span><span class="is-d">${esc(t('Empató'))}</span><span class="is-l">${esc(t('Perdió'))}</span><span class="is-p">· ${esc(t('Por jugar'))}</span></p></div>`;
  }

  /* Vista completa: barra de progreso y el dibujo que corresponde al tipo. */
  function render(tour, rows, o) {
    const { t, esc } = o;
    if (!tour?.fixture || !rows.length) return '';
    o = { ...o, elim: tour.fixture.type === 'elim' };
    if (!o.teams) o.teams = new Map(tour.teams.map(x => [x.id, x]));
    const real = rows.filter(r => r.state !== 'libre');
    const done = real.filter(r => r.state === 'terminado' && (!o.elim || r.winner)).length;
    const pct = real.length ? Math.round(100 * done / real.length) : 0;
    const live = real.filter(r => r.state === 'jugando').length;
    const progress = `<div class="fx-progress"><div class="fx-progress-bar" style="--pct:${pct}%"><span></span></div><p><b>${done}/${real.length}</b> ${esc(t('partidos jugados'))}${live ? ` · <span class="fx-live-count"><i aria-hidden="true"></i>${esc(t('{n} en juego', { n: live }))}</span>` : ''}</p></div>`;
    return `<div class="fx-view is-${tour.fixture.type}">${progress}<div class="${o.elim ? 'fx-scroll fx-board' : 'fx-board'}">${o.elim ? bracket(rows, o) : league(rows, tour, o)}</div></div>`;
  }

  const api = { render, roundName, ink };
  if (typeof module !== 'undefined') module.exports = api; else root.UCFixtureView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
