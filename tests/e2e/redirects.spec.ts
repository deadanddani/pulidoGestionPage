import { expect, test } from '@playwright/test';

test('legacy index.html serves the home page', async ({ page }) => {
  await page.goto('index.html');
  await expect(page).toHaveTitle('Pulido Gestión. Administración de Fincas. Gestoría.');
});

const legacy: [string, string][] = [
  ['equipo.html', 'equipo/'],
  ['multimedia.html', 'multimedia/'],
  ['contacto.html', 'contacto/'],
  ['peticion_oferta.html', 'presupuesto/'],
  ['privacidad.html', 'privacidad/'],
  ['politica_cookies.html', 'cookies/'],
];

for (const [from, to] of legacy) {
  test(`legacy url ${from} redirects to /${to}`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`/pulidoGestionPage/${to.replace('/', '\\/')}$`));
  });
}

test('legacy privacy anchor is preserved', async ({ page }) => {
  await page.goto('privacidad.html#presup');
  await expect(page).toHaveURL(/\/privacidad\/#presup$/);
});
