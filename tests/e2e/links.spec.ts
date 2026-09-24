import { expect, test } from '@playwright/test';

const pages = ['', 'equipo/', 'multimedia/', 'contacto/', 'presupuesto/', 'privacidad/', 'cookies/'];

test('all internal links and images resolve under the base path', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const targets = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const found = await page.evaluate(() => [
      ...[...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href),
      ...[...document.querySelectorAll('img[src]')].map((i) => (i as HTMLImageElement).src),
    ]);
    for (const u of found) {
      const parsed = new URL(u);
      if (parsed.origin === origin) targets.add(parsed.pathname);
    }
  }
  expect(targets.size).toBeGreaterThan(10);
  for (const pathname of targets) {
    expect(pathname.startsWith('/pulidoGestionPage/'), pathname).toBe(true);
    const res = await request.get(pathname);
    expect(res.status(), pathname).toBe(200);
  }
});
