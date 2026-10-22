// Fixture en modo USAR SIN CUENTA contra server/dev.js (puerto 8766): generar, jugar un cruce, guardar y ver posiciones.
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const URL = 'http://localhost:8766/index.html';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  for (const [nombre, viewport] of [['teléfono 390x844', { width: 390, height: 844 }], ['tablet 820x1180', { width: 820, height: 1180 }]]) {
    console.log('--- ' + nombre);
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const errores = [];
    page.on('pageerror', (e) => errores.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    await page.goto(URL);
    await page.waitForSelector('.login-gate');
    await page.click('[data-gate=local]');
    await page.waitForTimeout(500);
    ok((await page.$('#syncBadge:not([hidden])')) === null, 'sin cuenta no hay indicador');
    await page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('[data-action="quick-theme"][data-theme="dark"]').click(); });
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('ultimate-clock-v2')));
    const eq = (i) => ({ id: 'E' + i, name: 'Equipo ' + i, color: ['#1b47e2', '#d4282c', '#1a8f4c'][i - 1], players: [{ id: 'P' + i, name: 'Jugador ' + i, number: String(i) }] });
    s.tournament = { id: 'T-9', name: 'Copa', createdAt: '2026-10-22T10:00:00Z', timing: s.tournament?.timing, teams: [eq(1), eq(2), eq(3)] };
    await page.evaluate((x) => localStorage.setItem('ultimate-clock-v2', JSON.stringify(x)), s);
    await page.reload();
    await page.waitForTimeout(600);
    await page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuTournament').click(); });
    await page.waitForSelector('.tournament-screen');
    // equipos ordenables
    await page.click('[data-action="t-move"][data-team="E1"][data-delta="1"]');
    const orden = await page.$$eval('.order-row strong', (n) => n.map((x) => x.textContent.replace(/^\d+\. /, '')));
    ok(orden.join() === 'Equipo 2,Equipo 1,Equipo 3', 'subir/bajar cambia el orden: ' + orden.join());
    await page.click('[data-action="t-fixture-generate"]');
    ok((await page.$$('.fixture-match')).length === 3, 'todos contra todos: 3 cruces');
    await page.selectOption('#fixture-type', 'elim');
    await page.click('[data-action="t-fixture-generate"]');
    ok((await page.$$('.fixture-match')).length === 3, 'eliminación de 3 equipos: 3 cruces (semifinal con libre, semifinal y final)');
    await page.selectOption('#fixture-type', 'rr');
    await page.click('[data-action="t-fixture-generate"]');
    // jugar el primer cruce
    await page.click('[data-action="t-fixture-play"]');
    await page.waitForTimeout(600);
    const tablero = await page.evaluate(() => !!document.querySelector('.clock-card'));
    ok(tablero, 'JUGAR abre el tablero con los equipos del cruce');
    await page.evaluate(() => { const g = document.querySelectorAll('[data-action="goal"]'); g[0].click(); });
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => !!document.querySelector('#modalRoot [data-form]'));
    if (modal) await page.evaluate(() => document.querySelector('#modalRoot [data-form] [type=submit]')?.click());
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('ultimate-clock-v2')).activeMatch);
    ok(!!m.fixtureId && m.fixtureId.startsWith('rr-'), 'el partido en curso quedó ligado al cruce: ' + m.fixtureId);
    ok(m.teams[0].score === 1, 'gol anotado');
    // sin desbordes horizontales
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!desborde, 'sin scroll horizontal');
    await page.screenshot({ path: `/tmp/claude-0/fixture-${viewport.width}.png`, fullPage: false });
    ok(errores.length === 0, 'sin errores de consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
