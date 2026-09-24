import { expect, test } from '@playwright/test';

test('desktop shows full navigation and footer data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const nav = page.locator('#site-nav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(page.locator('.site-nav__toggle')).toBeHidden();
  const footer = page.locator('footer');
  await expect(footer).toContainText('B82302365');
  await expect(footer).toContainText('fincas@pulidogestion.com');
  await expect(footer.locator('.subsidy img')).toBeVisible();
  await expect(footer).toContainText('09-GCE1-02365.0/2024');
});

test('mobile menu opens, closes with Escape and is keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  const toggle = page.locator('.site-nav__toggle');
  const nav = page.locator('#site-nav');
  await expect(toggle).toBeVisible();
  await expect(nav).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  const box = await toggle.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('logo links to home', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: /Pulido Gestión de Fincas/ }).first()).toHaveAttribute('href', '/pulidoGestionPage/');
});

test('header wordmark "Pulido Gestión de Fincas" is legible on mobile and desktop', async ({ page }) => {
  for (const [width, minHeight] of [[375, 18], [1440, 24]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const text = page.locator('.site-header__brand img[src$="logo-text.png"]');
    await expect(text).toBeVisible();
    expect((await text.boundingBox())!.height).toBeGreaterThanOrEqual(minHeight);
  }
});
