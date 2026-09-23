import { defineConfig } from 'vitest/config';
import astroConfig from './astro.config.mjs';

// Los tests unitarios cubren TS puro (src/lib, src/data); no necesitan el pipeline de Astro.
// BASE_URL = base real del sitio (única fuente: astro.config.mjs).
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    env: { BASE_URL: `${astroConfig.base}/` },
  },
});
