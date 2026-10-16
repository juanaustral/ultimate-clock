// Regenera las capturas del manual en los dos idiomas.
// Uso: npx playwright test e2e/manual-shots.spec.js --reporter=line
const { test } = require('@playwright/test');

const VW = 390, VH = 844;
const AT = 3000; // action timeout

async function tryClick(page, sel) {
  try {
    const el = page.locator(sel).first();
    if (await el.count() > 0 && await el.isVisible()) { await el.click({ timeout: AT }); return true; }
  } catch {}
  return false;
}
async function fillIfExists(page, sel, val) {
  try {
    const el = page.locator(sel).first();
    if (await el.count() > 0) { await el.fill(val, { timeout: AT }); return true; }
  } catch {}
  return false;
}
async function shot(page, path) {
  await page.waitForTimeout(150);
  await page.screenshot({ path, fullPage: false });
  console.log(`  ok ${path}`);
}

const STEPS = [
  ['01-bienvenida', async () => {}],
  ['02-equipos', async (p) => { await tryClick(p, 'dialog [data-action="choose-mode"][data-mode="match"]'); }],
  ['03-jugadores', async (p) => { await tryClick(p, 'dialog form[data-form="welcome-teams"] button[type="submit"]'); }],
  ['04-tiempos', async (p) => { await tryClick(p, 'dialog form[data-form="welcome-players"] button[type="submit"]'); }],
  ['05-tablero', async (p) => { await tryClick(p, 'dialog [data-action="use-profile"]'); await p.waitForTimeout(100); }],
  ['06-gol', async (p) => { await tryClick(p, '[data-action="goal"][data-team="0"]'); }],
  ['07-en-juego', async (p) => { await tryClick(p, 'dialog .modal-body [data-action="close-modal"]'); await tryClick(p, '.clock-actions [data-action="toggle-clock"]'); await p.waitForTimeout(100); }],
  ['08-llamado', async (p) => {
    const btns = p.locator('[data-action="toggle-timer"]');
    for (let i = 0; i < await btns.count(); i++) {
      const t = await btns.nth(i).textContent();
      if (/INICIAR|START/i.test(t)) { await btns.nth(i).click({ timeout: AT }); break; }
    }
  }],
  ['09-contadores', async (p) => { await tryClick(p, 'dialog .modal-body [data-action="close-modal"]'); await p.waitForTimeout(100); }],
  ['10-menu', async (p) => { await tryClick(p, '[data-action="toggle-menu"]'); }],
  ['11-planilla', async (p) => {
    await tryClick(p, '[data-action="toggle-menu"]');
    await p.evaluate(() => document.querySelector('.header-actions')?.classList.add('is-open'));
    await tryClick(p, '.header-actions [data-action="sheet"]'); await p.waitForTimeout(100);
  }],
  ['12-torneo-crear', async (p) => {
    await tryClick(p, '[data-action="back-dashboard"]'); await tryClick(p, '[data-action="toggle-menu"]');
    await p.evaluate(() => document.querySelector('.header-actions')?.classList.add('is-open'));
    await tryClick(p, '.header-actions [data-action="tournament"]'); await p.waitForTimeout(100);
  }],
  ['13-ficha-equipo', async (p) => {
    await fillIfExists(p, '#t-name', 'Copa Otoño');
    await tryClick(p, 'form[data-form="t-create"] button[type="submit"]'); await p.waitForTimeout(100);
  }],
  ['14-torneo', async (p) => {
    await fillIfExists(p, '#ts-team-name', 'CÓNDORES');
    await tryClick(p, 'form[data-form="t-team"] button[type="submit"]'); await p.waitForTimeout(100);
    await tryClick(p, '[data-action="t-new-team"]'); await p.waitForTimeout(100);
    await fillIfExists(p, '#ts-team-name', 'Águilas');
    const c = p.locator('.sheet-colors .color-preset');
    if (await c.count() > 1) await c.nth(1).click({ timeout: AT });
    await tryClick(p, 'form[data-form="t-team"] button[type="submit"]'); await p.waitForTimeout(100);
  }],
  ['15-archivo-torneo', async (p) => { await tryClick(p, '[data-action="t-export"]'); await p.waitForTimeout(100); }],
  ['16-partido-torneo', async (p) => {
    await tryClick(p, 'dialog .modal-body [data-action="close-modal"]');
    await tryClick(p, '[data-action="t-new-match"]'); await p.waitForTimeout(100);
  }],
  ['17-gol-torneo', async (p) => {
    await tryClick(p, 'form[data-form="t-match"] button[type="submit"]'); await p.waitForTimeout(100);
    await tryClick(p, '[data-action="goal"][data-team="0"]');
  }],
  ['18-posiciones', async (p) => {
    await tryClick(p, 'dialog .modal-body [data-action="close-modal"]'); await tryClick(p, '[data-action="t-back"]');
    await tryClick(p, '[data-action="toggle-menu"]');
    await p.evaluate(() => document.querySelector('.header-actions')?.classList.add('is-open'));
    await tryClick(p, '.header-actions [data-action="sheet"]'); await p.waitForTimeout(100);
    await p.evaluate(() => document.querySelector('.header-actions')?.classList.add('is-open'));
    await tryClick(p, '.header-actions [data-action="save"]'); await tryClick(p, 'dialog [data-action="confirm-save"]');
    await p.waitForTimeout(100); await tryClick(p, '[data-action="back-dashboard"]');
    await tryClick(p, '[data-action="toggle-menu"]');
    await p.evaluate(() => document.querySelector('.header-actions')?.classList.add('is-open'));
    await tryClick(p, '.header-actions [data-action="tournament"]'); await p.waitForTimeout(100);
  }],
];

async function runShots(page, lang) {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(100);
  if (lang === 'en') { await tryClick(page, 'dialog [data-action="set-lang"][data-lang="en"]'); }
  for (const [name, fn] of STEPS) {
    try { await fn(page); await shot(page, `manual/img/${lang}-${name}.webp`); }
    catch (err) { console.log(`  err ${lang}-${name}: ${err.message.slice(0, 60)}`); }
  }
}

test('regenerar capturas del manual (es)', async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: VW, height: VH });
  await runShots(page, 'es');
});
test('regenerar capturas del manual (en)', async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: VW, height: VH });
  await runShots(page, 'en');
});
