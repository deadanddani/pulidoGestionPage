import { expect, test } from '@playwright/test';

// Tamaños de referencia del rediseño: móvil, tablet y escritorio.
const viewports = [
  { name: 'móvil', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'escritorio', width: 1440, height: 900 },
] as const;
const pages = ['', 'equipo/', 'multimedia/', 'contacto/', 'presupuesto/', 'privacidad/', 'cookies/'];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pg-cookie-consent', 'rejected'));
});

for (const vp of viewports) {
  test.describe(`${vp.name} ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const path of pages) {
      test(`/${path} sin scroll horizontal y con los elementos clave visibles`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);

        await expect(page.locator('.site-header__brand')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (vp.width < 960) await expect(page.locator('.site-nav__toggle')).toBeVisible();
        else await expect(page.locator('#site-nav')).toBeVisible();

        await page.locator('footer').scrollIntoViewIfNeeded();
        await expect(page.locator('footer .subsidy img')).toBeVisible();
      });
    }

    test('la home muestra hero, vídeo y los cuatro accesos', async ({ page }) => {
      await page.goto('./');
      const cta = page.locator('main').getByRole('link', { name: /solicitar presupuesto/i });
      await expect(cta).toBeInViewport();
      await expect(page.locator('main .video__play').first()).toBeVisible();
      await expect(page.locator('main .shortcuts a')).toHaveCount(4);
      for (const tile of await page.locator('main .shortcuts a').all()) {
        await tile.scrollIntoViewIfNeeded();
        await expect(tile).toBeVisible();
      }
    });

    test('botones y enlaces principales tienen zona táctil ≥ 44 px', async ({ page }) => {
      await page.goto('presupuesto/');
      const targets = page.locator('main .btn, .site-nav__toggle, .site-header__brand, footer .site-footer__social a');
      for (const el of await targets.all()) {
        if (!(await el.isVisible())) continue;
        const box = (await el.boundingBox())!;
        expect(box.height, await el.evaluate((n) => n.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44);
      }
    });
  });
}
