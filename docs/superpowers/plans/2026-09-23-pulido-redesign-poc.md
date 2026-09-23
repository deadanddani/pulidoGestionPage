# Pulido Gestión Redesign PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una réplica renovada, estática y responsive de pulidogestion.com con Astro, desplegable en GitHub Pages.

**Architecture:** Astro genera HTML estático. El contenido de negocio vive en `src/data/*.ts` (tipado) y los textos legales en `src/content/legal/*.html` (importados desde la web actual con un script). Las páginas componen componentes pequeños (`Header`, `Footer`, `VideoEmbed`, `TeamCard`, `QuoteForm`, `CookieBanner`, `SubsidyNotice`). La lógica pura (URLs con `base`, validación del formulario, transformación de HTML legal) está en `src/lib/` y se prueba con Vitest; el comportamiento en navegador (responsive, menú, formulario, redirecciones, cookies) se prueba con Playwright contra `astro preview`.

**Tech Stack:** Node 26, Astro 7.x, TypeScript (strict), Vitest, Playwright 1.63, sharp (recorte de imágenes), node-html-parser (importar textos legales), @fontsource-variable (fuentes autoalojadas), GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-23-pulido-redesign-poc-design.md`

## Global Constraints

- Todo el trabajo en la rama `feature/redesign-poc`. Commits terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Salida 100 % estática (`output: 'static'`). Sin backend.
- No inventar contenido: textos, nombres, vídeos e imágenes solo de la web actual (inventario en spec §2). Copy nuevo solo como propuesta en `docs/pendientes.md`.
- Idioma del sitio: español (`<html lang="es">`).
- Color primario de marca: `#0055FF`.
- Responsive mobile-first; breakpoints `min-width` 640px, 960px, 1200px; sin scroll horizontal en ningún ancho ≥ 320px; objetivos táctiles ≥ 44px; verificación visual en 375px, 768px y 1440px.
- El formulario NO envía datos: validación en cliente y aviso "Formulario de demostración: aún no se envían datos".
- Google Analytics `G-VEZ300TBPB` solo se carga tras aceptar cookies. Vídeos de YouTube vía `youtube-nocookie.com` y solo al pulsar.
- Despliegue en subpath: `site: 'https://deadanddani.github.io'`, `base: '/pulidoGestionPage'`. Todo enlace interno pasa por `url()` de `src/lib/url.ts`.
- Datos de empresa: Pulido Gestión de Fincas S.L. · CIF B82302365 · Linares 2, Local 10 A, 28804 Alcalá de Henares (Madrid) · fincas@pulidogestion.com.

**Desviaciones de la spec (justificadas, reflejadas en la spec en la Task 1):**
- Redirecciones de URLs antiguas: ficheros estáticos en `public/*.html` con meta-refresh relativo (en lugar de `redirects` de Astro, que con claves `.html` genera carpetas y no es fiable en GitHub Pages).
- Fuentes autoalojadas con `@fontsource-variable` en lugar de Google Fonts (evita enviar IPs a Google, RGPD).

## Review Focus

- **Pantallas muy estrechas (320px) y palabras largas** (URLs, emails en textos legales): no debe haber scroll horizontal → test `no horizontal overflow` en Task 9 a 320px con `overflow-wrap: anywhere` en `global.css` (Task 2).
- **Subpath `/pulidoGestionPage/`**: todo enlace interno, imagen y asset debe resolver bajo la base → test `all internal links resolve` en Task 9 que rastrea cada `<a>`/`<img>` del build.
- **Enlaces antiguos** (`peticion_oferta.html`, `politica_cookies.html`, `privacidad.html#presup`…) guardados por clientes o indexados → test `legacy urls redirect` en Task 9.
- **Datos reales de formulario**: teléfono con espacios o `+34`, CP con cero inicial (`02001`), números negativos o decimales en viviendas → tests en Task 4 (`validateQuote`) y Task 7 (e2e).
- **Rechazo de cookies**: si el usuario rechaza, GA nunca se carga y no aparece ninguna petición a `googletagmanager.com` → test e2e en Task 8.

---

## File Structure

```
astro.config.mjs              # site, base, output static
package.json / tsconfig.json
vitest.config.ts
playwright.config.ts
scripts/
  crop-brand.mjs              # recorta logo, sello y cartel de subvención de las cabeceras originales
  import-legal.mjs            # descarga privacidad/cookies y genera HTML limpio
public/
  favicon.ico
  img/ (logo.png, sello-colegiado.png, subvencion-fse.png, mapa.png, equipo/*.jpg, social/*)
  equipo.html multimedia.html contacto.html peticion_oferta.html privacidad.html politica_cookies.html  # redirecciones
  robots.txt
src/
  lib/url.ts                  # url(path) con base
  lib/quote-form.ts           # tipos + validateQuote()
  lib/legal-transform.ts      # transformLegalHtml()
  data/site.ts nav.ts team.ts videos.ts subsidy.ts
  content/legal/privacidad.html cookies.html
  styles/tokens.css global.css
  layouts/BaseLayout.astro
  components/Header.astro Footer.astro SubsidyNotice.astro VideoEmbed.astro TeamCard.astro QuoteForm.astro CookieBanner.astro
  pages/index.astro equipo.astro multimedia.astro contacto.astro presupuesto.astro privacidad.astro cookies.astro
tests/unit/*.test.ts
tests/e2e/*.spec.ts
docs/arquitectura.md contenido.md despliegue.md pendientes.md
.github/workflows/ci.yml deploy.yml
```

---

### Task 1: Scaffold Astro + herramientas de test + helper de URLs

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.nvmrc`, `src/lib/url.ts`, `src/pages/index.astro` (temporal), `tests/unit/url.test.ts`
- Modify: `docs/superpowers/specs/2026-09-23-pulido-redesign-poc-design.md` (desviaciones)

**Interfaces:**
- Produces: `url(path: string): string` — devuelve `import.meta.env.BASE_URL` + path sin barras duplicadas; path vacío o `/` → base con barra final (`/pulidoGestionPage/`). Rutas de página terminan en `/` (`url('equipo/')`). Anclas se conservan (`url('privacidad/#presup')`).
- Produces: scripts npm `dev`, `build`, `preview`, `check`, `test`, `test:e2e`.

- [ ] **Step 1: Crear package.json e instalar dependencias**

```bash
npm init -y >/dev/null
npm pkg set name=pulido-gestion-web private=true type=module
npm pkg set scripts.dev="astro dev" scripts.build="astro build" scripts.preview="astro preview" \
  scripts.check="astro check" scripts.test="vitest run" scripts.test:e2e="playwright test" \
  scripts.brand="node scripts/crop-brand.mjs" scripts.legal="node scripts/import-legal.mjs"
npm pkg delete main scripts.test:watch 2>/dev/null; npm pkg delete keywords author license description 2>/dev/null
npm install astro@^7 @fontsource-variable/source-serif-4 @fontsource-variable/source-sans-3
npm install -D typescript @astrojs/check vitest @playwright/test sharp node-html-parser
npx playwright install chromium
echo "26" > .nvmrc
```

`.gitignore`:
```
node_modules/
dist/
.astro/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 2: Configuración**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://deadanddani.github.io',
  base: '/pulidoGestionPage',
  output: 'static',
  trailingSlash: 'always',
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321/pulidoGestionPage/' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/pulidoGestionPage/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 3: Test que falla para `url()`**

`tests/unit/url.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { url } from '../../src/lib/url';

describe('url', () => {
  it('returns base with trailing slash for root', () => {
    expect(url('')).toBe('/pulidoGestionPage/');
    expect(url('/')).toBe('/pulidoGestionPage/');
  });
  it('joins page paths without double slashes', () => {
    expect(url('equipo/')).toBe('/pulidoGestionPage/equipo/');
    expect(url('/equipo/')).toBe('/pulidoGestionPage/equipo/');
  });
  it('keeps anchors and file paths', () => {
    expect(url('privacidad/#presup')).toBe('/pulidoGestionPage/privacidad/#presup');
    expect(url('img/logo.png')).toBe('/pulidoGestionPage/img/logo.png');
  });
});
```

Run: `npm test` → Expected: FAIL (`Cannot find module '../../src/lib/url'`).

- [ ] **Step 4: Implementar**

`src/lib/url.ts`:
```ts
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Construye una URL interna respetando `base` (despliegue en subpath). */
export function url(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return `${base}/${clean}`;
}
```

`src/pages/index.astro` (temporal, se sustituye en Task 6):
```astro
---
---
<html lang="es"><head><meta charset="utf-8" /><title>Pulido Gestión</title></head><body><h1>Pulido Gestión</h1></body></html>
```

- [ ] **Step 5: Verificar**

Run: `npm test && npm run check && npm run build`
Expected: 3 tests PASS, `astro check` 0 errors, build genera `dist/index.html`.

- [ ] **Step 6: Actualizar spec con las desviaciones**

En la spec, §4 "Principios", sustituir "vía `redirects` de Astro" por "vía ficheros estáticos en `public/` con meta-refresh relativo". En §6 sustituir "(Google Fonts, `font-display: swap`, con fallbacks del sistema)" por "(autoalojadas con @fontsource-variable: Source Serif 4 y Source Sans 3, con fallbacks del sistema)".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with Vitest, Playwright and url helper"
```

---

### Task 2: Assets de marca, tokens de diseño y datos del sitio

**Files:**
- Create: `scripts/crop-brand.mjs`, `public/img/**`, `public/favicon.ico`, `public/robots.txt`, `src/styles/tokens.css`, `src/styles/global.css`, `src/data/site.ts`, `src/data/nav.ts`, `src/data/team.ts`, `src/data/videos.ts`, `src/data/subsidy.ts`, `tests/unit/data.test.ts`

**Interfaces:**
- Produces imágenes: `img/logo.png`, `img/sello-colegiado.png`, `img/subvencion-fse.png`, `img/mapa.png`, `img/equipo/{dolores,prado,margarita,jaime,pablo}.jpg`.
- Produces `site` (`src/data/site.ts`):
  ```ts
  export const site: {
    name: string; legalName: string; cif: string; tagline: string; description: string;
    address: { street: string; postalCode: string; city: string; region: string };
    email: string; mapsUrl: string; portalUrl: string; analyticsId: string;
    social: { linkedin: string; youtube: string };
  }
  ```
- Produces `nav: NavItem[]` con `interface NavItem { label: string; href: string }` (href relativo para `url()`).
- Produces `team: TeamMember[]` con `interface TeamMember { name: string; photo: string }` (photo relativo para `url()`).
- Produces `featuredVideo: Video` y `videos: Video[]` con `interface Video { id: string; title: string; year: number }`.
- Produces `subsidy: { image: string; alt: string; lines: string[] }`.
- Produces CSS custom properties (tokens.css): `--color-primary`, `--color-primary-strong`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--font-serif`, `--font-sans`, `--space-1..8`, `--radius`, `--shadow`, `--container`; y utilidades en global.css: `.container`, `.btn`, `.btn--primary`, `.btn--ghost`, `.section`, `.section__title`, `.grid-cards`, `.visually-hidden`.

- [ ] **Step 1: Descargar imágenes originales**

```bash
mkdir -p public/img/equipo public/img/social scripts/.cache
B=https://pulidogestion.com
curl -sfL -o scripts/.cache/cabecera.png $B/img/cabecera_pulido_1280.png
curl -sfL -o scripts/.cache/cabecera_comunidad.png $B/img/cabecera_pulido_1280_comunidad.png
curl -sfL -o public/img/mapa.png $B/img/mapa.png
for p in dolores prado margarita jaime pablo; do curl -sfL -o public/img/equipo/$p.jpg $B/img/$p.jpg; done
curl -sfL -o public/favicon.ico $B/favicon.ico
echo "scripts/.cache/" >> .gitignore
```

- [ ] **Step 2: Script de recorte de marca**

`scripts/crop-brand.mjs`:
```js
// Recorta logo, sello colegiado y cartel de subvención de las cabeceras originales.
import sharp from 'sharp';

const cache = 'scripts/.cache';
const out = 'public/img';

const crops = [
  // cabecera.png: 1240x250. Logo "P" + "Pulido Gestión de Fincas" a la izquierda.
  { src: 'cabecera.png', dest: 'logo.png', region: { left: 0, top: 0, width: 300, height: 250 } },
  // Sello "Administrador Fincas Colegiado" a la derecha.
  { src: 'cabecera.png', dest: 'sello-colegiado.png', region: { left: 880, top: 80, width: 230, height: 90 } },
  // cabecera_comunidad.png: 1240x310. Bloque de subvención FSE+ (texto, logos y recuadro rojo).
  { src: 'cabecera_comunidad.png', dest: 'subvencion-fse.png', region: { left: 740, top: 0, width: 500, height: 310 } },
];

for (const { src, dest, region } of crops) {
  const info = await sharp(`${cache}/${src}`).extract(region).trim({ threshold: 10 }).png().toFile(`${out}/${dest}`);
  console.log(`${dest}: ${info.width}x${info.height}`);
}
```

Run: `npm run brand`
Expected: tres líneas con dimensiones. **Abrir las tres imágenes (herramienta Read) y comprobar visualmente**: `logo.png` contiene la "P" completa y el texto "Pulido Gestión de Fincas" sin cortar; `sello-colegiado.png` contiene el icono de puntos y las tres líneas de texto; `subvencion-fse.png` contiene el texto superior, los logos Comunidad de Madrid / UE / Fondos Europeos y el recuadro rojo completos. Si algo queda cortado, ajustar `region` y repetir.

- [ ] **Step 3: Iconos sociales**

Crear `public/img/social/linkedin.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
```
Crear `public/img/social/youtube.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /
```

- [ ] **Step 4: Test de datos que falla**

`tests/unit/data.test.ts`:
```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { site } from '../../src/data/site';
import { nav } from '../../src/data/nav';
import { team } from '../../src/data/team';
import { featuredVideo, videos } from '../../src/data/videos';
import { subsidy } from '../../src/data/subsidy';

describe('site data', () => {
  it('keeps the real company data', () => {
    expect(site.cif).toBe('B82302365');
    expect(site.email).toBe('fincas@pulidogestion.com');
    expect(site.address.postalCode).toBe('28804');
    expect(site.portalUrl).toBe('https://portalpropietarios.es/');
    expect(site.analyticsId).toBe('G-VEZ300TBPB');
  });
  it('has the 4 main sections in nav', () => {
    expect(nav.map((n) => n.href)).toEqual(['equipo/', 'multimedia/', 'contacto/', 'presupuesto/']);
  });
  it('has the 5 team members with existing photos', () => {
    expect(team).toHaveLength(5);
    for (const m of team) expect(existsSync(`public/${m.photo}`), m.photo).toBe(true);
  });
  it('has 8 unique videos sorted newest first, plus the featured one', () => {
    expect(videos).toHaveLength(8);
    expect(new Set(videos.map((v) => v.id)).size).toBe(8);
    const years = videos.map((v) => v.year);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
    expect(featuredVideo.id).toBe('Yzf-VKOsBLM');
  });
  it('keeps the subsidy expedient data and image', () => {
    expect(subsidy.lines.join(' ')).toContain('09-GCE1-02365.0/2024');
    expect(existsSync(`public/${subsidy.image}`)).toBe(true);
  });
});
```

Run: `npm test` → Expected: FAIL (módulos de datos no existen).

- [ ] **Step 5: Ficheros de datos**

`src/data/site.ts`:
```ts
export const site = {
  name: 'Pulido Gestión',
  legalName: 'Pulido Gestión de Fincas S.L.',
  cif: 'B82302365',
  tagline: 'Administración de Fincas. Gestoría.',
  description:
    'Gestionamos y administramos Comunidades de Propietarios, residenciales o industriales.',
  address: {
    street: 'C/ Linares 2, Local 10 A',
    postalCode: '28804',
    city: 'Alcalá de Henares',
    region: 'Madrid',
  },
  email: 'fincas@pulidogestion.com',
  mapsUrl:
    'https://www.google.com/maps/place/Calle+Linares,+2,+28804+Alcal%C3%A1+de+Henares,+Madrid/@40.4876032,-3.3471094,18z',
  portalUrl: 'https://portalpropietarios.es/',
  analyticsId: 'G-VEZ300TBPB',
  social: {
    linkedin: 'https://www.linkedin.com/in/ricardopulidosimon/detail/recent-activity/',
    youtube: 'https://www.youtube.com/channel/UCqdHdQcbg-mp7n_whZ2N9GA',
  },
} as const;
```

`src/data/nav.ts`:
```ts
export interface NavItem {
  label: string;
  href: string;
}

export const nav: NavItem[] = [
  { label: 'Nuestro Equipo', href: 'equipo/' },
  { label: 'Área Multimedia', href: 'multimedia/' },
  { label: 'Dónde Estamos', href: 'contacto/' },
  { label: 'Solicitud de Presupuesto', href: 'presupuesto/' },
];
```

`src/data/team.ts`:
```ts
export interface TeamMember {
  name: string;
  photo: string;
}

export const team: TeamMember[] = [
  { name: 'María Dolores Rodrigo López', photo: 'img/equipo/dolores.jpg' },
  { name: 'María Prado Poves Martínez', photo: 'img/equipo/prado.jpg' },
  { name: 'Margarita de Gorostiza Castro', photo: 'img/equipo/margarita.jpg' },
  { name: 'Jaime Bandrés Lopera', photo: 'img/equipo/jaime.jpg' },
  { name: 'Pablo Sheikha García', photo: 'img/equipo/pablo.jpg' },
];
```

`src/data/videos.ts`:
```ts
export interface Video {
  id: string;
  title: string;
  year: number;
}

export const featuredVideo: Video = {
  id: 'Yzf-VKOsBLM',
  title: 'Por qué trabajar con nosotros',
  year: 2020,
};

export const videos: Video[] = [
  { id: '38ltWMv22JM', title: 'Propuestas en GBC España 2019', year: 2019 },
  { id: 'E5WCDOEskkM', title: 'Propuestas Elecciones CAFMadrid 2018', year: 2018 },
  { id: '7lGp3FzKPdk', title: 'Entrevista a Ricardo Pulido en EOI 2016', year: 2016 },
  { id: 'iXlKA-J_GPk', title: 'Propuestas Elecciones CAFMadrid 2015', year: 2015 },
  { id: 'I2yr_nexLf0', title: 'Jornada Repartidores de Costes 2015', year: 2015 },
  { id: 'NAcYbmBpC9Y', title: 'IFEMA 2014. Los AAFF ante la Rehabilitación Energética', year: 2014 },
  { id: 'AyXIVbL64uA', title: 'RIEd 2013. Transformación Caldera Gasóleo a Biomasa', year: 2013 },
  { id: 'Hfj6oztq0Ts', title: 'Propuesta Financiación para Comunidades 2013', year: 2013 },
];
```

`src/data/subsidy.ts`:
```ts
const lines = [
  'Programa para el fomento de la contratación en el ámbito de la Comunidad de Madrid. Programa FSE+. Estímulo a la contratación de jóvenes.',
  'Pulido Gestión de Fincas S.L. ha sido subvencionado por la contratación de empleo joven estable – septiembre 2024.',
  'Línea 2: Contratación estable de personas jóvenes. Convocatoria 2024. Importe concedido: 5.500,00 €.',
  'Nº de expediente: 09-GCE1-02365.0/2024. Ayuda del FSE+: 40 %.',
];

export const subsidy = {
  image: 'img/subvencion-fse.png',
  alt: `Comunidad de Madrid (Consejería de Economía, Empleo y Competitividad), Cofinanciado por la Unión Europea, Fondos Europeos. ${lines.join(' ')}`,
  lines,
};
```

Run: `npm test` → Expected: PASS.

- [ ] **Step 6: Tokens y estilos globales**

`src/styles/tokens.css`:
```css
:root {
  --color-primary: #0055ff;
  --color-primary-strong: #0040c2;
  --color-accent: #2ea3f2;
  --color-bg: #faf8f4;
  --color-surface: #ffffff;
  --color-surface-alt: #eef3fd;
  --color-text: #1c2433;
  --color-muted: #566074;
  --color-border: #e4dfd5;
  --color-danger: #b42318;
  --color-success: #127a4a;

  --font-serif: 'Source Serif 4 Variable', Georgia, 'Times New Roman', serif;
  --font-sans: 'Source Sans 3 Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --text-sm: 0.9375rem;
  --text-base: 1.0625rem;
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.3125rem);
  --text-xl: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  --text-2xl: clamp(2rem, 1.4rem + 2.6vw, 3.25rem);

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: clamp(3rem, 2rem + 4vw, 5.5rem);

  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 1px 2px rgb(28 36 51 / 6%), 0 8px 24px rgb(28 36 51 / 8%);
  --container: 1200px;
  --gutter: clamp(1rem, 0.5rem + 2.5vw, 2rem);
}
```

`src/styles/global.css`:
```css
@import '@fontsource-variable/source-serif-4';
@import '@fontsource-variable/source-sans-3';
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  overflow-wrap: anywhere;
}
img, svg, video, iframe { max-width: 100%; display: block; }
img { height: auto; }
h1, h2, h3 { font-family: var(--font-serif); line-height: 1.15; margin: 0 0 var(--space-4); font-weight: 600; }
h1 { font-size: var(--text-2xl); letter-spacing: -0.01em; }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }
p { margin: 0 0 var(--space-4); }
a { color: var(--color-primary); text-underline-offset: 3px; }
a:hover { color: var(--color-primary-strong); }
:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; border-radius: 4px; }

.container { width: 100%; max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
.section { padding-block: var(--space-8); }
.section--alt { background: var(--color-surface); }
.section__title { text-align: center; margin-bottom: var(--space-6); }
.section__lead { text-align: center; color: var(--color-muted); max-width: 60ch; margin: calc(-1 * var(--space-4)) auto var(--space-6); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 44px; padding: var(--space-3) var(--space-5);
  border-radius: 999px; border: 2px solid transparent;
  font: 600 var(--text-base)/1.2 var(--font-sans); text-decoration: none; cursor: pointer;
  transition: background-color .2s, color .2s, border-color .2s;
}
.btn--primary { background: var(--color-primary); color: #fff; }
.btn--primary:hover { background: var(--color-primary-strong); color: #fff; }
.btn--ghost { background: transparent; color: var(--color-primary); border-color: var(--color-primary); }
.btn--ghost:hover { background: var(--color-surface-alt); }

.grid-cards { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }

.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 7: Verificar y commit**

Run: `npm test && npm run check` → Expected: PASS, 0 errors.

```bash
git add -A
git commit -m "feat: add brand assets, design tokens and typed site data"
```

---

### Task 3: Layout base, Header responsive, Footer y SubsidyNotice

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/SubsidyNotice.astro`, `tests/e2e/layout.spec.ts`
- Modify: `src/pages/index.astro` (usar layout, contenido mínimo)

**Interfaces:**
- Consumes: `url()`, `site`, `nav`, `subsidy`, clases de `global.css`.
- Produces: `BaseLayout` props `{ title: string; description?: string; current?: string }` — `title` se renderiza como `"{title} · Pulido Gestión"` salvo en la home (`title` = título completo); `current` es el `href` de nav activo (p. ej. `'equipo/'`) y marca `aria-current="page"`. Slot por defecto dentro de `<main id="main">`.
- Produces: DOM `header .site-nav__toggle[aria-expanded][aria-controls="site-nav"]`, `nav#site-nav`, `footer .site-footer`, `.subsidy`.

- [ ] **Step 1: Test e2e que falla**

`tests/e2e/layout.spec.ts`:
```ts
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
```

Run: `npm run test:e2e -- layout` → Expected: FAIL.

- [ ] **Step 2: SubsidyNotice**

`src/components/SubsidyNotice.astro`:
```astro
---
import { subsidy } from '../data/subsidy';
import { url } from '../lib/url';
---
<section class="subsidy" aria-label="Financiación pública">
  <img src={url(subsidy.image)} alt={subsidy.alt} width="500" height="310" loading="lazy" />
  <div class="subsidy__text">
    {subsidy.lines.map((line) => <p>{line}</p>)}
  </div>
</section>

<style>
  .subsidy {
    display: grid; gap: var(--space-4); align-items: center;
    padding: var(--space-5); background: #fff; color: var(--color-text);
    border-radius: var(--radius); border: 1px solid var(--color-border);
  }
  .subsidy img { width: 100%; max-width: 420px; margin-inline: auto; }
  .subsidy__text p { margin: 0 0 var(--space-2); font-size: var(--text-sm); color: var(--color-muted); }
  @media (min-width: 960px) {
    .subsidy { grid-template-columns: minmax(0, 420px) 1fr; }
  }
</style>
```

- [ ] **Step 3: Header**

`src/components/Header.astro`:
```astro
---
import { nav } from '../data/nav';
import { site } from '../data/site';
import { url } from '../lib/url';

interface Props { current?: string }
const { current } = Astro.props;
---
<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-header__brand" href={url('')}>
      <img src={url('img/logo.png')} alt={site.legalName} width="180" height="150" />
    </a>
    <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span class="site-nav__bars" aria-hidden="true"></span>
      <span class="visually-hidden">Menú</span>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Principal">
      <ul>
        {nav.map((item) => (
          <li>
            <a
              href={url(item.href)}
              aria-current={current === item.href ? 'page' : undefined}
              class={item.href === 'presupuesto/' ? 'btn btn--primary' : undefined}
            >{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  </div>
</header>

<script>
  const toggle = document.querySelector<HTMLButtonElement>('.site-nav__toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }
</script>

<style>
  .site-header { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 20; }
  .site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); min-height: 72px; flex-wrap: wrap; }
  .site-header__brand img { height: 56px; width: auto; }
  .site-nav__toggle {
    display: inline-flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    background: transparent; cursor: pointer;
  }
  .site-nav__bars, .site-nav__bars::before, .site-nav__bars::after {
    display: block; width: 22px; height: 2px; background: var(--color-text); position: relative; content: '';
  }
  .site-nav__bars::before { position: absolute; top: -7px; }
  .site-nav__bars::after { position: absolute; top: 7px; }
  .site-nav { display: none; flex-basis: 100%; padding-bottom: var(--space-4); }
  .site-nav.is-open { display: block; }
  .site-nav ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-1); }
  .site-nav a:not(.btn) {
    display: flex; align-items: center; min-height: 44px; padding-inline: var(--space-3);
    color: var(--color-text); text-decoration: none; border-radius: var(--radius-sm); font-weight: 600;
  }
  .site-nav a:not(.btn):hover, .site-nav a[aria-current='page'] { color: var(--color-primary); background: var(--color-surface-alt); }
  .site-nav .btn { width: 100%; margin-top: var(--space-2); }

  @media (min-width: 960px) {
    .site-header__inner { flex-wrap: nowrap; min-height: 88px; }
    .site-header__brand img { height: 68px; }
    .site-nav__toggle { display: none; }
    .site-nav, .site-nav.is-open { display: block; flex-basis: auto; padding: 0; }
    .site-nav ul { display: flex; align-items: center; gap: var(--space-2); }
    .site-nav .btn { width: auto; margin: 0 0 0 var(--space-2); }
  }
</style>
```

- [ ] **Step 4: Footer**

`src/components/Footer.astro`:
```astro
---
import { nav } from '../data/nav';
import { site } from '../data/site';
import { url } from '../lib/url';
import SubsidyNotice from './SubsidyNotice.astro';
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="container site-footer__grid">
    <div>
      <img src={url('img/logo.png')} alt="" width="120" height="100" class="site-footer__logo" />
      <img src={url('img/sello-colegiado.png')} alt="Administrador de Fincas Colegiado" width="180" height="60" class="site-footer__seal" />
    </div>
    <address>
      <strong>{site.legalName}</strong><br />
      {site.address.street}<br />
      {site.address.postalCode} {site.address.city} ({site.address.region})<br />
      <a href={`mailto:${site.email}`}>{site.email}</a><br />
      CIF {site.cif}
    </address>
    <nav aria-label="Pie de página">
      <ul>
        <li><a href={url('')}>Inicio</a></li>
        {nav.map((item) => <li><a href={url(item.href)}>{item.label}</a></li>)}
      </ul>
    </nav>
    <div class="site-footer__social">
      <a href={site.social.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn">
        <img src={url('img/social/linkedin.svg')} alt="" width="24" height="24" />
      </a>
      <a href={site.social.youtube} target="_blank" rel="noopener" aria-label="YouTube">
        <img src={url('img/social/youtube.svg')} alt="" width="24" height="24" />
      </a>
    </div>
  </div>
  <div class="container">
    <SubsidyNotice />
  </div>
  <div class="container site-footer__legal">
    <span>© {site.legalName} {year}</span>
    <a href={url('privacidad/')}>Política de Protección de Datos y Privacidad</a>
    <a href={url('cookies/')}>Política de Cookies</a>
    <button type="button" class="site-footer__cookies" data-cookie-settings>Preferencias de cookies</button>
  </div>
</footer>

<style>
  .site-footer { margin-top: var(--space-8); background: #0f1d3a; color: #d8e0f0; padding-block: var(--space-7) var(--space-5); }
  .site-footer a, .site-footer__cookies { color: #fff; }
  .site-footer__grid { display: grid; gap: var(--space-6); margin-bottom: var(--space-6); }
  .site-footer__logo { height: 72px; width: auto; background: #fff; border-radius: var(--radius-sm); padding: var(--space-2); }
  .site-footer__seal { height: 48px; width: auto; margin-top: var(--space-3); background: #fff; border-radius: var(--radius-sm); padding: var(--space-2); }
  address { font-style: normal; }
  .site-footer ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .site-footer__social { display: flex; gap: var(--space-3); }
  .site-footer__social a { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: rgb(255 255 255 / 10%); }
  .site-footer__social img { filter: invert(1); }
  .site-footer__legal { display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-5); margin-top: var(--space-5); font-size: var(--text-sm); }
  .site-footer__cookies { background: none; border: 0; padding: 0; font: inherit; text-decoration: underline; cursor: pointer; }
  @media (min-width: 640px) { .site-footer__grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 960px) { .site-footer__grid { grid-template-columns: 1.2fr 1.5fr 1fr auto; } }
</style>
```

- [ ] **Step 5: BaseLayout**

`src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { site } from '../data/site';
import { url } from '../lib/url';

interface Props { title: string; description?: string; current?: string }
const { title, description = site.description, current } = Astro.props;
const isHome = Astro.url.pathname === url('');
const fullTitle = isHome ? title : `${title} · ${site.name}`;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href={url('favicon.ico')} />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(url('img/logo.png'), Astro.site)} />
    <meta name="theme-color" content="#0055ff" />
  </head>
  <body>
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <Header current={current} />
    <main id="main"><slot /></main>
    <Footer />
  </body>
</html>

<style is:global>
  .skip-link { position: absolute; left: var(--space-4); top: -100px; z-index: 100; background: var(--color-primary); color: #fff; padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); }
  .skip-link:focus { top: var(--space-4); }
</style>
```

`src/pages/index.astro` (provisional hasta Task 6):
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Pulido Gestión. Administración de Fincas. Gestoría.">
  <section class="section container"><h1>Pulido Gestión</h1></section>
</BaseLayout>
```

- [ ] **Step 6: Verificar**

Run: `npm run check && npm run test:e2e -- layout`
Expected: 0 errors; 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add base layout with responsive header, footer and subsidy notice"
```

---

### Task 4: Validación del formulario de presupuesto (lógica pura)

**Files:**
- Create: `src/lib/quote-form.ts`, `tests/unit/quote-form.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type QuoteField = 'nombre' | 'direccion' | 'codigoPostal' | 'telefono' | 'email'
    | 'viviendas' | 'locales' | 'naves' | 'garajes' | 'privacidad';
  export type QuoteData = Record<Exclude<QuoteField, 'privacidad'>, string> & { privacidad: boolean };
  export type QuoteErrors = Partial<Record<QuoteField, string>>;
  export function validateQuote(data: QuoteData): QuoteErrors; // {} si es válido
  ```

- [ ] **Step 1: Test que falla**

`tests/unit/quote-form.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { validateQuote, type QuoteData } from '../../src/lib/quote-form';

const valid: QuoteData = {
  nombre: 'Ana López', direccion: 'C/ Mayor 1', codigoPostal: '28804', telefono: '600 123 456',
  email: 'ana@example.com', viviendas: '12', locales: '', naves: '', garajes: '0', privacidad: true,
};

describe('validateQuote', () => {
  it('accepts a complete valid request', () => {
    expect(validateQuote(valid)).toEqual({});
  });
  it('requires name, address, postal code, phone, email and privacy', () => {
    const errors = validateQuote({ ...valid, nombre: ' ', direccion: '', codigoPostal: '', telefono: '', email: '', privacidad: false });
    expect(Object.keys(errors).sort()).toEqual(['codigoPostal', 'direccion', 'email', 'nombre', 'privacidad', 'telefono']);
  });
  it('accepts postal codes with leading zero and rejects non 5-digit ones', () => {
    expect(validateQuote({ ...valid, codigoPostal: '02001' })).toEqual({});
    expect(validateQuote({ ...valid, codigoPostal: '2880' }).codigoPostal).toBeDefined();
    expect(validateQuote({ ...valid, codigoPostal: '28A04' }).codigoPostal).toBeDefined();
  });
  it('accepts phones with spaces, dashes and +34, rejects too short ones', () => {
    expect(validateQuote({ ...valid, telefono: '+34 600-123-456' })).toEqual({});
    expect(validateQuote({ ...valid, telefono: '91 888 77 66 / 600123456' })).toEqual({});
    expect(validateQuote({ ...valid, telefono: '12345' }).telefono).toBeDefined();
    expect(validateQuote({ ...valid, telefono: 'llamar tarde' }).telefono).toBeDefined();
  });
  it('rejects malformed emails', () => {
    expect(validateQuote({ ...valid, email: 'ana@' }).email).toBeDefined();
    expect(validateQuote({ ...valid, email: 'ana example.com' }).email).toBeDefined();
  });
  it('allows empty counts but rejects negative or decimal ones', () => {
    expect(validateQuote({ ...valid, viviendas: '' })).toEqual({});
    expect(validateQuote({ ...valid, locales: '-1' }).locales).toBeDefined();
    expect(validateQuote({ ...valid, naves: '2.5' }).naves).toBeDefined();
  });
});
```

Run: `npm test -- quote-form` → Expected: FAIL (módulo no existe).

- [ ] **Step 2: Implementar**

`src/lib/quote-form.ts`:
```ts
export type QuoteField =
  | 'nombre' | 'direccion' | 'codigoPostal' | 'telefono' | 'email'
  | 'viviendas' | 'locales' | 'naves' | 'garajes' | 'privacidad';

export type QuoteData = Record<Exclude<QuoteField, 'privacidad'>, string> & { privacidad: boolean };
export type QuoteErrors = Partial<Record<QuoteField, string>>;

const COUNT_FIELDS = ['viviendas', 'locales', 'naves', 'garajes'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_RE = /^[\d\s+\-()/.]+$/;

/** Valida una solicitud de presupuesto. Devuelve un objeto vacío si es válida. */
export function validateQuote(data: QuoteData): QuoteErrors {
  const errors: QuoteErrors = {};
  const required = (field: keyof QuoteData, message: string) => {
    if (!String(data[field]).trim()) errors[field] = message;
  };

  required('nombre', 'Indique su nombre y apellidos.');
  required('direccion', 'Indique la dirección de la finca.');

  const cp = data.codigoPostal.trim();
  if (!/^\d{5}$/.test(cp)) errors.codigoPostal = 'El código postal debe tener 5 dígitos.';

  const phone = data.telefono.trim();
  if (!PHONE_CHARS_RE.test(phone) || phone.replace(/\D/g, '').length < 9) {
    errors.telefono = 'Indique un teléfono de contacto válido (mínimo 9 dígitos).';
  }

  if (!EMAIL_RE.test(data.email.trim())) errors.email = 'Indique un email válido.';

  for (const field of COUNT_FIELDS) {
    const value = data[field].trim();
    if (value && !/^\d+$/.test(value)) errors[field] = 'Debe ser un número entero igual o mayor que 0.';
  }

  if (!data.privacidad) errors.privacidad = 'Debe aceptar la política de privacidad.';

  return errors;
}
```

- [ ] **Step 3: Verificar**

Run: `npm test` → Expected: todos PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add quote request validation logic"
```

---

### Task 5: Componentes de contenido (VideoEmbed, TeamCard) y páginas Equipo, Multimedia, Dónde estamos

**Files:**
- Create: `src/components/VideoEmbed.astro`, `src/components/TeamCard.astro`, `src/pages/equipo.astro`, `src/pages/multimedia.astro`, `src/pages/contacto.astro`, `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `team`, `videos`, `site`, `url()`.
- Produces: `VideoEmbed` props `{ video: Video; eager?: boolean }` — renderiza `<figure class="video">` con `<button class="video__play" data-video-id={id}>` (miniatura `https://i.ytimg.com/vi/{id}/hqdefault.jpg`); al pulsar sustituye el botón por `<iframe src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0" title={title}>`. `TeamCard` props `{ member: TeamMember }`.

- [ ] **Step 1: Test e2e que falla**

`tests/e2e/pages.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('equipo shows the 5 members with photos', async ({ page }) => {
  await page.goto('equipo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nuestro Equipo');
  const cards = page.locator('.team-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText('María Dolores Rodrigo López');
  for (const img of await page.locator('.team-card img').all()) {
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
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
```

Run: `npm run test:e2e -- pages` → Expected: FAIL (404).

- [ ] **Step 2: VideoEmbed**

`src/components/VideoEmbed.astro`:
```astro
---
import type { Video } from '../data/videos';

interface Props { video: Video; eager?: boolean }
const { video, eager = false } = Astro.props;
---
<figure class="video">
  <div class="video__frame">
    <button type="button" class="video__play" data-video-id={video.id} data-video-title={video.title}>
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt=""
        width="480"
        height="360"
        loading={eager ? 'eager' : 'lazy'}
      />
      <span class="video__icon" aria-hidden="true"></span>
      <span class="visually-hidden">Reproducir vídeo: {video.title}</span>
    </button>
  </div>
  <figcaption>{video.title}</figcaption>
</figure>

<script>
  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.video__play');
    if (!button) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.videoId}?autoplay=1&rel=0`;
    iframe.title = button.dataset.videoTitle ?? 'Vídeo';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  });
</script>

<style>
  .video { margin: 0; }
  .video__frame { position: relative; aspect-ratio: 16 / 9; border-radius: var(--radius); overflow: hidden; background: #0f1d3a; box-shadow: var(--shadow); }
  .video__play { all: unset; position: absolute; inset: 0; cursor: pointer; }
  .video__play:focus-visible { outline: 3px solid var(--color-accent); outline-offset: -3px; }
  .video__play img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
  .video__play:hover img { transform: scale(1.03); }
  .video__icon {
    position: absolute; left: 50%; top: 50%; width: 68px; height: 68px; translate: -50% -50%;
    border-radius: 50%; background: var(--color-primary); box-shadow: var(--shadow);
  }
  .video__icon::after {
    content: ''; position: absolute; left: 27px; top: 22px;
    border-style: solid; border-width: 12px 0 12px 20px; border-color: transparent transparent transparent #fff;
  }
  .video :global(iframe) { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  figcaption { margin-top: var(--space-3); font-weight: 600; }
</style>
```

- [ ] **Step 3: TeamCard**

`src/components/TeamCard.astro`:
```astro
---
import type { TeamMember } from '../data/team';
import { url } from '../lib/url';

interface Props { member: TeamMember }
const { member } = Astro.props;
---
<article class="team-card">
  <img src={url(member.photo)} alt={`Fotografía de ${member.name}`} width="450" height="461" loading="lazy" />
  <h2>{member.name}</h2>
</article>

<style>
  .team-card { background: var(--color-surface); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); text-align: center; }
  .team-card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
  .team-card h2 { font-size: var(--text-lg); padding: var(--space-4); margin: 0; }
</style>
```

- [ ] **Step 4: Páginas**

`src/pages/equipo.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import TeamCard from '../components/TeamCard.astro';
import { team } from '../data/team';
---
<BaseLayout title="Nuestro Equipo" current="equipo/">
  <section class="section container">
    <h1 class="section__title">Nuestro Equipo</h1>
    <div class="grid-cards">
      {team.map((member) => <TeamCard member={member} />)}
    </div>
  </section>
</BaseLayout>
```

`src/pages/multimedia.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import VideoEmbed from '../components/VideoEmbed.astro';
import { videos } from '../data/videos';
---
<BaseLayout title="Área Multimedia" current="multimedia/">
  <section class="section container">
    <h1 class="section__title">Área Multimedia</h1>
    <div class="grid-cards grid-cards--videos">
      {videos.map((video, i) => <VideoEmbed video={video} eager={i < 2} />)}
    </div>
  </section>
</BaseLayout>

<style>
  .grid-cards--videos { grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
</style>
```

`src/pages/contacto.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { site } from '../data/site';
import { url } from '../lib/url';
---
<BaseLayout title="Dónde Estamos" current="contacto/">
  <section class="section container">
    <h1 class="section__title">Dónde estamos</h1>
    <div class="location">
      <a class="location__map" href={site.mapsUrl} target="_blank" rel="noopener external">
        <img src={url('img/mapa.png')} alt={`Mapa de ubicación: ${site.address.street}, ${site.address.city}`} width="778" height="442" />
        <span class="location__hint">Abrir en Google Maps ↗</span>
      </a>
      <address class="location__card">
        <h2>{site.legalName}</h2>
        <p>{site.address.street}<br />{site.address.postalCode} {site.address.city}<br />({site.address.region})</p>
        <p><a href={`mailto:${site.email}`}>{site.email}</a></p>
        <a class="btn btn--primary" href={site.mapsUrl} target="_blank" rel="noopener external">Cómo llegar</a>
      </address>
    </div>
  </section>
</BaseLayout>

<style>
  .location { display: grid; gap: var(--space-5); }
  .location__map { position: relative; display: block; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  .location__map img { width: 100%; }
  .location__hint { position: absolute; right: var(--space-3); bottom: var(--space-3); background: #fff; padding: var(--space-2) var(--space-3); border-radius: 999px; font-weight: 600; font-size: var(--text-sm); }
  .location__card { font-style: normal; background: var(--color-surface); border-radius: var(--radius); padding: var(--space-6); box-shadow: var(--shadow); }
  @media (min-width: 960px) { .location { grid-template-columns: 1.6fr 1fr; align-items: center; } }
</style>
```

- [ ] **Step 5: Verificar**

Run: `npm run check && npm run test:e2e -- pages`
Expected: 0 errors; 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add team, multimedia and location pages"
```

---

### Task 6: Página de inicio

**Files:**
- Modify: `src/pages/index.astro`
- Create: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `VideoEmbed`, `featuredVideo`, `nav`, `site`, `url()`.

- [ ] **Step 1: Test e2e que falla**

`tests/e2e/home.spec.ts`:
```ts
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
```

Run: `npm run test:e2e -- home` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import VideoEmbed from '../components/VideoEmbed.astro';
import { featuredVideo } from '../data/videos';
import { nav } from '../data/nav';
import { site } from '../data/site';
import { url } from '../lib/url';

const shortcutText: Record<string, string> = {
  'equipo/': 'Conozca a las personas que gestionan su comunidad.',
  'multimedia/': 'Ponencias, entrevistas y propuestas en vídeo.',
  'contacto/': `${site.address.street}, ${site.address.city}.`,
  'presupuesto/': 'Envíenos los datos de su finca.',
};
---
<BaseLayout title="Pulido Gestión. Administración de Fincas. Gestoría.">
  <section class="hero">
    <div class="container hero__grid">
      <div class="hero__copy">
        <p class="hero__eyebrow">Administrador de Fincas Colegiado · {site.address.city}</p>
        <h1>Administración de Fincas y Gestoría</h1>
        <p class="hero__lead">{site.description}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href={url('presupuesto/')}>Solicitar presupuesto</a>
          <a class="btn btn--ghost" href={site.portalUrl} target="_blank" rel="noopener">Acceso a gestiones en su comunidad ↗</a>
        </div>
      </div>
      <div class="hero__media">
        <h2 class="hero__video-title">Por qué trabajar con nosotros</h2>
        <VideoEmbed video={featuredVideo} eager />
      </div>
    </div>
  </section>

  <section class="section container">
    <h2 class="section__title">¿En qué podemos ayudarle?</h2>
    <ul class="shortcuts grid-cards">
      {nav.map((item) => (
        <li>
          <a href={url(item.href)}>
            <strong>{item.label}</strong>
            <span>{shortcutText[item.href]}</span>
          </a>
        </li>
      ))}
    </ul>
  </section>

  <section class="section section--alt">
    <div class="container social">
      <h2>Visítenos en</h2>
      <div class="social__links">
        <a class="btn btn--ghost" href={site.social.linkedin} target="_blank" rel="noopener">
          <img src={url('img/social/linkedin.svg')} alt="" width="20" height="20" /> LinkedIn
        </a>
        <a class="btn btn--ghost" href={site.social.youtube} target="_blank" rel="noopener">
          <img src={url('img/social/youtube.svg')} alt="" width="20" height="20" /> YouTube
        </a>
      </div>
    </div>
  </section>
</BaseLayout>

<style>
  .hero { padding-block: var(--space-7) var(--space-8); background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%); }
  .hero__grid { display: grid; gap: var(--space-7); align-items: center; }
  .hero__eyebrow { color: var(--color-primary); font-weight: 600; font-size: var(--text-sm); letter-spacing: .04em; text-transform: uppercase; }
  .hero__lead { font-size: var(--text-lg); color: var(--color-muted); max-width: 48ch; }
  .hero__actions { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-5); }
  .hero__video-title { font-size: var(--text-lg); margin-bottom: var(--space-3); }
  .hero__media :global(figcaption) { display: none; }

  .shortcuts { list-style: none; margin: 0; padding: 0; }
  .shortcuts a {
    display: flex; flex-direction: column; gap: var(--space-2); height: 100%;
    padding: var(--space-5); background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius); text-decoration: none; color: var(--color-text); transition: border-color .2s, box-shadow .2s;
  }
  .shortcuts a:hover { border-color: var(--color-primary); box-shadow: var(--shadow); }
  .shortcuts strong { font-family: var(--font-serif); font-size: var(--text-lg); color: var(--color-primary); }
  .shortcuts span { color: var(--color-muted); }

  .social { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); text-align: center; }
  .social h2 { margin: 0; }
  .social__links { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }

  @media (min-width: 640px) {
    .hero__actions { flex-direction: row; flex-wrap: wrap; }
  }
  @media (min-width: 960px) {
    .hero__grid { grid-template-columns: 1.1fr 1fr; }
  }
</style>
```

> Nota: los textos de `shortcutText` son descripciones funcionales mínimas de cada sección (no copy de marketing); cualquier copy comercial va a `docs/pendientes.md` (Task 10).

- [ ] **Step 3: Verificar**

Run: `npm run check && npm run test:e2e -- home layout`
Expected: 0 errors; PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add redesigned home page"
```

---

### Task 7: Página de Solicitud de Presupuesto (formulario demo)

**Files:**
- Create: `src/components/QuoteForm.astro`, `src/pages/presupuesto.astro`, `tests/e2e/quote.spec.ts`

**Interfaces:**
- Consumes: `validateQuote`, `QuoteData`, `QuoteField` de `src/lib/quote-form.ts`; `url()`.
- Produces: `<form id="quote-form" novalidate data-demo>` con inputs `name` = cada `QuoteField`; errores en `<p class="field__error" id="{field}-error">` enlazados con `aria-describedby` y `aria-invalid`; aviso de envío en `<div class="form-status" role="status">`.
  Para activar el envío real en el futuro: poner `action` en el `<form>` y eliminar `data-demo` (documentado en `docs/pendientes.md`).

- [ ] **Step 1: Test e2e que falla**

`tests/e2e/quote.spec.ts`:
```ts
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
```

Run: `npm run test:e2e -- quote` → Expected: FAIL.

- [ ] **Step 2: QuoteForm**

`src/components/QuoteForm.astro`:
```astro
---
import { url } from '../lib/url';

interface Field { id: string; label: string; type: string; required?: boolean; placeholder?: string; autocomplete?: string; inputmode?: 'numeric' | 'tel' | 'email' | 'text'; wide?: boolean }

const contact: Field[] = [
  { id: 'nombre', label: 'Nombre y apellidos', type: 'text', required: true, placeholder: 'Nombre y apellidos', autocomplete: 'name', wide: true },
  { id: 'direccion', label: 'Dirección de la finca', type: 'text', required: true, placeholder: 'Dirección de la finca', autocomplete: 'street-address', wide: true },
  { id: 'codigoPostal', label: 'Código postal', type: 'text', required: true, placeholder: '28804', autocomplete: 'postal-code', inputmode: 'numeric' },
  { id: 'telefono', label: 'Teléfonos de contacto', type: 'tel', required: true, placeholder: '600 000 000', autocomplete: 'tel', inputmode: 'tel' },
  { id: 'email', label: 'Email de contacto', type: 'email', required: true, placeholder: 'ejemplo@correo.com', autocomplete: 'email', inputmode: 'email', wide: true },
];
const counts: Field[] = [
  { id: 'viviendas', label: 'Nº viviendas', type: 'number' },
  { id: 'locales', label: 'Nº locales', type: 'number' },
  { id: 'naves', label: 'Nº naves', type: 'number' },
  { id: 'garajes', label: 'Nº plazas de garaje', type: 'number' },
];
---
<form id="quote-form" class="quote-form" novalidate data-demo>
  <fieldset>
    <legend>Datos de contacto</legend>
    <div class="quote-form__grid">
      {contact.map((f) => (
        <div class:list={['field', { 'field--wide': f.wide }]}>
          <label for={f.id}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>
          <input id={f.id} name={f.id} type={f.type} required={f.required} placeholder={f.placeholder}
            autocomplete={f.autocomplete} inputmode={f.inputmode} aria-describedby={`${f.id}-error`} />
          <p class="field__error" id={`${f.id}-error`}></p>
        </div>
      ))}
    </div>
  </fieldset>
  <fieldset>
    <legend>Datos de la finca</legend>
    <div class="quote-form__grid quote-form__grid--counts">
      {counts.map((f) => (
        <div class="field">
          <label for={f.id}>{f.label}</label>
          <input id={f.id} name={f.id} type="number" min="0" step="1" inputmode="numeric" aria-describedby={`${f.id}-error`} />
          <p class="field__error" id={`${f.id}-error`}></p>
        </div>
      ))}
    </div>
  </fieldset>
  <div class="field field--check">
    <input type="checkbox" id="privacidad" name="privacidad" value="1" required aria-describedby="privacidad-error" />
    <label for="privacidad">Acepto la <a href={url('privacidad/#presup')} target="_blank">política de privacidad</a> del sitio. <span aria-hidden="true">*</span></label>
    <p class="field__error" id="privacidad-error"></p>
  </div>
  <div class="quote-form__actions">
    <button type="submit" class="btn btn--primary">Enviar</button>
    <button type="reset" class="btn btn--ghost">Borrar formulario</button>
  </div>
  <div class="form-status" role="status" aria-live="polite"></div>
</form>

<script>
  import { validateQuote, type QuoteData, type QuoteField } from '../lib/quote-form';

  const form = document.getElementById('quote-form') as HTMLFormElement | null;
  const status = form?.querySelector<HTMLElement>('.form-status');
  const FIELDS: QuoteField[] = ['nombre', 'direccion', 'codigoPostal', 'telefono', 'email', 'viviendas', 'locales', 'naves', 'garajes', 'privacidad'];

  function clearErrors() {
    for (const f of FIELDS) {
      document.getElementById(f)?.removeAttribute('aria-invalid');
      const err = document.getElementById(`${f}-error`);
      if (err) err.textContent = '';
    }
    if (status) { status.textContent = ''; status.className = 'form-status'; }
  }

  function readForm(f: HTMLFormElement): QuoteData {
    const val = (name: string) => (f.elements.namedItem(name) as HTMLInputElement).value;
    return {
      nombre: val('nombre'), direccion: val('direccion'), codigoPostal: val('codigoPostal'),
      telefono: val('telefono'), email: val('email'), viviendas: val('viviendas'), locales: val('locales'),
      naves: val('naves'), garajes: val('garajes'),
      privacidad: (f.elements.namedItem('privacidad') as HTMLInputElement).checked,
    };
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const errors = validateQuote(readForm(form));
    const invalid = FIELDS.filter((f) => errors[f]);
    for (const f of invalid) {
      document.getElementById(f)?.setAttribute('aria-invalid', 'true');
      const err = document.getElementById(`${f}-error`);
      if (err) err.textContent = errors[f] ?? '';
    }
    if (invalid.length) {
      document.getElementById(invalid[0])?.focus();
      return;
    }
    if (form.hasAttribute('data-demo') && status) {
      status.textContent = 'Formulario de demostración: aún no se envían datos. En la versión final su solicitud llegará a fincas@pulidogestion.com.';
      status.className = 'form-status form-status--ok';
      return;
    }
    form.submit();
  });

  form?.addEventListener('reset', () => clearErrors());
</script>

<style>
  .quote-form { background: var(--color-surface); border-radius: var(--radius); box-shadow: var(--shadow); padding: clamp(var(--space-4), 4vw, var(--space-7)); }
  fieldset { border: 0; padding: 0; margin: 0 0 var(--space-6); min-width: 0; }
  legend { font-family: var(--font-serif); font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-4); }
  .quote-form__grid { display: grid; gap: var(--space-4); }
  .field { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
  label { font-weight: 600; font-size: var(--text-sm); }
  input:not([type='checkbox']) {
    min-height: 48px; padding: var(--space-3) var(--space-4); width: 100%;
    font: inherit; color: inherit; background: var(--color-bg);
    border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  }
  input:focus-visible { border-color: var(--color-primary); }
  input[aria-invalid='true'] { border-color: var(--color-danger); background: #fff5f4; }
  .field__error { color: var(--color-danger); font-size: var(--text-sm); margin: 0; min-height: 0; }
  .field__error:empty { display: none; }
  .field--check { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: var(--space-3); margin-bottom: var(--space-5); }
  .field--check input { width: 24px; height: 24px; margin: 2px 0 0; accent-color: var(--color-primary); }
  .field--check .field__error { grid-column: 1 / -1; }
  .quote-form__actions { display: flex; flex-direction: column; gap: var(--space-3); }
  .form-status:empty { display: none; }
  .form-status { margin-top: var(--space-4); padding: var(--space-4); border-radius: var(--radius-sm); }
  .form-status--ok { background: #e8f6ef; color: var(--color-success); font-weight: 600; }
  @media (min-width: 640px) {
    .quote-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .field--wide { grid-column: 1 / -1; }
    .quote-form__actions { flex-direction: row; }
  }
  @media (min-width: 960px) {
    .quote-form__grid--counts { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
</style>
```

- [ ] **Step 3: Página**

`src/pages/presupuesto.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import QuoteForm from '../components/QuoteForm.astro';
---
<BaseLayout title="Solicitud de Presupuesto" current="presupuesto/" description="Solicite presupuesto para la administración de su comunidad de propietarios.">
  <section class="section container quote">
    <h1 class="section__title">Solicitud de Presupuesto</h1>
    <p class="section__lead">Envíenos sus datos y nos pondremos en contacto con usted.</p>
    <QuoteForm />
  </section>
</BaseLayout>

<style>
  .quote { max-width: 880px; }
</style>
```

- [ ] **Step 4: Verificar**

Run: `npm run check && npm run test:e2e -- quote`
Expected: 0 errors; 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add quote request page with client-side validation (demo mode)"
```

---

### Task 8: Textos legales y banner de cookies

**Files:**
- Create: `src/lib/legal-transform.ts`, `tests/unit/legal-transform.test.ts`, `scripts/import-legal.mjs`, `src/content/legal/privacidad.html`, `src/content/legal/cookies.html`, `src/pages/privacidad.astro`, `src/pages/cookies.astro`, `src/components/CookieBanner.astro`, `tests/e2e/legal-cookies.spec.ts`
- Modify: `src/layouts/BaseLayout.astro` (incluir `CookieBanner`)

**Interfaces:**
- Produces: `transformLegalHtml(html: string): string` — recibe el HTML completo de una página legal antigua y devuelve un fragmento limpio: solo etiquetas `h2, h3, p, ul, ol, li, strong, em, a, br`; todas las tablas se aplanan (en la web actual son solo de maquetación); sin atributos salvo `href` (en `a`) e `id` (se conserva `id="presup"`); los `<p>` cuyo texto es entero negrita pasan a `h2` (si tenían `font-size` ≥ 20pt) o `h3`; se elimina la cabecera, el menú inferior (celdas `.titular_2`), el footer y enlaces `javascript:`; se colapsan espacios.
- Produces: `CookieBanner` usa `localStorage['pg-cookie-consent']` = `'accepted' | 'rejected'`. Si `'accepted'`, inyecta `https://www.googletagmanager.com/gtag/js?id=G-VEZ300TBPB`. Cualquier elemento `[data-cookie-settings]` (footer) borra la preferencia y muestra el banner.

- [ ] **Step 1: Test unitario que falla**

`tests/unit/legal-transform.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { transformLegalHtml } from '../../src/lib/legal-transform';

const sample = `<html><body><header><img src="img/cabecera.png"></header>
<table style="width:85%"><tr><td><div>
<p style="font-size:24.5pt;background:whitesmoke"><b>Condiciones de Uso</b></p>
<p class=Default><span style="font-size:11.5pt">Texto   con
  espacios.</span></p>
<p class=Default><span style="color:#7e7e7e"><b>Usuario y régimen</b><br><br></span>
<ul style="padding-left:40px"><li><span style="font-family:arial">Punto uno</span></li></ul>
<p>Correo: <a href="mailto:fincas@pulidogestion.com" style="color:blue">fincas@pulidogestion.com</a></p>
<p id="presup" style="font-size:24.5pt"><b>Política de Privacidad. Formulario</b></p>
</div></td></tr></table>
<table><tr><td class="titular_2"><a href="index.html">Inicio</a></td><td class="titular_2"><a href="javascript:window.close();">Cerrar esta ventana</a></td></tr></table>
<footer>© Pulido 2020</footer></body></html>`;

describe('transformLegalHtml', () => {
  const out = transformLegalHtml(sample);

  it('turns big bold paragraphs into h2 and small bold ones into h3', () => {
    expect(out).toContain('<h2>Condiciones de Uso</h2>');
    expect(out).toContain('<h3>Usuario y régimen</h3>');
  });
  it('keeps the presup anchor', () => {
    expect(out).toContain('<h2 id="presup">Política de Privacidad. Formulario</h2>');
  });
  it('removes inline styles, spans, header, footer and navigation', () => {
    expect(out).not.toMatch(/style=|<span|<table|<td|<header|<footer|<img|Cerrar esta ventana|index\.html/);
  });
  it('keeps paragraphs, lists and mail links with collapsed whitespace', () => {
    expect(out).toContain('<p>Texto con espacios.</p>');
    expect(out).toContain('<ul><li>Punto uno</li></ul>');
    expect(out).toContain('<a href="mailto:fincas@pulidogestion.com">fincas@pulidogestion.com</a>');
  });
});
```

Run: `npm test -- legal` → Expected: FAIL.

- [ ] **Step 2: Implementar `transformLegalHtml`**

`src/lib/legal-transform.ts`:
```ts
import { parse, type HTMLElement, type Node, NodeType } from 'node-html-parser';

const KEEP = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'h2', 'h3']);
const DROP = new Set(['header', 'footer', 'script', 'style', 'img', 'nav', 'head']);
const RENAME: Record<string, string> = { b: 'strong', i: 'em' };

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fontSizePt(el: HTMLElement): number {
  const m = (el.getAttribute('style') ?? '').match(/font-size:\s*([\d.]+)pt/i);
  return m ? Number(m[1]) : 0;
}

function isAllBold(el: HTMLElement): boolean {
  const text = el.text.trim();
  if (!text || text.length > 160) return false;
  const bold = el.querySelectorAll('b, strong').map((b) => b.text).join('').trim();
  return bold.replace(/\s+/g, ' ') === text.replace(/\s+/g, ' ');
}

function render(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) return escape(node.text);
  if (node.nodeType !== NodeType.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const raw = el.tagName.toLowerCase();
  if (DROP.has(raw) || el.classList.contains('titular_2')) return '';
  const tag = RENAME[raw] ?? raw;

  if (tag === 'p' && isAllBold(el)) {
    const heading = fontSizePt(el) >= 20 ? 'h2' : 'h3';
    const id = el.getAttribute('id');
    return `<${heading}${id ? ` id="${id}"` : ''}>${escape(el.text.replace(/\s+/g, ' ').trim())}</${heading}>`;
  }

  const inner = el.childNodes.map(render).join('');
  // table/tr/td, div, span… (maquetación) se aplanan: solo se conserva su contenido.
  if (!KEEP.has(tag)) return inner;
  if (tag === 'br') return '<br>';
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    if (!href || href.startsWith('javascript:')) return inner;
    return `<a href="${href}">${inner}</a>`;
  }
  const id = el.getAttribute('id');
  return `<${tag}${id ? ` id="${id}"` : ''}>${inner}</${tag}>`;
}

/** Convierte una página legal antigua en un fragmento HTML semántico y limpio. */
export function transformLegalHtml(html: string): string {
  const body = parse(html).querySelector('body') ?? parse(html);
  return body.childNodes
    .map(render)
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/(<br>\s*)+(<\/(p|li|h2|h3)>)/g, '$2')
    .replace(/<p>\s*(<br>\s*)*<\/p>/g, '')
    .replace(/<(p|li|h2|h3)( id="[^"]*")?>\s+/g, '<$1$2>')
    .replace(/\s+<\/(p|li|h2|h3)>/g, '</$1>')
    .replace(/>\s+<(\/?)(p|ul|ol|li|h2|h3)\b/g, '><$1$2')
    .trim();
}
```

Run: `npm test -- legal` → Expected: PASS. Si algún caso falla, ajustar la regex de limpieza correspondiente (no el test).

- [ ] **Step 3: Script de importación**

`scripts/import-legal.mjs`:
```js
// Descarga las páginas legales de la web actual y genera fragmentos HTML limpios.
import { writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { transformLegalHtml } = await vite.ssrLoadModule('/src/lib/legal-transform.ts');

const pages = [
  { src: 'https://pulidogestion.com/privacidad.html', dest: 'src/content/legal/privacidad.html' },
  { src: 'https://pulidogestion.com/politica_cookies.html', dest: 'src/content/legal/cookies.html' },
];

await mkdir('src/content/legal', { recursive: true });
for (const { src, dest } of pages) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src} → ${res.status}`);
  const html = transformLegalHtml(await res.text());
  await writeFile(dest, `${html}\n`);
  console.log(`${dest}: ${html.length} chars`);
}
await vite.close();
```

Run: `npm run legal`
Expected: dos líneas con tamaño > 5000 chars. **Revisar a mano** ambos ficheros: empiezan por un `<h2>`, contienen `id="presup"` (privacidad), no contienen `style=`, `<span`, `Cerrar esta ventana`. Comparar el número de encabezados con la web original (privacidad tiene 2 títulos grandes y ~14 subtítulos en negrita). Si el script no detecta algún subtítulo, corregir `transformLegalHtml` añadiendo un caso de test y volver a ejecutar. No editar a mano el texto legal.

- [ ] **Step 4: Páginas legales**

`src/pages/privacidad.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import content from '../content/legal/privacidad.html?raw';
---
<BaseLayout title="Política de Protección de Datos y Privacidad">
  <article class="section container legal" set:html={content} />
</BaseLayout>
```

`src/pages/cookies.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import content from '../content/legal/cookies.html?raw';
---
<BaseLayout title="Política de Cookies">
  <article class="section container legal" set:html={content} />
</BaseLayout>
```

Añadir a `src/styles/global.css`:
```css
.legal { max-width: 80ch; }
.legal h2 { margin-top: var(--space-7); padding-bottom: var(--space-3); border-bottom: 2px solid var(--color-primary); }
.legal h2:first-child { margin-top: 0; }
.legal h3 { margin-top: var(--space-6); color: var(--color-primary); }
.legal h2[id] { scroll-margin-top: 110px; }
.legal ul, .legal ol { padding-left: var(--space-5); }
```

Crear `src/env.d.ts` si `astro check` no reconoce `?raw`:
```ts
/// <reference types="astro/client" />
```

- [ ] **Step 5: Test e2e que falla (cookies + legales)**

`tests/e2e/legal-cookies.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('privacy page renders legal text with presup anchor', async ({ page }) => {
  await page.goto('privacidad/#presup');
  await expect(page.locator('main h2').first()).toBeVisible();
  await expect(page.locator('#presup')).toBeInViewport();
  await expect(page.locator('main')).toContainText('B82302365');
});

test('cookies page renders', async ({ page }) => {
  await page.goto('cookies/');
  await expect(page.locator('main')).toContainText('Política de Cookies');
});

test('rejecting cookies never loads analytics', async ({ page }) => {
  const gaRequests: string[] = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) gaRequests.push(r.url()); });
  await page.goto('./');
  const banner = page.locator('.cookie-banner');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Rechazar' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
  await page.waitForLoadState('networkidle');
  expect(gaRequests).toHaveLength(0);
});

test('accepting cookies loads analytics; footer button reopens the banner', async ({ page }) => {
  await page.route('**/googletagmanager.com/**', (route) => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto('./');
  const gaRequest = page.waitForRequest(/googletagmanager\.com\/gtag\/js\?id=G-VEZ300TBPB/);
  await page.locator('.cookie-banner').getByRole('button', { name: 'Aceptar' }).click();
  await gaRequest;
  await page.locator('[data-cookie-settings]').click();
  await expect(page.locator('.cookie-banner')).toBeVisible();
});

test('banner does not cause horizontal overflow on 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  await expect(page.locator('.cookie-banner')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

Run: `npm run test:e2e -- legal-cookies` → Expected: los 3 tests de cookies FAIL.

- [ ] **Step 6: CookieBanner**

`src/components/CookieBanner.astro`:
```astro
---
import { site } from '../data/site';
import { url } from '../lib/url';
---
<div class="cookie-banner" role="region" aria-label="Aviso de cookies" hidden data-analytics-id={site.analyticsId}>
  <p>Esta página utiliza cookies de análisis para mejorar su experiencia de navegación. <a href={url('cookies/')}>Más información</a></p>
  <div class="cookie-banner__actions">
    <button type="button" class="btn btn--ghost" data-consent="rejected">Rechazar</button>
    <button type="button" class="btn btn--primary" data-consent="accepted">Aceptar</button>
  </div>
</div>

<script>
  const KEY = 'pg-cookie-consent';
  const banner = document.querySelector<HTMLElement>('.cookie-banner');

  const read = (): string | null => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v: string | null) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } };

  function loadAnalytics(id: string) {
    if (document.getElementById('ga-script')) return;
    const s = document.createElement('script');
    s.id = 'ga-script';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', id, { anonymize_ip: true });
  }

  if (banner) {
    const id = banner.dataset.analyticsId!;
    const consent = read();
    if (consent === 'accepted') loadAnalytics(id);
    else if (consent !== 'rejected') banner.hidden = false;

    banner.addEventListener('click', (e) => {
      const choice = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-consent]')?.dataset.consent;
      if (!choice) return;
      write(choice);
      banner.hidden = true;
      if (choice === 'accepted') loadAnalytics(id);
    });

    document.querySelectorAll('[data-cookie-settings]').forEach((el) =>
      el.addEventListener('click', () => { write(null); banner.hidden = false; }),
    );
  }
</script>

<style>
  .cookie-banner {
    position: fixed; inset: auto var(--space-3) var(--space-3); z-index: 50;
    max-width: 640px; margin-inline: auto;
    display: grid; gap: var(--space-3); padding: var(--space-5);
    background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .cookie-banner[hidden] { display: none; }
  .cookie-banner p { margin: 0; font-size: var(--text-sm); }
  .cookie-banner__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: flex-end; }
  .cookie-banner__actions .btn { flex: 1 1 120px; }
</style>
```

En `src/layouts/BaseLayout.astro`, importar y añadir justo antes de `</body>`:
```astro
import CookieBanner from '../components/CookieBanner.astro';
...
    <Footer />
    <CookieBanner />
  </body>
```

- [ ] **Step 7: Verificar**

Run: `npm test && npm run check && npm run test:e2e`
Expected: todos PASS (los tests previos pueden necesitar cerrar el banner si tapa elementos: si algún test previo falla por el banner, añadir en ese spec `test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('pg-cookie-consent', 'rejected')); })` — no se desactiva el banner en el código).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add legal pages imported from current site and cookie consent banner"
```

---

### Task 9: Redirecciones de URLs antiguas y suite responsive / enlaces

**Files:**
- Create: `public/equipo.html`, `public/multimedia.html`, `public/contacto.html`, `public/peticion_oferta.html`, `public/privacidad.html`, `public/politica_cookies.html`, `tests/e2e/responsive.spec.ts`, `tests/e2e/redirects.spec.ts`, `tests/e2e/links.spec.ts`

**Interfaces:**
- Consumes: todas las páginas. Rutas: `''`, `equipo/`, `multimedia/`, `contacto/`, `presupuesto/`, `privacidad/`, `cookies/`.

- [ ] **Step 1: Tests que fallan**

`tests/e2e/redirects.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

const legacy: [string, string][] = [
  ['index.html', ''],
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
```

`tests/e2e/responsive.spec.ts`:
```ts
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
```

`tests/e2e/links.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

const pages = ['', 'equipo/', 'multimedia/', 'contacto/', 'presupuesto/', 'privacidad/', 'cookies/'];

test('all internal links and images resolve under the base path', async ({ page, request }) => {
  const targets = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const found = await page.evaluate(() => [
      ...[...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href),
      ...[...document.querySelectorAll('img[src]')].map((i) => (i as HTMLImageElement).src),
    ]);
    for (const u of found) {
      const parsed = new URL(u);
      if (parsed.origin === 'http://localhost:4321') targets.add(parsed.pathname);
    }
  }
  expect(targets.size).toBeGreaterThan(10);
  for (const pathname of targets) {
    expect(pathname.startsWith('/pulidoGestionPage/'), pathname).toBe(true);
    const res = await request.get(pathname);
    expect(res.status(), pathname).toBe(200);
  }
});
```

Run: `npm run test:e2e -- redirects responsive links` → Expected: redirects FAIL (404). Responsive/links pueden pasar o fallar; anotar fallos.

- [ ] **Step 2: Ficheros de redirección**

Para cada par, crear `public/<antiguo>.html` con este contenido (sustituyendo `DESTINO`):

| Fichero | DESTINO |
|---|---|
| `public/equipo.html` | `./equipo/` |
| `public/multimedia.html` | `./multimedia/` |
| `public/contacto.html` | `./contacto/` |
| `public/peticion_oferta.html` | `./presupuesto/` |
| `public/privacidad.html` | `./privacidad/` |
| `public/politica_cookies.html` | `./cookies/` |

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Redirigiendo…</title>
  <meta http-equiv="refresh" content="0; url=DESTINO">
  <script>location.replace('DESTINO' + location.hash);</script>
</head>
<body><p><a href="DESTINO">Continuar</a></p></body>
</html>
```

(`index.html` no necesita redirección: Astro ya genera `dist/index.html`.)

- [ ] **Step 3: Corregir fallos de responsive**

Run: `npm run test:e2e -- redirects responsive links`
Para cada fallo de overflow: localizar el elemento culpable con
`await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.tagName + '.' + e.className))`
y corregirlo en el CSS del componente (p. ej. `min-width: 0`, `max-width: 100%`, `flex-wrap: wrap`). Repetir hasta PASS.

- [ ] **Step 4: Revisión visual**

Abrir con la herramienta Read las capturas `test-results/screens/*-{375,768,1440}.png` de todas las páginas. Comprobar: logo nítido y no deformado; menú hamburguesa en 375 y 768, completo en 1440; hero apilado en móvil y a dos columnas en escritorio; rejillas 1→2→3 columnas; formulario legible; footer y cartel de subvención apilados en móvil; nada solapado ni cortado. Corregir lo que no cumpla y repetir.

- [ ] **Step 5: Suite completa y commit**

Run: `npm test && npm run check && npm run test:e2e` → Expected: todo PASS.

```bash
git add -A
git commit -m "feat: add legacy URL redirects and responsive/link test suites"
```

---

### Task 10: CI/CD, documentación y publicación

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `docs/arquitectura.md`, `docs/contenido.md`, `docs/despliegue.md`, `docs/pendientes.md`
- Modify: `README.md`

- [ ] **Step 1: Workflows**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches-ignore: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run check
      - run: npm test
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: screenshots, path: test-results/screens }
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main, feature/redesign-poc]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with: { node-version: 26 }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Documentación**

`README.md`:
```markdown
# Pulido Gestión — Web

Rediseño (proof of concept) de https://pulidogestion.com/: sitio estático, responsive y accesible construido con Astro.

## Requisitos
- Node 26 (`.nvmrc`)

## Uso
| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en http://localhost:4321/pulidoGestionPage/ |
| `npm run build` | Genera el sitio estático en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run check` | Comprobación de tipos (Astro + TS) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests end-to-end y responsive (Playwright) |
| `npm run brand` | Regenera logo/sello/cartel desde las cabeceras originales |
| `npm run legal` | Reimporta los textos legales desde la web actual |

## Documentación
- [Arquitectura](docs/arquitectura.md)
- [Editar contenido](docs/contenido.md)
- [Despliegue](docs/despliegue.md)
- [Pendientes](docs/pendientes.md)
- [Spec de diseño](docs/superpowers/specs/2026-09-23-pulido-redesign-poc-design.md)
```

`docs/arquitectura.md` — escribir con estas secciones y contenido concreto:
1. **Visión general**: Astro estático; diagrama del árbol de `src/` (copiar de "File Structure" de este plan) con una línea por carpeta.
2. **Principios**: contenido en `src/data` y `src/content`; componentes sin datos de negocio; `url()` obligatorio para enlaces internos (explicar el subpath de GitHub Pages); JS mínimo solo en Header (menú), VideoEmbed (carga al pulsar), QuoteForm (validación), CookieBanner.
3. **Responsive**: breakpoints 640/960/1200, mobile-first, tokens en `tokens.css`, cómo se verifica (`responsive.spec.ts`, capturas en `test-results/screens`).
4. **Cómo añadir una página**: crear `src/pages/x.astro` con `BaseLayout`, añadir a `src/data/nav.ts` si va al menú, añadir la ruta a los arrays `pages` de `tests/e2e/responsive.spec.ts` y `links.spec.ts`.
5. **Privacidad**: GA solo con consentimiento, YouTube `nocookie` al pulsar, fuentes autoalojadas.
6. **Tests**: qué cubre cada fichero de `tests/`.

`docs/contenido.md` — con ejemplos de código:
- Añadir/quitar miembro del equipo (`src/data/team.ts` + foto en `public/img/equipo/`, 450×461 recomendado).
- Añadir vídeo (`src/data/videos.ts`, el `id` es lo que va tras `v=` en YouTube; mantener orden por año descendente).
- Cambiar datos de empresa, email, redes, URL del portal (`src/data/site.ts`).
- Actualizar el cartel de subvención (`src/data/subsidy.ts` + `public/img/subvencion-fse.png`).
- Textos legales (`npm run legal` o editar `src/content/legal/*.html`).

`docs/despliegue.md`:
- GitHub Pages: workflow `deploy.yml`, se publica en push a `main` o `feature/redesign-poc`; URL `https://deadanddani.github.io/pulidoGestionPage/`; requisito: Settings → Pages → Source "GitHub Actions" (o `gh api -X POST repos/deadanddani/pulidoGestionPage/pages -f build_type=workflow`) y, para desplegar desde la rama feature, añadir la rama en Settings → Environments → github-pages. GitHub Pages en repositorio privado requiere plan de pago.
- Dominio propio (`pulidogestion.com`): cambiar `site` a `https://pulidogestion.com` y `base` a `/` en `astro.config.mjs`, añadir `public/CNAME` con `pulidogestion.com`, configurar DNS (registros A de GitHub Pages o CNAME); las redirecciones `.html` ya preservan las URLs antiguas.
- Alternativas (Netlify, Vercel, Cloudflare Pages): build `npm run build`, salida `dist`, `base` a `/`.

`docs/pendientes.md`:
```markdown
# Pendientes

## Formulario de presupuesto (envío real)
Hoy el formulario solo valida en el navegador y muestra un aviso de demostración (`data-demo` en `src/components/QuoteForm.astro`).
Para activarlo:
1. Elegir servicio: Formspree, Web3Forms, Netlify Forms (si se aloja en Netlify) o una función serverless propia.
2. Añadir `action="<endpoint>"` y `method="post"` al `<form>` y quitar `data-demo`.
3. Añadir protección anti-spam (honeypot o captcha del proveedor) y página/mensaje de confirmación.
4. Verificar que el texto de privacidad (`#presup`) cubre el nuevo encargado del tratamiento.

## Contenido a validar con el cliente
- Copy comercial de la home ("por qué trabajar con nosotros", servicios que ofrecen, zona de actuación).
- Texto de las tarjetas de acceso rápido de la home.
- Vigencia del cartel de subvención FSE+ (convocatoria 2024).
- Actualización de textos legales (datan de ~2020) y de la política de cookies (ahora con consentimiento previo).
- Fotos del equipo con mayor resolución y datos de cargo/rol.
- Teléfono de contacto (la web actual no lo publica).

## Técnico
- Dominio propio y migración DNS (ver `despliegue.md`).
- Sitemap automático (`@astrojs/sitemap`) al pasar a dominio propio.
- Logo en SVG vectorial (hoy es un recorte PNG de la cabecera).
```

- [ ] **Step 3: Verificación final completa**

Run: `npm ci && npm run check && npm test && npm run test:e2e && npm run build`
Expected: todo PASS, `dist/` contiene `index.html`, `equipo/index.html`, …, `peticion_oferta.html`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: add CI and GitHub Pages workflows; docs: add project documentation"
```

- [ ] **Step 5: Publicar en GitHub**

```bash
git push -u origin main
git push -u origin feature/redesign-poc
gh api -X POST repos/deadanddani/pulidoGestionPage/pages -f build_type=workflow
gh api -X POST repos/deadanddani/pulidoGestionPage/environments/github-pages/deployment-branch-policies -f name=feature/redesign-poc
```

Si la creación de Pages falla por repositorio privado sin plan compatible, **no** cambiar la visibilidad del repo: parar e informar al usuario con las opciones (hacer público el repo, o desplegar en Netlify/Cloudflare Pages con `base: '/'`).

Si Pages se crea: relanzar el deploy (`gh workflow run deploy.yml --ref feature/redesign-poc`), esperar (`gh run watch`) y comprobar que `https://deadanddani.github.io/pulidoGestionPage/` responde 200 (`curl -sI`). Comprobar que el workflow CI pasa en la rama (`gh run list --branch feature/redesign-poc`).
