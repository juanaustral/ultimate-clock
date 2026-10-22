// Torneo visual contra server/dev.js (UC_PORT, por defecto 8767): plantilla de Excel, importación, fixture visual
// (llaves y todos contra todos), cambio de tipo, resultados a mano y corregidos, VER TORNEO, menú de sincronización y link en vivo.
const { chromium } = require(process.env.PW_CORE || '/home/hermes/ultimate-clock/node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const X = require('../../xlsx.js');
const S = require('../../tournament-sheet.js');
const BASE = `http://localhost:${process.env.UC_PORT || 8767}/`;
const OUT = process.env.QA_OUT || path.join(require('node:os').tmpdir(), 'uc-torneo-visual');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };
const nombres = ['Halcones', 'Pumas', 'Toros', 'Zorros', 'Cóndores', 'Yaguaretés', 'Ñandúes', 'Pingüinos'];
const colores = ['Rojo', 'Verde', 'Azul', 'Naranja', 'Violeta', 'Amarillo', 'Celeste', 'Negro'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, locale: 'es-AR' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  const menu = (id) => page.evaluate((x) => { document.querySelector('[data-action="toggle-menu"]').click(); document.getElementById(x).click(); }, id);
  const menuText = (id) => page.evaluate((x) => document.getElementById(x).textContent.trim(), id);

  await page.goto(BASE + 'index.html');
  await page.waitForSelector('.login-gate');
  await page.fill('#lg-user', 'Mendoza');
  await page.fill('#lg-pass', process.env.UC_CLAVE_PRUEBA || 'clave-de-prueba-1');
  await page.click('.login-card [type=submit]');
  await page.waitForTimeout(1500);
  if (await page.$('#modalRoot dialog')) await page.evaluate(() => document.querySelector('#modalRoot [data-action="close-modal"]')?.click());

  ok(await menuText('menuTournament') === 'ENTRAR AL MODO TORNEO', 'menú en modo partido: ENTRAR AL MODO TORNEO');
  const sync = await menuText('menuSync');
  ok(!/^SINCRONIZAR AHORA$/.test(sync) && /SINCRONIZ/.test(sync), 'el menú muestra el estado de la sincronización: ' + sync);
  await menu('menuTournament');
  await page.waitForSelector('.tournament-screen');
  ok(!!(await page.$('[data-action="t-template"]')) && !!(await page.$('[data-action="t-import"]')), 'al entrar al modo torneo están DESCARGAR PLANTILLA e IMPORTAR EXCEL');

  // Plantilla
  // Chromium de snap no comparte /tmp: se captura el archivo desde la página en lugar de la carpeta de descargas.
  await page.evaluate(() => { const orig = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__descarga = { name: this.download, href: this.href }; return; } return orig.call(this); }; });
  await page.click('[data-action="t-template"]');
  const b64 = await page.evaluate(async () => { const r = await fetch(window.__descarga.href); const a = new Uint8Array(await r.arrayBuffer()); let s = ''; a.forEach((x) => { s += String.fromCharCode(x); }); return [window.__descarga.name, btoa(s)]; });
  ok(b64[0] === 'plantilla-torneo.xlsx', 'nombre del archivo: ' + b64[0]);
  const plantilla = path.join(OUT, 'plantilla.xlsx');
  fs.writeFileSync(plantilla, Buffer.from(b64[1], 'base64'));
  const hojas = await X.read(fs.readFileSync(plantilla));
  ok(hojas.length === 10 && hojas[0].name === 'INSTRUCCIONES' && hojas[2].name === 'EQUIPO 1', 'la plantilla trae INSTRUCCIONES, TORNEO y 8 hojas EQUIPO: ' + hojas.map((h) => h.name).join(', '));

  // Completar y subir
  const spec = S.template();
  spec[1].rows[2].cells[1].v = 'Copa Primavera';
  spec[1].rows[3].cells[1].v = 'Eliminación simple';
  nombres.forEach((n, i) => { const h = spec[2 + i]; h.rows[2].cells[1].v = n; h.rows[3].cells[1].v = colores[i]; for (let j = 0; j < 7; j++) h.rows[7 + j] = [{ v: String(j + 1 + i * 10) }, { v: `${n.slice(0, 3)} Jugador ${j + 1}` }]; });
  const completada = path.join(OUT, 'completada.xlsx');
  fs.writeFileSync(completada, X.write(spec));
  await page.setInputFiles('#tournamentFile', { name: 'completada.xlsx', mimeType: X.MIME, buffer: fs.readFileSync(completada) });
  await page.waitForSelector('.import-preview');
  ok((await page.$$('.import-preview li')).length === 8, 'la vista previa muestra los 8 equipos');
  await page.screenshot({ path: path.join(OUT, '1-importar-excel.png') });
  await page.click('[data-action="t-xlsx-apply"]');
  await page.waitForSelector('.t-tabs');
  ok(await page.getAttribute('#tab-fixture', 'aria-selected') === 'true', 'después de importar se abre la pestaña FIXTURE');
  ok(await page.getAttribute('[data-action="t-fx-mode"][data-type="elim"]', 'aria-pressed') === 'true', 'el tipo del Excel (eliminación) queda elegido');
  ok(await page.textContent('#modeBadge') === 'VER TORNEO', 'el cartel de arriba dice VER TORNEO');
  ok(await menuText('menuTournament') === 'VER TORNEO', 'el menú dice VER TORNEO');

  // Generar y cambiar de tipo
  await page.click('[data-action="t-fixture-generate"]');
  await page.waitForSelector('.fx-bracket');
  ok((await page.$$('.fx-match')).length === 7, 'eliminación de 8: 7 cruces en el cuadro');
  await page.click('[data-action="t-fx-mode"][data-type="rr"]');
  await page.waitForSelector('.fx-rounds');
  ok((await page.$$('.fx-round')).length === 7 && (await page.$$('.fx-round .fx-match')).length === 28, 'todos contra todos: 7 fechas y 28 partidos');
  ok(!!(await page.$('.fx-cross')), 'tabla cruzada visible');
  await page.click('[data-action="t-fx-mode"][data-type="elim"]');
  await page.waitForSelector('.fx-bracket');

  // Resultado a mano y corrección
  const primero = await page.getAttribute('.fx-col.is-r1 [data-action="t-fx-open"]', 'data-id');
  await page.click(`[data-action="t-fx-open"][data-id="${primero}"]`);
  await page.waitForSelector('[data-form="t-score"]');
  await page.fill('#sc-home', '3'); await page.fill('#sc-away', '3');
  await page.click('[data-form="t-score"] [type=submit]');
  ok(!!(await page.$('[data-form="t-score"]')), 'en eliminación no deja guardar un empate');
  await page.fill('#sc-away', '1');
  await page.click('[data-form="t-score"] [type=submit]');
  await page.waitForTimeout(300);
  const card = `[data-action="t-fx-open"][data-id="${primero}"]`;
  ok(/FINAL/.test(await page.textContent(card)) && (await page.$$(card + ' .is-win')).length === 1, 'el cruce queda terminado con un ganador');
  const ganador1 = await page.textContent(card + ' .is-win b');
  await page.click(card);
  await page.waitForSelector('[data-form="t-score"]');
  ok(await page.inputValue('#sc-home') === '3', 'al corregir, el cuadro trae el resultado actual');
  await page.fill('#sc-home', '0'); await page.fill('#sc-away', '2');
  await page.click('[data-form="t-score"] [type=submit]');
  await page.waitForTimeout(300);
  const ganador2 = await page.textContent(card + ' .is-win b');
  ok(ganador1 !== ganador2, `la corrección cambia el ganador (${ganador1} → ${ganador2}) y avanza en el cuadro`);
  const semi = await page.$$eval('.fx-col:not(.is-r1) .fx-team b', (n) => n.map((x) => x.textContent));
  ok(semi.includes(ganador2), 'el ganador corregido aparece en la fase siguiente');
  await page.click('[data-action="t-fx-mode"][data-type="rr"]');
  await page.waitForSelector('#modalRoot dialog');
  ok(/no se puede cambiar/.test(await page.textContent('#modalRoot')), 'con partidos jugados, cambiar el tipo explica por qué no se puede');
  await page.click('#modalRoot [data-action="close-modal"]');

  // Jugar un cruce y verlo EN JUEGO
  const segundo = (await page.$$eval('.fx-col.is-r1 [data-action="t-fx-open"]', (n) => n.map((x) => x.dataset.id)))[1];
  await page.click(`[data-action="t-fx-open"][data-id="${segundo}"]`);
  await page.click('#modalRoot [data-action="t-fixture-play"]');
  await page.waitForSelector('.clock-card');
  await page.evaluate(() => document.querySelectorAll('[data-action="goal"]')[0].click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('#modalRoot [data-action="close-modal"]')?.click());
  await page.click('#modeBadge');
  await page.waitForSelector('.tournament-screen');
  ok(/EN JUEGO/.test(await page.textContent(`[data-id="${segundo}"]`)), 'VER TORNEO lleva al fixture y el cruce figura EN JUEGO con su marcador');
  await page.screenshot({ path: path.join(OUT, '2-llaves-telefono.png'), fullPage: false });

  // Compartir en vivo
  await page.click('[data-action="t-share-on"]');
  const url = await page.inputValue('#share-url');
  ok(/vivo\.html\?u=Mendoza&t=copa-primavera$/.test(url), 'link público con el usuario: ' + url);
  await page.waitForTimeout(2500);
  ok(/SINCRONIZADO/.test(await menuText('menuSync')), 'menú: ✓ SINCRONIZADO cuando no hay nada pendiente');

  const pub = await (await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'es-AR' })).newPage();
  pub.on('pageerror', (e) => errores.push('vivo: ' + e));
  await pub.goto(url);
  await pub.waitForSelector('.fx-bracket.is-mirrored');
  const textoPub = await pub.textContent('body');
  ok(/Copa Primavera/.test(textoPub) && /EN JUEGO/.test(textoPub), 'la página en vivo muestra el torneo y el partido en juego');
  ok(!/Jugador \d/.test(textoPub), 'la página en vivo no muestra jugadores');
  ok(!(await pub.$('button.fx-match')), 'la página en vivo es solo lectura');
  await pub.screenshot({ path: path.join(OUT, '3-vivo-escritorio.png') });
  const antes = await pub.textContent(`.fx-match.is-jugando`);
  await page.click('[data-action="t-back"]');
  await page.waitForSelector('.clock-card');
  await page.evaluate(() => document.querySelectorAll('[data-action="goal"]')[1].click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('#modalRoot [data-action="close-modal"]')?.click());
  await pub.waitForFunction((a) => document.querySelector('.fx-match.is-jugando')?.textContent !== a, antes, { timeout: 25000 }).then(() => ok(true, 'el gol aparece en la página en vivo sin recargar')).catch(() => ok(false, 'el gol aparece en la página en vivo sin recargar'));

  // Escritorio del editor (cuadro espejado) y todos contra todos en otro torneo
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.click('#modeBadge');
  await page.waitForSelector('.fx-bracket.is-mirrored');
  await page.screenshot({ path: path.join(OUT, '4-llaves-escritorio.png') });
  await page.click('#tab-equipos');
  ok(!!(await page.$('.t-callout')), 'EQUIPOS tiene el bloque de Excel');
  await page.click('#tab-fixture');
  await page.click('[data-action="t-share-off"]');
  await page.waitForTimeout(2500);
  await pub.reload();
  await pub.waitForSelector('.vivo-msg');
  ok(/no existe|dejó de compartirse/.test(await pub.textContent('.vivo-msg')), 'al dejar de compartir, el link deja de mostrar el torneo');

  // Todos contra todos: torneo nuevo de 6 equipos desde Excel, con resultados cargados a mano
  const spec2 = S.template();
  spec2[1].rows[2].cells[1].v = 'Liga Otoño';
  nombres.slice(0, 6).forEach((n, i) => { const h = spec2[2 + i]; h.rows[2].cells[1].v = n; h.rows[3].cells[1].v = colores[i]; h.rows[7] = [{ v: '1' }, { v: 'Alguien' }]; });
  await page.click('#tab-equipos');
  await page.setInputFiles('#tournamentFile', { name: 'liga.xlsx', mimeType: X.MIME, buffer: Buffer.from(X.write(spec2)) });
  await page.waitForSelector('.import-preview');
  await page.click('[data-action="t-xlsx-apply"][data-target="new"]');
  await page.waitForSelector('.t-tabs');
  await page.click('[data-action="t-fixture-generate"]');
  await page.waitForSelector('.fx-rounds');
  for (const [i, h, a] of [[0, 3, 1], [1, 2, 2], [2, 0, 4], [3, 5, 4]]) {
    const id = (await page.$$eval('.fx-round [data-action="t-fx-open"]', (n) => n.map((x) => x.dataset.id)))[i];
    await page.click(`.fx-round [data-id="${id}"]`);
    await page.waitForSelector('[data-form="t-score"]');
    await page.fill('#sc-home', String(h)); await page.fill('#sc-away', String(a));
    await page.click('[data-form="t-score"] [type=submit]');
    await page.waitForTimeout(200);
  }
  ok((await page.$$('.fx-x.is-w')).length === 3 && (await page.$$('.fx-x.is-d')).length === 2, 'la tabla cruzada pinta ganados y empates');
  await page.screenshot({ path: path.join(OUT, '5-liga-escritorio.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById('app').scrollWidth <= innerWidth), 'en teléfono la página no se corre de costado');
  await page.screenshot({ path: path.join(OUT, '6-liga-telefono.png'), fullPage: true });
  await page.click('#tab-tabla');
  ok(/Posiciones/.test(await page.textContent('#tpanel')) && (await page.$$('.standings tbody tr')).length === 6, 'TABLA muestra las posiciones');

  ok(errores.length === 0, 'sin errores de consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
