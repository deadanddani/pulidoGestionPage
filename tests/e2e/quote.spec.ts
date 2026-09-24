import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('presupuesto/'); });

test('shows errors for empty required fields and does not navigate', async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page).toHaveURL(/\/presupuesto\/$/);
  for (const field of ['nombre', 'direccion', 'codigoPostal', 'telefono', 'email', 'privacidad']) {
    await expect(page.locator(`#${field}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(`#${field}-error`)).not.toBeEmpty();
  }
  await expect(page.locator('#nombre')).toBeFocused();
});

test('valid submission shows demo notice without sending data', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') requests.push(r.url()); });
  await page.fill('#nombre', 'Ana López');
  await page.fill('#direccion', 'C/ Mayor 1');
  await page.fill('#codigoPostal', '02001');
  await page.fill('#telefono', '+34 600 123 456');
  await page.fill('#email', 'ana@example.com');
  await page.fill('#viviendas', '12');
  await page.check('#privacidad');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('.form-status')).toContainText('Formulario de demostración');
  expect(requests).toHaveLength(0);
});

test('rejects negative counts and reset clears errors', async ({ page }) => {
  await page.fill('#locales', '-1');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('#locales')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Borrar formulario' }).click();
  await expect(page.locator('#locales')).toHaveValue('');
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(page.locator('.form-status')).toBeEmpty();
});

test('privacy link points to the quote section of the privacy policy', async ({ page }) => {
  await expect(page.locator('form a[href$="privacidad/#presup"]')).toHaveCount(1);
});

test('two-column layout on tablet, single column on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const a = await page.locator('#nombre').boundingBox();
  const b = await page.locator('#direccion').boundingBox();
  expect(b!.y).toBeGreaterThan(a!.y);
  await page.setViewportSize({ width: 768, height: 900 });
  const c = await page.locator('#codigoPostal').boundingBox();
  const d = await page.locator('#telefono').boundingBox();
  expect(Math.abs(c!.y - d!.y)).toBeLessThan(2);
  expect((await page.locator('#nombre').boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
