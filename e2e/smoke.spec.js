const { test, expect } = require('@playwright/test');
test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Ultimate Clock/i);
});
