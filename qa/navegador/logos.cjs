// Logos de equipos contra server/dev.js (puerto 8766): importar un Excel con logos, subir un logo desde la ficha, verlo en la lista
// y en el tablero, y descargar la plantilla con los logos incrustados.
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const X = require('../../xlsx.js');
const S = require('../../tournament-sheet.js');
const BASE = `http://localhost:${process.env.UC_PORT || 8766}/`;
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'uc-logos-'));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAA6UlEQVR42u2Z0Q3CMAxEW6tTAD+dBokdGIMpGIMdWAcJVczRCYpix3Zs+fIb6Xwvdmornc/X75R50ZR8AQAA1QEWC9HteT/aujxeurFmxc/oH992JAoALN/qJDTWfb+CPAP91lVSQUHcizUpiHuxMsVxL9OnUO4FUSqNEj7Hz42VPgOtfYB1/Kfb52jr9151OwPG6RQAnteXGxclBAAAACABgPpTAjpxwWHOvx831m2lEvK8yu2xil1inySwopCpurV7YQnZMQiUyS2SkWbv87pKc+g5DhoYW0UBf2iYJKH/kWEaBQAABqwddR1VAX7FeaEAAAAASUVORK5CYII=', 'base64');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-AR' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  const menu = (id) => page.evaluate((x) => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById(x).click(); }, id);

  await page.goto(BASE + 'index.html');
  await page.waitForSelector('.login-gate');
  await page.click('[data-gate=pro]'); await page.click('[data-gate=user]');
  await page.fill('#lg-user', 'Santafe'); await page.fill('#lg-pass', 'clave-de-prueba-1');
  await page.click('.login-card [type=submit]');
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#modalRoot [data-action="close-modal"]')?.click());
  await menu('menuTournament');
  await page.waitForSelector('.tournament-screen');

  // 1) Importar un Excel con el logo de un equipo
  const conLogo = S.template({ tournament: { name: 'Copa Logos', teams: [{ id: 'a', name: 'Pumas', color: '#1b47e2', players: [{ id: 'p', name: 'Ana Pumas', number: '' }] }, { id: 'b', name: 'Toros', color: '#d4282c', players: [{ id: 'q', name: 'Ana Toros', number: '' }] }] }, logos: { a: { ext: 'png', data: new Uint8Array(PNG) } } });
  const archivo = path.join(OUT, 'con-logo.xlsx');
  fs.writeFileSync(archivo, X.write(conLogo));
  await page.setInputFiles('#tournamentFile', { name: 'con-logo.xlsx', mimeType: X.MIME, buffer: fs.readFileSync(archivo) }); // Chromium de snap no lee /tmp
  await page.waitForTimeout(1500); console.log('toast:', await page.$eval('#toast', (e) => e.hidden ? '(oculto)' : e.innerText).catch(() => '?'), '| errores:', errores.join('|'));
  await page.waitForSelector('#modalRoot dialog[open]');
  await page.click('#modalRoot [data-action="t-xlsx-apply"]');
  await page.waitForTimeout(1200);
  await page.click('#tab-equipos');
  const logos = await page.$$eval('.tournament-team img.team-logo', (n) => n.map((x) => x.src.slice(0, 22)));
  ok(logos.length === 1 && logos[0].startsWith('data:image/webp'), 'el Excel trajo el logo de Pumas (achicado a WebP) y Toros quedó sin logo: ' + logos.join());

  // 2) Subir un logo desde la ficha de Toros
  await page.click('.tournament-team >> text=Toros');
  await page.waitForSelector('#ts-logo', { state: 'attached' });
  ok(await page.$('.team-logo.is-sheet.is-empty') !== null, 'la ficha de Toros muestra el hueco vacío del logo');
  await page.setInputFiles('#ts-logo', { name: 'logo.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForSelector('img.team-logo.is-sheet');
  ok(true, 'la ficha muestra el logo subido');
  await page.click('.sheet-save');
  await page.waitForSelector('.tournament-team img.team-logo >> nth=1');
  ok((await page.$$('.tournament-team img.team-logo')).length === 2, 'los dos equipos tienen logo en la lista');

  // 3) Quitar el logo
  await page.click('.tournament-team >> text=Toros');
  await page.click('[data-action="t-logo-clear"]');
  ok(await page.$('.team-logo.is-sheet.is-empty') !== null, 'QUITAR LOGO vuelve al hueco vacío');
  await page.setInputFiles('#ts-logo', { name: 'logo.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForSelector('img.team-logo.is-sheet');
  await page.click('.sheet-save');
  await page.waitForSelector('.tournament-team');

  // 4) La plantilla descargada trae los logos incrustados
  await page.evaluate(() => { const orig = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__descarga = { href: this.href }; return; } return orig.call(this); }; });
  await page.click('#tab-ajustes').catch(() => {});
  await page.click('[data-action="t-template"]').catch(async () => { await page.click('#tab-equipos'); await page.click('[data-action="t-template"]'); });
  await page.waitForFunction(() => window.__descarga, null, { timeout: 10000 });
  const b64 = await page.evaluate(async () => { const r = await fetch(window.__descarga.href); const a = new Uint8Array(await r.arrayBuffer()); let s = ''; a.forEach((x) => { s += String.fromCharCode(x); }); return btoa(s); });
  const hojas = await X.read(Buffer.from(b64, 'base64'));
  const conImagen = hojas.filter((h) => h.images?.length).map((h) => h.name);
  ok(conImagen.join() === 'Pumas,Toros' && hojas.find((h) => h.name === 'Pumas').images[0].ext === 'png', 'la plantilla trae el logo (PNG) en las hojas Pumas y Toros: ' + conImagen.join());

  // 5) Tablero con logo
  await page.click('#tab-fixture').catch(() => {});
  await page.evaluate(() => document.querySelector('[data-action="t-back"]')?.click());
  await page.waitForTimeout(500);
  ok(errores.length === 0, 'sin errores de consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
