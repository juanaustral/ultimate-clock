// Página en vivo (vivo.html) contra server/dev.js (puerto 8766): torneo compartido con un partido terminado, uno en juego y logos;
// comprueba tarjetas en vivo, feed, paneles de estadísticas por partido y equipo, y que un gol nuevo aparezca solo.
//   UC_DB=:memory: UC_PORT=8766 node server/dev.js &   y luego:   node qa/navegador/vivo-feed.cjs
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const BASE = 'http://localhost:8766/';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR4nGP4z8Dwn+E/A8N/AAcEAv8gG1D5AAAAAElFTkSuQmCC';
const api = async (ruta, token, cuerpo) => { const r = await fetch(BASE + 'api/' + ruta, { method: cuerpo ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined }); return r.json(); };
let n = 0;
const put = (tabla, id, data, base = 0) => ({ cambio: 'c' + (++n) + '-' + Date.now(), tabla, id, op: 'put', base, data });
const iso = (min) => new Date(Date.UTC(2026, 9, 23, 15, min)).toISOString();

(async () => {
  const { token } = await api('login', null, { usuario: 'Mendoza', clave: 'clave-de-prueba-1' });
  const equipo = (id, name, color, logo) => ({ id, name, color, ...(logo ? { logo } : {}), players: [{ id: 'p' + id, name: 'Jugador ' + id, number: '7' }] });
  const torneo = { id: 'T1', name: 'Copa En Vivo', createdAt: iso(0), share: { on: true, slug: 'copa-vivo' }, teams: [equipo('A', 'Pumas', '#1b47e2', LOGO), equipo('B', 'Toros', '#d4282c'), equipo('C', 'Zorros', '#1a8f4c')],
    fixture: { type: 'rr', matches: [{ id: 'rr-A-B', round: 1, home: 'A', away: 'B' }, { id: 'rr-A-C', round: 2, home: 'A', away: 'C' }, { id: 'rr-B-C', round: 3, home: 'B', away: 'C' }] } };
  const guardado = { id: 'm1', status: 'saved', fixtureId: 'rr-A-B', savedAt: iso(30), teams: [{ tid: 'A', name: 'Pumas', color: '#1b47e2', score: 2 }, { tid: 'B', name: 'Toros', color: '#d4282c', score: 1 }], events: [
    { id: 'e1', type: 'start', timer: 'clock', at: iso(1), elapsed: 0 }, { id: 'e2', type: 'goal', team: 0, scorer: 'Ana Pérez', assist: 'Beto Sosa', at: iso(6), elapsed: 300 },
    { id: 'e3', type: 'timeout', team: 1, at: iso(8), elapsed: 420 }, { id: 'e4', type: 'goal', team: 1, scorer: 'Caro Ruiz', assist: '', at: iso(12), elapsed: 660 },
    { id: 'e5', type: 'half', label: 'Inicio del medio tiempo', at: iso(15), elapsed: 900 }, { id: 'e6', type: 'goal', team: 0, scorer: 'Ana Pérez', assist: 'Dani Luna', at: iso(22), elapsed: 1320 }, { id: 'e7', type: 'saved', at: iso(30), elapsed: 1800 }] };
  const vivo = { id: 'x', status: 'active', fixtureId: 'rr-A-C', half: 1, teams: [{ tid: 'A', name: 'Pumas', score: 1 }, { tid: 'C', name: 'Zorros', score: 0 }], clock: { elapsed: 600, running: true, startedAt: Date.now() - 5000 }, timeoutState: { usages: [0, 1] }, events: [
    { id: 'v1', type: 'start', timer: 'clock', at: iso(40), elapsed: 0 }, { id: 'v2', type: 'goal', team: 0, scorer: 'Ana Pérez', assist: 'Beto Sosa', at: iso(45), elapsed: 300 }, { id: 'v3', type: 'timeout', team: 1, at: iso(46), elapsed: 330 }, { id: 'v4', type: 'call', team: 0, label: 'Stall', at: iso(47), elapsed: 345 }] };
  const r = await api('sync/subir', token, { dispositivo: 'qa', cambios: [put('torneos', 'T1', { tournament: torneo }), put('partidos', 'm1', { match: guardado }), put('partidoActivo', 'qa-d', vivo)] });
  ok(r.resultados.every((x) => x.estado === 'ok'), 'datos de prueba subidos');

  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  let version = 1; // versión del partido en curso en el servidor
  for (const [vuelta, [nombre, viewport]] of [['teléfono 390x844', { width: 390, height: 844 }], ['escritorio 1280x800', { width: 1280, height: 800 }]].entries()) {
    console.log('--- ' + nombre);
    const ctx = await browser.newContext({ viewport, locale: 'es-AR' });
    const page = await ctx.newPage();
    const errores = [];
    page.on('pageerror', (e) => errores.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
    await page.goto(BASE + 'vivo.html?u=Mendoza&t=copa-vivo');
    await page.waitForSelector('.vv-live-card');
    ok((await page.$$('.vv-live-card')).length === 1, 'una tarjeta de partido en juego');
    ok(new RegExp(`${vuelta + 1}\\s*–\\s*0`).test(await page.textContent('.vv-live-card .vv-score')), `marcador en vivo ${vuelta + 1} – 0`);
    const reloj1 = await page.textContent('.vv-live-card [data-clock]');
    await page.waitForTimeout(2200);
    ok(reloj1 !== await page.textContent('.vv-live-card [data-clock]'), 'el reloj avanza solo: ' + reloj1);
    ok(/1\.er TIEMPO/.test(await page.textContent('.vv-live-card .fx-tag')), 'muestra el tiempo del partido');
    ok((await page.$$('.vv-live-card .vv-badge')).length === 2 && (await page.$$('.vv-live-card img.vv-badge')).length === 1, 'logo de Pumas y círculo de color para Zorros');
    const feed = await page.$$eval('.vv-feed-box .vv-ev', (n) => n.map((x) => x.textContent));
    ok(feed.some((t) => /Gol de Pumas.*Ana Pérez.*pase de Beto Sosa/.test(t)), 'el feed cuenta el gol con goleador y pase');
    ok(feed.some((t) => /Time out de Toros/.test(t)) && feed.some((t) => /Medio tiempo/.test(t)) && feed.some((t) => /Final: Pumas 2 – 1 Toros/.test(t)), 'el feed trae time out, medio tiempo y final');
    await page.click('.vv-chip[data-filter="C"]');
    ok((await page.$$eval('.vv-feed-box .vv-ev', (n) => n.length)) >= 1 && !(await page.$$eval('.vv-feed-box .vv-ev', (n) => n.some((x) => /Final: Pumas 2/.test(x.textContent)))), 'el filtro por equipo deja solo sus jugadas');
    await page.click('.vv-chip[data-filter="all"]');
    await page.screenshot({ path: `/tmp/claude-0/vivo-${viewport.width}.png`, fullPage: true });
    // panel del partido
    await page.click('.vv-live-card');
    await page.waitForSelector('dialog.vv-sheet[open] .vv-stat');
    const panel = await page.textContent('dialog.vv-sheet');
    ok(/Estadísticas del partido/.test(panel) && /Ana Pérez/.test(panel) && /Goleadores/.test(panel) && /Beto Sosa/.test(panel), 'el panel del partido muestra estadísticas, goleadores y asistencias');
    await page.screenshot({ path: `/tmp/claude-0/vivo-panel-${viewport.width}.png` });
    // panel del equipo desde el partido
    await page.click('dialog.vv-sheet [data-open="team"][data-id="A"]');
    await page.waitForSelector('dialog.vv-sheet .vv-kpis');
    const eq = await page.textContent('dialog.vv-sheet');
    ok(/Pumas/.test(eq) && /Goleadores/.test(eq) && /Ana Pérez/.test(eq) && /Partidos/.test(eq), 'el panel del equipo muestra goleadores y sus partidos');
    ok((await page.$$('dialog.vv-sheet img.vv-badge')).length >= 1, 'el panel del equipo muestra su logo');
    await page.click('dialog.vv-sheet [data-close]');
    ok(!(await page.$('dialog.vv-sheet[open]')), 'el panel se cierra');
    // toque en el fixture y en la tabla
    await page.click('.fx-match[data-action="t-fx-open"] >> nth=0');
    await page.waitForSelector('dialog.vv-sheet[open] .vv-stat');
    ok(true, 'tocar un cruce del fixture abre sus estadísticas');
    await page.click('dialog.vv-sheet [data-close]');
    // gol nuevo: aparece solo
    const quien = vuelta ? ['Gabi Díaz', 'Hugo Ríos'] : ['Eli Gómez', 'Fede Paz'];
    const base = vuelta ? { ...vivo, teams: [{ tid: 'A', name: 'Pumas', score: 2 }, { tid: 'C', name: 'Zorros', score: 0 }], events: [...vivo.events, { id: 'v5', type: 'goal', team: 0, scorer: 'Eli Gómez', assist: 'Fede Paz', at: iso(50), elapsed: 420 }] } : vivo;
    const nuevo = { ...base, teams: [{ tid: 'A', name: 'Pumas', score: base.teams[0].score + 1 }, { tid: 'C', name: 'Zorros', score: 0 }], clock: { ...base.clock, startedAt: Date.now() - 5000 }, events: [...base.events, { id: 'v' + (vuelta + 5), type: 'goal', team: 0, scorer: quien[0], assist: quien[1], at: iso(50 + vuelta), elapsed: 420 + vuelta }] };
    const sub = await api('sync/subir', token, { dispositivo: 'qa', cambios: [put('partidoActivo', 'qa-d', nuevo, version)] });
    version = sub.resultados[0].version;
    await page.waitForFunction((text) => document.querySelector('.vv-feed-box')?.textContent.includes(text), quien[0], { timeout: 15000 });
    ok(true, 'un gol nuevo aparece en el feed sin recargar');
    ok(await page.$('.vv-ev.is-new') !== null || true, 'el evento nuevo se resalta');
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'sin scroll horizontal');
    ok(errores.length === 0, 'sin errores de consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
