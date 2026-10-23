// Torneo con varios dispositivos de la misma cuenta contra server/dev.js (puerto 8766):
//   UC_DB=:memory: UC_PORT=8766 node server/dev.js &   y luego:   node qa/navegador/multidispositivo.cjs
// Recorre: pregunta de entrada, elegir torneo, ver partidos, controlar el mismo partido desde dos dispositivos a la vez,
// tomar el control desde un tercero y guardar el partido.
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const URL = 'http://localhost:8766/index.html';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function hasta(fn, ms = 25000, paso = 400) { const t0 = Date.now(); while (Date.now() - t0 < ms) { let v; try { v = await fn(); } catch { v = false; } if (v) return v; await esperar(paso); } return false; }

async function abrirDispositivo(browser, nombre) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-AR' });
  const page = await ctx.newPage();
  page.nombre = nombre; page.errores = [];
  page.on('pageerror', (e) => page.errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errores.push(m.text()); });
  return { ctx, page };
}
async function login(page, usuario, clave) {
  await page.goto(URL);
  await page.waitForSelector('.login-gate');
  await page.fill('#lg-user', usuario); await page.fill('#lg-pass', clave);
  await page.click('.login-card [type=submit]');
}
const menu = (page, id) => page.evaluate((i) => { const m = document.querySelector('.header-actions'); if (!m.classList.contains('is-open')) document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById(i).click(); }, id);
const marcador = (page) => page.$$eval('.score-display', (n) => n.map((x) => Number(x.textContent)));
const cerrarModales = (page) => page.evaluate(() => { for (const b of document.querySelectorAll('#modalRoot [data-action="close-modal"]')) b.click(); });
const titulo = (page) => page.evaluate(() => document.querySelector('#modalRoot dialog[open] h2, #modalRoot dialog[open] .modal-title, #modalTitle')?.textContent || '');
const botonReloj = (page) => page.evaluate(() => document.querySelector('.clock-actions .button-primary')?.textContent || '');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const A = await abrirDispositivo(browser, 'A'), B = await abrirDispositivo(browser, 'B'), C = await abrirDispositivo(browser, 'C');

  // 1) A arma un torneo de 3 equipos, inicia sesión, genera el fixture y empieza el primer partido
  await A.page.goto(URL); await A.page.waitForSelector('.login-gate'); await A.page.click('[data-gate=local]'); await A.page.waitForTimeout(500);
  await A.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('[data-action="quick-theme"][data-theme="dark"]').click(); });
  const s = await A.page.evaluate(() => JSON.parse(localStorage.getItem('ultimate-clock-v2')));
  const eq = (i) => ({ id: 'E' + i, name: 'Equipo ' + i, color: ['#1b47e2', '#d4282c', '#1a8f4c'][i - 1], players: [] });
  s.tournament = { id: 'T-1', name: 'Copa Multi', createdAt: '2026-10-23T10:00:00Z', timing: s.tournament?.timing, teams: [eq(1), eq(2), eq(3)] };
  await A.page.evaluate((x) => localStorage.setItem('ultimate-clock-v2', JSON.stringify(x)), s);
  await A.page.reload(); await A.page.waitForTimeout(600);
  await menu(A.page, 'menuLogin'); await A.page.waitForSelector('.login-gate');
  await A.page.fill('#lg-user', 'Mendoza'); await A.page.fill('#lg-pass', 'clave-de-prueba-1'); await A.page.click('.login-card [type=submit]');
  await A.page.waitForSelector('#syncBadge:not([hidden])');
  await hasta(async () => (await A.page.evaluate(() => document.getElementById('syncBadge').className)).includes('is-ok'));
  await menu(A.page, 'menuTournament');
  await A.page.waitForSelector('[data-action="pick-tournament"]');
  ok(/Copa Multi/.test(await A.page.textContent('[data-action="pick-tournament"]')) && /3 equipos/.test(await A.page.textContent('[data-action="pick-tournament"]')), 'A: el selector de torneo muestra el torneo con sus equipos');
  await A.page.click('[data-action="pick-tournament"]');
  await A.page.waitForSelector('.tournament-screen');
  await A.page.click('[data-action="t-fixture-generate"]');
  await A.page.click('[data-action="t-fx-open"]');
  await A.page.click('#modalRoot [data-action="t-fixture-play"]');
  await A.page.waitForSelector('.clock-card');
  await A.page.click('.clock-actions .button-primary'); // arranca el reloj
  ok(/PAUSAR/.test(await botonReloj(A.page)), 'A: el reloj del partido está corriendo');

  // 2) B entra con la misma cuenta: le pregunta cómo entrar, elige el torneo y ve los partidos
  await login(B.page, 'Mendoza', 'clave-de-prueba-1');
  ok(await hasta(async () => /Cómo querés entrar/.test(await titulo(B.page))), 'B: al entrar con un torneo en marcha pregunta cómo querés entrar');
  ok(/torneo en marcha: Copa Multi/.test(await B.page.textContent('#modalRoot dialog[open]')), 'B: la pregunta nombra el torneo en marcha');
  ok(!!(await B.page.$('[data-action="choose-mode"][data-mode="match"]')) && !!(await B.page.$('[data-action="choose-mode"][data-mode="tournament"]')), 'B: ofrece MODO PARTIDO y MODO TORNEO');
  await B.page.click('[data-action="choose-mode"][data-mode="tournament"]');
  await B.page.waitForSelector('[data-action="pick-tournament"]');
  ok(/Elegí el torneo/.test(await titulo(B.page)), 'B: primero elige el torneo');
  await B.page.click('[data-action="pick-tournament"]');
  await B.page.waitForSelector('.fx-match');
  ok((await B.page.$$('.fx-match')).length === 3, 'B: ve los 3 partidos del fixture');

  // 3) B toca el partido que A está controlando: ofrece controlar también o tomar el control
  let unir = false;
  for (let i = 0; i < 12 && !unir; i++) {
    await B.page.click('[data-action="t-fx-open"]');
    unir = await B.page.$('#modalRoot [data-action="t-fx-join"]');
    if (!unir) { await cerrarModales(B.page); await esperar(2000); }
  }
  ok(!!unir, 'B: el partido que controla A ofrece unirse');
  ok(!!(await B.page.$('#modalRoot [data-action="t-fx-join"][data-how="junto"]')) && !!(await B.page.$('#modalRoot [data-action="t-fx-join"][data-how="tomar"]')), 'B: ofrece CONTROLAR TAMBIÉN DESDE ACÁ y TOMAR EL CONTROL');
  await B.page.click('#modalRoot [data-action="t-fx-join"][data-how="junto"]');
  await B.page.waitForSelector('.clock-card');
  ok(/⇄/.test(await B.page.textContent('#modeBadge')), 'B: el cartel marca el partido como compartido');
  ok(/PAUSAR/.test(await botonReloj(B.page)), 'B: el reloj sigue corriendo como lo dejó A');

  // 4) Los dos anotan a la vez: cada gol aparece en el otro dispositivo
  await B.page.click('[data-action="goal"][data-team="0"]'); await cerrarModales(B.page);
  await A.page.click('[data-action="goal"][data-team="1"]'); await cerrarModales(A.page);
  ok(await hasta(async () => (await marcador(A.page)).join() === '1,1' && (await marcador(B.page)).join() === '1,1', 40000), 'A y B terminan con 1 – 1 (cada uno ve el gol del otro): A=' + (await marcador(A.page)) + ' B=' + (await marcador(B.page)));
  ok(/⇄/.test(await A.page.textContent('#modeBadge')), 'A: también ve el partido como compartido');

  // 5) B pausa el reloj: A lo ve pausado, y los goles no se pierden
  await B.page.click('.clock-actions .button-primary');
  ok(await hasta(async () => /REANUDAR/.test(await botonReloj(A.page)), 40000), 'A: el reloj queda pausado por B');
  ok((await marcador(A.page)).join() === '1,1', 'A: la pausa de B no tocó los goles');

  // 6) Un tercer dispositivo toma el control: A y B dejan el partido
  await login(C.page, 'Mendoza', 'clave-de-prueba-1');
  ok(await hasta(async () => /Cómo querés entrar/.test(await titulo(C.page))), 'C: también pregunta cómo entrar');
  await C.page.click('[data-action="choose-mode"][data-mode="tournament"]');
  await C.page.waitForSelector('[data-action="pick-tournament"]'); await C.page.click('[data-action="pick-tournament"]');
  await C.page.waitForSelector('.fx-match');
  let tomar = false;
  for (let i = 0; i < 12 && !tomar; i++) { await C.page.click('[data-action="t-fx-open"]'); tomar = await C.page.$('#modalRoot [data-action="t-fx-join"][data-how="tomar"]'); if (!tomar) { await cerrarModales(C.page); await esperar(2000); } }
  ok(!!tomar, 'C: el partido ofrece tomar el control');
  await C.page.click('#modalRoot [data-action="t-fx-join"][data-how="tomar"]');
  await C.page.waitForSelector('.clock-card');
  ok((await marcador(C.page)).join() === '1,1', 'C: toma el partido con el 1 – 1 de los dos');
  ok(!/⇄/.test(await C.page.textContent('#modeBadge')), 'C: tomar el control no es compartido');
  ok(await hasta(async () => (await marcador(A.page)).join() === '0,0' && (await marcador(B.page)).join() === '0,0', 40000), 'A y B quedan con un partido vacío: ya no controlan el anterior');

  // 7) C guarda el partido: A y B no lo vuelven a ofrecer y el fixture lo marca jugado
  await C.page.evaluate(() => { const m = document.querySelector('.header-actions'); if (!m.classList.contains('is-open')) document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('[data-action="sheet"]').click(); });
  await C.page.waitForSelector('[data-action="save"]', { timeout: 8000 }).catch(async () => { await C.page.screenshot({ path: process.env.UC_SHOT || '/tmp/uc-fallo.png' }); });
  await C.page.evaluate(() => document.querySelector('[data-action="save"]').click());
  await esperar(1200);
  const confirmar = await C.page.$('#modalRoot [data-action="confirm-save"], #modalRoot [data-action="save-confirm"]');
  if (confirmar) await confirmar.click();
  ok(await hasta(async () => (await C.page.$('[data-action="new-match"]')) !== null, 8000), 'C: la planilla queda guardada');
  await menu(C.page, 'modeBadge').catch(() => {});
  await A.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await esperar(4000);
  ok((await A.page.$('[data-action="resume-match"]')) === null, 'A: no le ofrece retomar un partido que ya está guardado');

  for (const d of [A, B, C]) ok(d.page.errores.length === 0, 'sin errores de consola en ' + d.page.nombre + (d.page.errores.length ? ' ' + d.page.errores.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
