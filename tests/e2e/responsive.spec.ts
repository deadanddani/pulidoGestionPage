import { expect, test } from '@playwright/test';

const pages = ['', 'equipo/', 'multimedia/', 'contacto/', 'presupuesto/', 'privacidad/', 'cookies/'];
const widths = [320, 375, 768, 1440];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pg-cookie-consent', 'rejected'));
});

for (const path of pages) {
  for (const width of widths) {
    test(`no horizontal overflow on /${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test('grids go from 1 column on mobile to several on desktop', async ({ page }) => {
  await page.goto('equipo/');
  await page.setViewportSize({ width: 375, height: 900 });
  const cols = () => page.locator('.grid-cards').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(await cols()).toBe(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await cols()).toBeGreaterThanOrEqual(3);
});

test('screenshots for visual review', async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of pages) {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const name = (path.replace(/\/$/, '') || 'inicio');
      await page.screenshot({ path: `test-results/screens/${name}-${width}.png`, fullPage: true });
    }
  }
});
