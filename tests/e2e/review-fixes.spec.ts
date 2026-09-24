import { expect, test } from '@playwright/test';

test.describe('quote form without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('cannot be submitted, so personal data never ends up in the URL', async ({ page }) => {
    await page.goto('presupuesto/');
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    await expect(page.getByText('es necesario activar JavaScript')).toBeVisible();
  });
});

test('withdrawing consent disables analytics and removes GA cookies', async ({ page, context }) => {
  await page.route('**/googletagmanager.com/**', (route) => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto('./');
  await page.locator('.cookie-banner').getByRole('button', { name: 'Aceptar' }).click();
  await expect(page.locator('#ga-script')).toHaveCount(1);
  const { hostname } = new URL(page.url());
  await context.addCookies([{ name: '_ga', value: 'GA1.1.1', domain: hostname, path: '/' }]);
  await page.locator('[data-cookie-settings]').click();
  await Promise.all([page.waitForEvent('load'), page.locator('.cookie-banner').getByRole('button', { name: 'Rechazar' }).click()]);
  await expect(page.locator('#ga-script')).toHaveCount(0);
  expect((await context.cookies()).filter((c) => c.name.startsWith('_ga'))).toHaveLength(0);
});

test('proof-of-concept pages are not indexable by search engines', async ({ page }) => {
  for (const path of ['', 'equipo/', 'presupuesto/', 'privacidad/']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  }
});

test('keyboard focus ring uses the brand blue (≥3:1 contrast)', async ({ page }) => {
  await page.goto('./');
  await page.addStyleTag({ content: '*{transition:none!important}' });
  await page.keyboard.press('Tab');
  const color = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineColor);
  expect(color).toBe('rgb(0, 85, 255)');
});
