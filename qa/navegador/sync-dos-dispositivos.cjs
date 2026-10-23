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
  page.on('pageerror', (e) => page.errores.push(String(e) + (process.env.DEBUG ? ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ') : '')));
  page.on('console', (m) => { if (process.env.DEBUG && m.type() === 'warning') console.log('  [aviso]', m.text()); if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errores.push(m.text()); });
  return { ctx, page };
}
async function login(page, usuario, clave) {
  await page.goto(URL);
  await page.waitForSelector('.login-gate');
  await page.click('[data-gate=pro]',{timeout:1500}).catch(()=>{}); await page.click('[data-gate=user]',{timeout:1500}).catch(()=>{}); await page.fill('#lg-user', usuario);
  await page.fill('#lg-pass', clave);
  await page.click('.login-card [type=submit]');
}
const badge = (page) => page.evaluate(() => document.getElementById('syncBadge')?.className || '');
async function esperarBadge(page, clase, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if ((await badge(page)).includes(clase)) return true; await esperar(300); }
  return false;
}
const estadoLS = (page) => page.evaluate(async () => { // estado reconstruido desde la copia por tablas
  const db = await UCLocal.abrir();
  return UCLocal.reconstruir((await UCLocal.leerTodo(db)).registros, localStorage.getItem('uc-dispositivo'));
});
const lsLleno = (page) => page.evaluate(() => !!localStorage.getItem('ultimate-clock-v2'));

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const A = await abrirDispositivo(browser), B = await abrirDispositivo(browser);

  // 1) Pantalla de entrada
  await A.page.goto(URL);
  await A.page.waitForSelector('.login-gate');
  await A.page.click('[data-gate=pro]',{timeout:1500}).catch(()=>{}); await A.page.click('[data-gate=user]',{timeout:1500}).catch(()=>{}); await A.page.fill('#lg-user', 'Mendoza'); await A.page.fill('#lg-pass', 'mala-clave-xx');
  await A.page.click('.login-card [type=submit]');
  await A.page.waitForSelector('.login-error:not([hidden])');
  ok(/incorrectos|Wrong/.test(await A.page.textContent('.login-error')), 'clave errónea muestra mensaje genérico');
  ok(/UTILIZAR MODO GRATIS|USE FREE MODE/.test(await A.page.textContent('[data-gate=free]')), 'existe el botón UTILIZAR MODO GRATIS');
  // 2) A empieza sin cuenta, arma un torneo de 3 equipos y después inicia sesión: los datos locales suben a la cuenta
  await A.page.click('[data-gate=back] >> visible=true'); await A.page.click('[data-gate=back] >> visible=true'); // vuelve a las dos opciones
  await A.page.click('[data-gate=free]');
  await A.page.waitForTimeout(500);
  await A.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('[data-action="quick-theme"][data-theme="dark"]').click(); });
  const s = await A.page.evaluate(() => JSON.parse(localStorage.getItem('ultimate-clock-v2')));
  const eq = (i) => ({ id: 'E' + i, name: 'Equipo ' + i, color: '#1b47e2', players: [] });
  s.tournament = { id: 'T-1', name: 'Copa Prueba', createdAt: '2026-10-22T10:00:00Z', timing: s.tournament?.timing, teams: [eq(1), eq(2), eq(3)] };
  await A.page.evaluate((x) => localStorage.setItem('ultimate-clock-v2', JSON.stringify(x)), s);
  await A.page.reload();
  await A.page.waitForTimeout(600);
  await A.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuLogin').click(); });
  await A.page.waitForSelector('.login-gate');
  await A.page.click('[data-gate=pro]',{timeout:1500}).catch(()=>{}); await A.page.click('[data-gate=user]',{timeout:1500}).catch(()=>{}); await A.page.fill('#lg-user', 'Mendoza'); await A.page.fill('#lg-pass', 'clave-de-prueba-1');
  await A.page.click('.login-card [type=submit]');
  await A.page.waitForSelector('#syncBadge:not([hidden])');
  ok(true, 'login correcto: aparece el indicador de sincronización');
  ok(await esperarBadge(A.page, 'is-ok'), 'A sincroniza y queda en verde');
  await esperar(800);
  ok(!(await lsLleno(A.page)), 'con sesión iniciada no queda el estado en localStorage');

  // 3) B entra con la misma cuenta y ve el torneo
  await login(B.page, 'Mendoza', 'clave-de-prueba-1');
  await B.page.waitForSelector('#syncBadge:not([hidden])');
  ok(await esperarBadge(B.page, 'is-ok'), 'B queda en verde');
  const sb = await estadoLS(B.page);
  ok(sb?.tournament?.id === 'T-1' && sb.tournament.teams.length === 3, 'B recibió el torneo de A con sus 3 equipos');

  // 4) Sin conexión en A: genera fixture, el indicador pasa a rojo, al volver sube y B lo recibe
  await A.page.evaluate(() => document.querySelector('[data-action="toggle-menu"]').click());
  await A.page.evaluate(() => document.getElementById('menuTournament').click());
  await A.page.waitForSelector('[data-action="pick-tournament"]'); // con cuenta primero se elige el torneo
  await A.page.click('[data-action="pick-tournament"]');
  await A.page.waitForSelector('.tournament-screen');
  await A.ctx.setOffline(true);
  await A.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await A.page.click('[data-action="t-fixture-generate"]');
  ok(await esperarBadge(A.page, 'is-bad', 5000), 'sin internet: indicador rojo');
  ok((await A.page.$$('.fx-match')).length === 3, 'fixture todos contra todos de 3 equipos: 3 cruces');
  await A.ctx.setOffline(false);
  await A.page.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(await esperarBadge(A.page, 'is-ok'), 'al volver la conexión sube y queda en verde');
  let sb2;
  for (let i = 0; i < 30 && !sb2?.tournament?.fixture?.matches?.length; i++) { await B.page.evaluate(() => window.dispatchEvent(new Event('online'))); await esperar(1000); sb2 = await estadoLS(B.page); }
  ok(sb2?.tournament?.fixture?.matches?.length === 3, 'B recibió el fixture sin perder nada');

  // 5) Mismo torneo cambiado en los dos dispositivos: aparece el cartel y se elige el oficial
  await B.ctx.setOffline(true); await A.ctx.setOffline(true);
  await B.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuTournament').click(); });
  await B.page.waitForSelector('[data-action="pick-tournament"]');
  await B.page.click('[data-action="pick-tournament"]');
  await B.page.waitForSelector('.tournament-screen');
  await A.page.click('#tab-ajustes'); await B.page.click('#tab-ajustes');
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

  // 5b) Cada evento se guarda en el servidor al instante; si el teléfono A falla, B retoma el partido
  await A.page.evaluate(() => { for (const b of document.querySelectorAll('#modalRoot [data-action="close-modal"]')) b.click(); });
  await A.page.evaluate(() => { const m = document.querySelector('.header-actions'); if (!m.classList.contains('is-open')) document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById('menuTournament').click(); });
  await A.page.click('#tab-fixture');
  await A.page.click('[data-action="t-fx-open"]');
  await A.page.click('#modalRoot [data-action="t-fixture-play"]');
  await A.page.waitForSelector('.clock-card');
  await A.page.evaluate(() => document.querySelectorAll('[data-action="goal"]')[0].click());
  await A.page.waitForTimeout(400);
  await A.page.evaluate(() => document.querySelector('#modalRoot [data-form] [type=submit]')?.click());
  await A.page.waitForTimeout(1500);
  const enServidor = await A.page.evaluate(async () => { const r = await UCSession.pedir('sync/bajar?desde=0'); return (await r.json()).cambios.filter((c) => c.tabla === 'partidoActivo').map((c) => ({ id: c.id, goles: (c.data?.events || []).filter((e) => e.type === 'goal').length })); });
  ok(enServidor.some((x) => x.goles === 1), 'el gol ya está en el servidor 1,5 s después: ' + JSON.stringify(enServidor));
  await A.ctx.close(); // el teléfono A "se rompe"
  const C = await abrirDispositivo(browser);
  await login(C.page, 'Mendoza', 'clave-de-prueba-1');
  await C.page.waitForSelector('[data-action="choose-mode"][data-mode="match"]', { timeout: 30000 }); // con un torneo en marcha primero pregunta cómo entrar
  await C.page.click('[data-action="choose-mode"][data-mode="match"]');
  await C.page.waitForSelector('[data-action="resume-match"]', { timeout: 30000 });
  ok(true, 'un dispositivo nuevo ofrece retomar el partido en curso');
  await C.page.click('[data-action="resume-match"]');
  await C.page.waitForTimeout(800);
  const retomado = await estadoLS(C.page);
  ok(retomado.activeMatch.events.some((e) => e.type === 'goal') && retomado.activeMatch.teams.reduce((n, t) => n + t.score, 0) === 1, 'el partido retomado conserva el gol');
  ok(!retomado.activeMatch.clock.running, 'el reloj queda pausado al retomar');
  ok(!(await lsLleno(C.page)), 'tampoco queda estado en localStorage en el dispositivo nuevo');
  C.page.errores.length && console.log(C.page.errores);
  C.ctx.close();

  // 6) SALIR DE ESTE USUARIO con todo subido borra los datos de la cuenta y vuelve directo al modo sin usuario
  await B.page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); });
  ok(/SALIR DE ESTE USUARIO|LOG OUT OF THIS USER/.test(await B.page.textContent('#menuLogout')), 'el menú ofrece SALIR DE ESTE USUARIO');
  await B.page.evaluate(() => document.getElementById('menuLogout').click());
  await B.page.waitForSelector('[data-action="account-logout-confirm"]');
  await B.page.click('[data-action="account-logout-confirm"]');
  await B.page.waitForLoadState('load');
  await B.page.waitForTimeout(1200);
  ok((await B.page.$('.login-gate')) === null, 'al salir no vuelve a pedir usuario: queda en modo sin usuario');
  ok(!(await estadoLS(B.page))?.tournament, 'tras salir no queda el torneo en el dispositivo');
  ok((await B.page.$('#syncBadge:not([hidden])')) === null, 'sin usuario no hay indicador y la app abre');

  for (const [n, d] of [['A', A], ['B', B]]) ok(d.page.errores.length === 0, 'sin errores de consola en ' + n + (d.page.errores.length ? ' ' + d.page.errores.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
