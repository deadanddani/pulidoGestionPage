import { expect, test } from '@playwright/test';

test('privacy page renders legal text with presup anchor', async ({ page }) => {
  await page.goto('privacidad/#presup');
  await expect(page.locator('main h2').first()).toBeVisible();
  // Al entrar por un enlace con ancla (p. ej. privacidad.html#presup desde el formulario) el salto debe ser
  // inmediato: con scroll suave el navegador anima ~7000 px y el usuario ve la página deslizarse varios segundos.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#presup')).toBeInViewport({ timeout: 1_000 });
  await expect(page.locator('main')).toContainText('B82302365');
});

test('cookies page renders', async ({ page }) => {
  await page.goto('cookies/');
  await expect(page.locator('main')).toContainText('Política de Cookies');
});

test('rejecting cookies never loads analytics', async ({ page }) => {
  const gaRequests: string[] = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) gaRequests.push(r.url()); });
  await page.goto('./');
  const banner = page.locator('.cookie-banner');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Rechazar' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
  await page.waitForLoadState('networkidle');
  expect(gaRequests).toHaveLength(0);
});

test('accepting cookies loads analytics; footer button reopens the banner', async ({ page }) => {
  await page.route('**/googletagmanager.com/**', (route) => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto('./');
  const gaRequest = page.waitForRequest(/googletagmanager\.com\/gtag\/js\?id=G-VEZ300TBPB/);
  await page.locator('.cookie-banner').getByRole('button', { name: 'Aceptar' }).click();
  await gaRequest;
  await page.locator('[data-cookie-settings]').click();
  await expect(page.locator('.cookie-banner')).toBeVisible();
});

test('banner does not cause horizontal overflow on 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  await expect(page.locator('.cookie-banner')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
