// Capturas del manual (manual/img/<idioma>-<nn>-<nombre>.webp) en español e inglés, a 390×844 (y algunas anchas a 1280).
// Levanta su propio server/dev.js (base en memoria, cuentas de prueba) y recorre la app como un usuario.
//   node qa/manual-capturas.cjs            → las dos versiones
//   LANGS=es PNG=/tmp/x node qa/...       → solo español y además guarda PNG para revisar
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const X = require('../xlsx.js');
const S = require('../tournament-sheet.js');
const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'manual', 'img');
const PORT = Number(process.env.UC_PORT || 8771);
const BASE = `http://localhost:${PORT}/`;
const LANGS = (process.env.LANGS || 'es,en').split(',');
const PNG = process.env.PNG || '';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const NOMBRES = ['Halcones', 'Pumas', 'Toros', 'Zorros', 'Cóndores', 'Yaguaretés', 'Ñandúes', 'Pingüinos'];
const COLORES = { es: ['Rojo', 'Verde', 'Azul', 'Naranja', 'Violeta', 'Amarillo', 'Celeste', 'Negro'], en: ['Red', 'Green', 'Blue', 'Orange', 'Purple', 'Yellow', 'Light blue', 'Black'] };
const JUGADORES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fede', 'Gabi'];

async function servidor() {
  try { if ((await fetch(BASE + 'api/health')).ok) throw new Error('el puerto ' + PORT + ' ya está en uso'); } catch (e) { if (/en uso/.test(e.message)) throw e; }
  const p = spawn(process.execPath, ['server/dev.js'], { cwd: ROOT, env: { ...process.env, UC_PORT: String(PORT), UC_DB: ':memory:' }, stdio: 'ignore' });
  process.on('exit', () => p.kill());
  for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE + 'api/health')).ok) return p; } catch {} await esperar(100); }
  throw new Error('no arrancó server/dev.js');
}

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  if (PNG) fs.mkdirSync(PNG, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const conv = await (await browser.newContext()).newPage();
  async function guardar(lang, nombre, png) {
    if (PNG) fs.writeFileSync(path.join(PNG, `${lang}-${nombre}.png`), png);
    const b64 = await conv.evaluate(async (src) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.8).split(',')[1];
    }, png.toString('base64'));
    fs.writeFileSync(path.join(IMG, `${lang}-${nombre}.webp`), Buffer.from(b64, 'base64'));
    console.log('  ' + lang + '-' + nombre);
  }
  for (const lang of LANGS) {
    console.log('== ' + lang);
    const srv = await servidor();
    try { await recorrer(browser, lang, guardar); } finally { srv.kill(); }
    await esperar(300);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

async function recorrer(browser, lang, guardar) {
  const locale = lang === 'en' ? 'en-US' : 'es-AR';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  const shot = async (nombre, o = {}) => { await esperar(o.wait ?? 350); if (!o.toast) await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.hidden = true; }); await guardar(lang, nombre, await page.screenshot(o.full ? { fullPage: true } : {})); };
  const click = async (sel) => { await page.waitForSelector(sel, { state: 'attached', timeout: 8000 }); return page.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error('no está ' + s); el.click(); }, sel); };
  const menu = async (id) => { await page.evaluate((x) => { const n = document.querySelector('.header-actions'); if (!n.classList.contains('is-open')) document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById(x).click(); }, id); await esperar(300); };
  const cerrarModal = () => page.evaluate(() => { for (const b of document.querySelectorAll('#modalRoot [data-action="close-modal"]')) { b.click(); break; } });

  // 01 Entrada: cuenta o sin cuenta
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('.login-gate');
  await shot('01-entrada');
  await page.click('[data-gate=pro]');
  await page.click('[data-gate=user]');
  await page.fill('#lg-user', 'Mendoza');
  await page.fill('#lg-pass', 'clave-de-prueba-1');
  await page.click('.login-card [type=submit]');
  await page.waitForTimeout(1200);
  await shot('02-bienvenida');

  // Modo partido: equipos, jugadores, tiempos
  await click('[data-action="choose-mode"][data-mode="match"]');
  await page.waitForSelector('[data-form="welcome-teams"]');
  await page.fill('[name="name-0"]', 'Halcones');
  await page.fill('[name="name-1"]', 'Pumas');
  await shot('03-equipos');
  await click('[data-form="welcome-teams"] [type=submit]');
  await page.waitForSelector('[data-form="welcome-players"]');
  await page.fill('[name="players-0"]', '7 Ana\n12 Beto\nCaro');
  await page.fill('[name="players-1"]', '3 Dani\n9 Eli');
  await shot('04-jugadores');
  await click('[data-form="welcome-players"] [type=submit]');
  await page.waitForSelector('[data-action="use-profile"]');
  await shot('05-tiempos');
  await click('[data-action="use-profile"]');
  await page.waitForSelector('.clock-card');
  await shot('06-tablero');

  // Durante el partido
  await click('[data-action="toggle-clock"]');
  await esperar(2200);
  await click('[data-action="goal"][data-team="0"]');
  await page.waitForSelector('[data-form="goal"]');
  await page.evaluate(() => { const f = document.querySelector('[data-form="goal"]'); [...f.querySelectorAll('select')].forEach((s, i) => { const o = [...s.options].filter((x) => x.value && x.value !== '__other')[i]; if (o) s.value = o.value; }); document.activeElement?.blur(); });
  await shot('07-gol');
  await page.evaluate(() => document.querySelector('[data-form="goal"] .button-primary').click());
  await esperar(400);
  await click('[data-action="toggle-timer"][data-timer="call-0"]');
  await page.waitForSelector('[data-form="call"]');
  await page.evaluate(() => { const r = document.querySelector('[data-form="call"] input[type=radio]'); if (r) r.checked = true; });
  await shot('08-llamado');
  await page.evaluate(() => (document.querySelector('[data-form="call"] .button-primary') || document.querySelector('[data-form="call"] button:not([type=button])')).click());
  await esperar(300);
  await click('[data-action="toggle-timer"][data-timer="pull"]');
  await click('[data-action="timeout"][data-team="1"]');
  await esperar(300);
  await page.evaluate(() => document.querySelector('#modalRoot .button-primary')?.click());
  await esperar(2500);
  await shot('09-contadores');
  await page.evaluate(() => { const n = document.querySelector('.header-actions'); if (!n.classList.contains('is-open')) document.querySelector('[data-action="toggle-menu"]').click(); });
  await shot('10-menu');
  await page.evaluate(() => document.querySelector('[data-action="toggle-menu"]').click());
  await page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('.header-actions [data-action="sheet"]').click(); });
  await page.waitForSelector('.sheet-screen');
  await shot('11-planilla');

  // Modo torneo: se reinicia el partido suelto y se entra al torneo
  await page.evaluate(() => { document.querySelector('[data-action="toggle-menu"]').click(); document.querySelector('.header-actions [data-action="reset"]').click(); });
  await click('[data-action="confirm-reset"]');
  await esperar(300);
  await menu('menuTournament');
  await page.waitForSelector('.tournament-screen');
  await shot('12-torneo-crear');
  await page.evaluate(() => document.querySelector('.t-callout').scrollIntoView({ block: 'center' }));
  await shot('13-excel');
  const libro = (nombre, tipo, n) => {
    const spec = S.template({ lang });
    spec[1].rows[2].cells[1].v = nombre;
    spec[1].rows[3].cells[1].v = tipo;
    NOMBRES.slice(0, n).forEach((eq, i) => { const h = spec[2 + i]; h.rows[2].cells[1].v = eq; h.rows[3].cells[1].v = COLORES[lang][i]; JUGADORES.forEach((j, k) => { h.rows[7 + k] = [{ v: String(k * 3 + i + 1) }, { v: `${j} ${eq.slice(0, 1)}.` }]; }); });
    return Buffer.from(X.write(spec));
  };
  await page.setInputFiles('#tournamentFile', { name: 'copa.xlsx', mimeType: X.MIME, buffer: libro('Copa Primavera', lang === 'en' ? 'Knockout' : 'Eliminación simple', 8) });
  await page.waitForSelector('.import-preview');
  await shot('14-importar-excel');
  await click('[data-action="t-xlsx-apply"]');
  await page.waitForSelector('.t-tabs');
  await shot('15-fixture-tipos');
  await click('#tab-equipos');
  await shot('16-equipos');
  await click('[data-action="t-open-team"]');
  await page.waitForSelector('[data-form="t-team"]');
  await shot('17-ficha-equipo');
  await click('[data-action="t-cancel-sheet"]');
  await click('#tab-fixture');
  await click('[data-action="t-fixture-generate"]');
  await page.waitForSelector('.fx-bracket');
  await shot('18-llaves');
  const r1 = await page.$$eval('.fx-col.is-r1 [data-action="t-fx-open"]', (n) => n.map((x) => x.dataset.id));
  await click(`[data-action="t-fx-open"][data-id="${r1[0]}"]`);
  await page.waitForSelector('[data-form="t-score"]');
  await shot('19-partido-fixture');
  const resultado = async (id, h, a) => { await click(`[data-action="t-fx-open"][data-id="${id}"]`); await page.waitForSelector('[data-form="t-score"]'); await page.fill('#sc-home', String(h)); await page.fill('#sc-away', String(a)); await click('[data-form="t-score"] [type=submit]'); await esperar(250); };
  await page.fill('#sc-home', '15'); await page.fill('#sc-away', '11'); await click('[data-form="t-score"] [type=submit]'); await esperar(250);
  await click(`[data-action="t-fx-open"][data-id="${r1[0]}"]`);
  await page.waitForSelector('[data-form="t-score"]');
  await page.evaluate(() => document.activeElement?.blur());
  await shot('20-corregir');
  await cerrarModal();
  await resultado(r1[2], 9, 13);
  await resultado(r1[3], 15, 14);
  // Jugar un cruce desde el fixture
  await click(`[data-action="t-fx-open"][data-id="${r1[1]}"]`);
  await click('#modalRoot [data-action="t-fixture-play"]');
  await page.waitForSelector('.clock-card');
  await click('[data-action="toggle-clock"]');
  await esperar(1500);
  await click('[data-action="goal"][data-team="0"]');
  await page.waitForSelector('[data-form="goal"]');
  await page.evaluate(() => { const f = document.querySelector('[data-form="goal"]'); [...f.querySelectorAll('select')].forEach((s, i) => { const o = [...s.options].filter((x) => x.value && x.value !== '__other')[i + 1]; if (o) s.value = o.value; }); document.activeElement?.blur(); });
  await shot('21-gol-torneo');
  await page.evaluate(() => document.querySelector('[data-form="goal"] .button-primary').click());
  await esperar(300);
  if (await page.$('[data-form="goal"]')) await cerrarModal();
  await shot('22-tablero-torneo');
  await click('#modeBadge');
  await page.waitForSelector('.fx-bracket');
  await page.evaluate(() => document.querySelector('.fx-match.is-jugando').scrollIntoView({ block: 'center', inline: 'center' }));
  await shot('23-en-juego');
  await page.evaluate(() => document.querySelector('[data-action="t-share-on"]').scrollIntoView({ block: 'center' }));
  await click('[data-action="t-share-on"]');
  await esperar(500);
  await page.evaluate(() => document.querySelector('.share-box').scrollIntoView({ block: 'center' }));
  const url = await page.inputValue('#share-url');
  await page.evaluate(() => { const i = document.getElementById('share-url'); i.value = 'https://iona.ar/ultimateclock/vivo.html?u=mendoza&t=copa-primavera'; });
  await shot('24-compartir');
  await esperar(2500);
  const pub = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale, deviceScaleFactor: 2 })).newPage();
  await pub.goto(url);
  await pub.waitForSelector('.fx-bracket');
  await esperar(500);
  await guardar(lang, '25-vivo', await pub.screenshot());
  await pub.setViewportSize({ width: 1280, height: 760 });
  await esperar(800);
  await guardar(lang, '26-vivo-ancho', await pub.screenshot());
  await page.setViewportSize({ width: 1280, height: 860 });
  await esperar(600);
  await page.evaluate(() => document.querySelector('.fx-view').scrollIntoView({ block: 'center' }));
  await esperar(300);
  await guardar(lang, '27-llaves-ancho', await page.locator('.fx-view').screenshot());
  await page.setViewportSize({ width: 390, height: 844 });
  await esperar(400);

  // Otro dispositivo: retomar el partido en curso
  const otro = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale, deviceScaleFactor: 2 })).newPage();
  await otro.goto(BASE + 'index.html');
  await otro.waitForSelector('.login-gate');
  await otro.click('[data-gate=pro]'); await otro.click('[data-gate=user]'); await otro.fill('#lg-user', 'Mendoza'); await otro.fill('#lg-pass', 'clave-de-prueba-1');
  await otro.click('.login-card [type=submit]');
  // Con un torneo en marcha, al entrar pregunta cómo seguir; en MODO PARTIDO ofrece retomar el partido en curso
  await otro.waitForSelector('.entry-choice', { timeout: 15000 });
  await esperar(500);
  await guardar(lang, '34-pregunta-entrada', await otro.screenshot());
  await otro.click('.entry-choice [data-action="choose-mode"][data-mode="match"]');
  await otro.waitForSelector('[data-action="resume-match"]', { timeout: 15000 }).catch(() => {});
  await esperar(800);
  await guardar(lang, '28-retomar', await otro.screenshot());

  // Todos contra todos: segundo torneo
  await click('#tab-equipos');
  await page.setInputFiles('#tournamentFile', { name: 'liga.xlsx', mimeType: X.MIME, buffer: libro(lang === 'en' ? 'Autumn League' : 'Liga Otoño', lang === 'en' ? 'Round robin' : 'Todos contra todos', 6) });
  await page.waitForSelector('.import-preview');
  await click('[data-action="t-xlsx-apply"][data-target="new"]');
  await page.waitForSelector('.t-tabs');
  await click('[data-action="t-fixture-generate"]');
  await page.waitForSelector('.fx-rounds');
  const ids = await page.$$eval('.fx-round [data-action="t-fx-open"]', (n) => n.map((x) => x.dataset.id));
  for (const [i, h, a] of [[0, 15, 9], [1, 12, 12], [2, 8, 15], [3, 15, 13], [4, 11, 15], [5, 15, 10]]) await resultado(ids[i], h, a);
  await page.evaluate(() => { const app = document.getElementById('app'); app.scrollTop = 0; document.querySelector('.fx-progress').scrollIntoView({ block: 'start' }); app.scrollTop -= 70; });
  await shot('29-liga');
  await page.evaluate(() => document.querySelector('.fx-cross-wrap').scrollIntoView({ block: 'center' }));
  await shot('30-tabla-cruzada');
  await click('#tab-tabla');
  await shot('31-posiciones');
  await click('#tab-ajustes');
  await shot('32-ajustes');
  await page.evaluate(() => document.querySelector('.tournament-danger').scrollIntoView({ block: 'center' }));
  await shot('33-archivo');

  // Varios dispositivos: un tercero elige el torneo y se une al partido que se está jugando
  const tercero = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale, deviceScaleFactor: 2 })).newPage();
  await tercero.goto(BASE + 'index.html');
  await tercero.waitForSelector('.login-gate');
  await tercero.click('[data-gate=pro]'); await tercero.click('[data-gate=user]'); await tercero.fill('#lg-user', 'Mendoza'); await tercero.fill('#lg-pass', 'clave-de-prueba-1');
  await tercero.click('.login-card [type=submit]');
  await tercero.waitForSelector('.entry-choice', { timeout: 15000 });
  await tercero.click('.entry-choice [data-action="choose-mode"][data-mode="tournament"]');
  await tercero.waitForSelector('[data-action="pick-tournament"]');
  await esperar(500);
  await guardar(lang, '35-elegir-torneo', await tercero.screenshot());
  await tercero.evaluate(() => [...document.querySelectorAll('[data-action="pick-tournament"]')].find((b) => /Primavera/.test(b.textContent)).click());
  await tercero.waitForSelector('.fx-match.is-jugando', { timeout: 15000 });
  await tercero.evaluate(() => document.querySelector('.fx-match.is-jugando [data-action="t-fx-open"], .fx-match.is-jugando').click());
  await tercero.waitForSelector('#modalRoot [data-action="t-fx-join"]', { timeout: 15000 });
  await esperar(500);
  await guardar(lang, '36-unirse-partido', await tercero.screenshot());
  if (errores.length) console.log('ERRORES', errores);
  await ctx.close();
}
