import { defineConfig, devices } from '@playwright/test';

// Puerto propio para no chocar con un `astro preview`/`dev` abierto en el 4321.
const PORT = 4329;
const baseURL = `http://localhost:${PORT}/pulidoGestionPage/`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: { baseURL, actionTimeout: 10_000, navigationTimeout: 15_000 },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --ignore-lock`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
