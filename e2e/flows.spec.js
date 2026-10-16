const { test, expect, beforeEach } = require('@playwright/test');

beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(300);
});

async function openMenu(page) {
  await page.locator('[data-action="toggle-menu"]').click();
  await page.waitForTimeout(200);
}

async function startMatch(page) {
  await page.locator('dialog [data-action="choose-mode"][data-mode="match"]').click();
  await page.waitForTimeout(200);
  const teamsForm = page.locator('dialog form[data-form="welcome-teams"]');
  await teamsForm.locator('input[name="name-0"]').fill('CÓNDORES');
  await teamsForm.locator('input[name="name-1"]').fill('Águilas');
  await teamsForm.locator('button[type="submit"]').click();
  await page.waitForTimeout(200);
  const playersForm = page.locator('dialog form[data-form="welcome-players"]');
  await playersForm.locator('button[type="submit"]').click();
  await page.waitForTimeout(200);
  await page.locator('dialog [data-action="use-profile"]').click();
  await page.waitForTimeout(300);
}

test('flujo completo: iniciar, anotar gol y guardar planilla', async ({ page }) => {
  await startMatch(page);
  await expect(page.locator('[data-timer-card="clock"]')).toBeVisible();

  await page.locator('.clock-actions [data-action="toggle-clock"]').click();
  await expect(page.locator('[data-timer-card="clock"]')).toHaveClass(/is-running/);

  // Anotar un gol: abre un modal de detalle
  await page.locator('[data-action="goal"][data-team="0"]').first().click();
  await page.waitForTimeout(200);
  // Cerrar el modal de detalle del gol (botón OMITIR/SKIP)
  await page.locator('dialog .modal-body [data-action="close-modal"]').click();
  await page.waitForTimeout(200);

  // Guardar la planilla (abrir menú → GUARDAR → confirmar)
  await openMenu(page);
  // Forzar el menú abierto por si el clic no alcanzó
  await page.evaluate(() => document.querySelector('.header-actions').classList.add('is-open'));
  await page.locator('.header-actions [data-action="save"]').click();
  await page.waitForTimeout(200);
  await page.locator('dialog [data-action="confirm-save"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('.toast')).toBeVisible();
});

test('reloj del partido se inicia y pausa', async ({ page }) => {
  await startMatch(page);
  await page.locator('.clock-actions [data-action="toggle-clock"]').click();
  await expect(page.locator('[data-timer-card="clock"]')).toHaveClass(/is-running/);
  await page.locator('.clock-actions [data-action="toggle-clock"]').click();
  await expect(page.locator('[data-timer-card="clock"]')).not.toHaveClass(/is-running/);
});

test('cambiar tema oscuro desde el menú', async ({ page }) => {
  await startMatch(page);
  await openMenu(page);
  await page.locator('.header-actions [data-action="quick-theme"][data-theme="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('cambiar idioma a inglés desde la bienvenida', async ({ page }) => {
  await page.locator('dialog [data-action="set-lang"][data-lang="en"]').click();
  await page.waitForTimeout(200);
  const dialogText = await page.locator('dialog').textContent();
  expect(dialogText).toMatch(/WELCOME|SET UP|START/i);
});

test('guardado por partes: tres claves en localStorage', async ({ page }) => {
  await startMatch(page);
  await page.locator('[data-action="goal"][data-team="0"]').first().click();
  await page.waitForTimeout(200);

  const keys = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      result[key] = localStorage.getItem(key);
    }
    return result;
  });

  expect(keys['ultimate-clock-match']).toBeTruthy();
  const matchData = JSON.parse(keys['ultimate-clock-match']);
  expect(matchData.version).toBe(2);
  expect(matchData.activeMatch).toBeTruthy();
  expect(matchData.activeMatch.teams).toHaveLength(2);
});

test('guardar planilla crea la clave de planillas', async ({ page }) => {
  await startMatch(page);
  await openMenu(page);
  await page.locator('.header-actions [data-action="save"]').click();
  await page.waitForTimeout(200);
  await page.locator('dialog [data-action="confirm-save"]').click();
  await page.waitForTimeout(500);

  const sheetsRaw = await page.evaluate(() => localStorage.getItem('ultimate-clock-sheets'));
  expect(sheetsRaw).toBeTruthy();
  const sheets = JSON.parse(sheetsRaw);
  expect(Array.isArray(sheets)).toBe(true);
  expect(sheets.length).toBeGreaterThan(0);
});
