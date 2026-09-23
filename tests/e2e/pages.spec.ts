import { expect, test } from '@playwright/test';

test('equipo shows the 5 members with photos', async ({ page }) => {
  await page.goto('equipo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nuestro Equipo');
  const cards = page.locator('.team-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText('María Dolores Rodrigo López');
  for (const img of await page.locator('.team-card img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await expect(page.locator('#site-nav a[aria-current="page"]')).toHaveText('Nuestro Equipo');
});

test('multimedia lists 8 videos and loads the iframe only on click', async ({ page }) => {
  await page.goto('multimedia/');
  await expect(page.locator('.video')).toHaveCount(8);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.locator('.video__play').first().click();
  const iframe = page.locator('.video iframe').first();
  await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/38ltWMv22JM/);
});

test('contacto shows address, email and map linked to Google Maps', async ({ page }) => {
  await page.goto('contacto/');
  await expect(page.locator('main')).toContainText('Linares 2');
  await expect(page.locator('main')).toContainText('fincas@pulidogestion.com');
  await expect(page.locator('main a:has(img[src$="mapa.png"])')).toHaveAttribute('href', /google\.com\/maps/);
});
