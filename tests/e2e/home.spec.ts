import { expect, test } from '@playwright/test';

test('home keeps all original entry points', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Pulido Gestión. Administración de Fincas. Gestoría.');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const portal = page.getByRole('link', { name: /gestiones en su comunidad/i });
  await expect(portal).toHaveAttribute('href', 'https://portalpropietarios.es/');
  await expect(portal).toHaveAttribute('target', '_blank');
  await expect(page.locator('main').getByRole('link', { name: /solicitar presupuesto/i })).toHaveAttribute('href', '/pulidoGestionPage/presupuesto/');
  await expect(page.locator('main .video__play[data-video-id="Yzf-VKOsBLM"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: /por qué trabajar con nosotros/i })).toBeVisible();
  for (const href of ['equipo/', 'multimedia/', 'contacto/', 'presupuesto/']) {
    await expect(page.locator(`main .shortcuts a[href="/pulidoGestionPage/${href}"]`)).toHaveCount(1);
  }
  await expect(page.locator('main a[href*="linkedin.com"]')).toHaveCount(1);
  await expect(page.locator('main a[href*="youtube.com/channel"]')).toHaveCount(1);
});
