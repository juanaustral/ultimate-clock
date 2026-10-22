// Prueba en Chromium con dos dispositivos de la misma cuenta contra server/dev.js (puerto 8766).
//   UC_PORT=8766 node server/dev.js &   y luego:   node qa/navegador/sync-dos-dispositivos.cjs
// Ajustar la ruta de playwright-core y del ejecutable según el equipo.
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const URL = 'http://localhost:8766/index.html';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrirDispositivo(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.errores = [];
  page.on('pageerror', (e) => page.errores.push(String(e)));
  page.on('console', (m) => { if (process.env.DEBUG && m.type() === 'warning') console.log('  [aviso]', m.text()); if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errores.push(m.text()); });
  return { ctx, page };
}
async function login(page, usuario, clave) {
  await page.goto(URL);
  await page.waitForSelector('.login-gate');
  await page.fill('#lg-user', usuario);
  await page.fill('#lg-pass', clave);
  await page.click('.login-card [type=submit]');
}
const badge = (page) => page.evaluate(() => document.getElementById('syncBadge')?.className || '');
async function esperarBadge(page, clase, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if ((await badge(page)).includes(clase)) return true; await esperar(300); }
  return false;
}
const estadoLS = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ultimate-clock-v2') || 'null'));

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const A = await abrirDispositivo(browser), B = await abrirDispositivo(browser);

  // 1) Pantalla de entrada
  await A.page.goto(URL);
  await A.page.waitForSelector('.login-gate');
  await A.page.fill('#lg-user', 'Mendoza'); await A.page.fill('#lg-pass', 'mala-clave-xx');
  await A.page.click('.login-card [type=submit]');
  await A.page.waitForSelector('.login-error:not([hidden])');
  ok(/incorrectos|Wrong/.test(await A.page.textContent('.login-error')), 'clave errónea muestra mensaje genérico');
  ok(/USAR SIN CUENTA|USE WITHOUT/.test(await A.page.textContent('[data-gate=local]')), 'existe el botón USAR SIN CUENTA');
  await A.page.fill('#lg-pass', 'clave-de-prueba-1');
  await A.page.click('.login-card [type=submit]');
  await A.page.waitForSelector('#syncBadge:not([hidden])');
  ok(true, 'login correcto: aparece el indicador de sincronización');

  // 2) Torneo de 3 equipos cargado en A (se inyecta en el almacenamiento y se recarga)
  await A.page.evaluate(() => document.querySelector('[data-action="toggle-menu"]').click());
  await A.page.evaluate(() => document.querySelector('[data-action="quick-theme"][data-theme="dark"]').click());
  const s = await estadoLS(A.page);
  const eq = (i) => ({ id: 'E' + i, name: 'Equipo ' + i, color: '#1b47e2', players: [] });
  s.tournament = { id: 'T-1', name: 'Copa Prueba', createdAt: '2026-10-22T10:00:00Z', timing: s.tournament?.timing, teams: [eq(1), eq(2), eq(3)] };
  await A.page.evaluate((x) => localStorage.setItem('ultimate-clock-v2', JSON.stringify(x)), s);
  await A.page.reload();
  ok(await esperarBadge(A.page, 'is-ok'), 'A sincroniza y queda en verde');

  // 3) B entra con la misma cuenta y ve el torneo
  await login(B.page, 'Mendoza', 'clave-de-prueba-1');
  await B.page.waitForSelector('#syncBadge:not([hidden])');
  ok(await esperarBadge(B.page, 'is-ok'), 'B queda en verde');
  const sb = await estadoLS(B.page);
  ok(sb?.tournament?.id === 'T-1' && sb.tournament.teams.length === 3, 'B recibió el torneo de A con sus 3 equipos');

  // 4) Sin conexión en A: genera fixture, el indicador pasa a rojo, al volver sube y B lo recibe
  await A.page.evaluate(() => document.querySelector('[data-action="toggle-menu"]').click());
  await A.page.evaluate(() => document.getElementById('menuTournament').click());
  await A.page.waitForSelector('.tournament-screen');
  await A.ctx.setOffline(true);
  await A.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await A.page.click('[data-action="t-fixture-generate"]');
  ok(await esperarBadge(A.page, 'is-bad', 5000), 'sin internet: indicador rojo');
  ok((await A.page.$$('.fixture-match')).length === 3, 'fixture todos contra todos de 3 equipos: 3 cruces');
  await A.ctx.setOffline(false);
  await A.page.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(await esperarBadge(A.page, 'is-ok'), 'al volver la conexión sube y queda en verde');
  let sb2;
  for (let i = 0; i < 30 && !sb2?.tournament?.fixture?.matches?.length; i++) { await B.page.evaluate(() => window.dispatchEvent(new Event('online'))); await esperar(1000); sb2 = await estadoLS(B.page); }
  ok(sb2?.tournament?.fixture?.matches?.length === 3, 'B recibió el fixture sin perder nada');

  // 5) Mismo torneo cambiado en los dos dispositivos: aparece el cartel y se elige el oficial
  await B.ctx.setOffline(true); await A.ctx.setOffline(true);
  await B.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuTournament').click(); });
  await B.page.waitForSelector('.tournament-screen');
  await A.page.fill('#sc-win', '2'); await A.page.click('.scoring-form [type=submit]');
  await B.page.fill('#sc-win', '5'); await B.page.click('.scoring-form [type=submit]');
  await A.ctx.setOffline(false); await A.page.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(await esperarBadge(A.page, 'is-ok'), 'A sube su cambio primero');
  await B.ctx.setOffline(false); await B.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await B.page.waitForSelector('[data-action="sync-resolve"]', { timeout: 20000 });
  ok(true, 'B muestra el cartel de conflicto con la opción de elegir el dispositivo oficial');
  ok(await esperarBadge(B.page, 'is-bad', 2000), 'mientras hay conflicto el indicador sigue en rojo');
  await B.page.click('[data-action="sync-resolve"][data-choice="local"]');
  ok(await esperarBadge(B.page, 'is-ok'), 'B queda en verde tras elegir');
  let win;
  for (let i = 0; i < 30 && win !== 5; i++) { await A.page.evaluate(() => window.dispatchEvent(new Event('online'))); await esperar(1500); win = (await estadoLS(A.page))?.tournament?.scoring?.win; }
  ok(win === 5, 'A recibe la versión oficial elegida (victoria = 5)');

  // 6) Cerrar sesión con todo subido borra los datos locales de la cuenta
  await B.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuLogout').click(); });
  await B.page.waitForSelector('[data-action="account-logout-confirm"]');
  await B.page.click('[data-action="account-logout-confirm"]');
  await B.page.waitForSelector('.login-gate');
  ok(!(await estadoLS(B.page))?.tournament, 'tras cerrar sesión no queda el torneo en el dispositivo');

  // 7) USAR SIN CUENTA
  await B.page.click('[data-gate=local]');
  await B.page.waitForTimeout(800);
  ok((await B.page.$('#syncBadge:not([hidden])')) === null, 'sin cuenta no hay indicador y la app abre');

  for (const [n, d] of [['A', A], ['B', B]]) ok(d.page.errores.length === 0, 'sin errores de consola en ' + n + (d.page.errores.length ? ' ' + d.page.errores.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
