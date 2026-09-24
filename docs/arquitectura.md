# Arquitectura

## Visión general

Sitio 100 % estático generado con [Astro](https://astro.build). No hay backend: `npm run build` produce HTML, CSS y
unas pocas líneas de JS en `dist/`, que se sirve desde cualquier hosting estático (hoy GitHub Pages).

```
src/
├── layouts/BaseLayout.astro   # <head> (SEO, Open Graph, favicon), Header, Footer, CookieBanner
├── components/                # Piezas de UI con una sola responsabilidad
│   ├── Header.astro           # logo + navegación + menú móvil
│   ├── Footer.astro           # datos de empresa, enlaces legales, redes, SubsidyNotice
│   ├── SubsidyNotice.astro    # cartel FSE+ (publicidad obligatoria de la subvención)
│   ├── VideoEmbed.astro       # miniatura de YouTube → iframe al pulsar
│   ├── TeamCard.astro         # tarjeta de miembro del equipo
│   ├── QuoteForm.astro        # formulario de presupuesto (validación en cliente, modo demo)
│   └── CookieBanner.astro     # consentimiento de cookies; carga Analytics solo si se acepta
├── data/                      # Contenido de negocio tipado (única fuente de verdad)
│   ├── site.ts                # empresa, dirección, email, redes, portal, id de Analytics
│   ├── nav.ts                 # menú principal
│   ├── team.ts                # equipo
│   ├── videos.ts              # vídeos (destacado + multimedia)
│   └── subsidy.ts             # datos de la subvención
├── content/legal/             # Textos legales (HTML limpio importado de la web actual)
├── lib/                       # Lógica pura, probada con Vitest
│   ├── url.ts                 # url(): enlaces internos respetando `base`
│   ├── quote-form.ts          # validateQuote(): reglas del formulario
│   └── legal-transform.ts     # transformLegalHtml(): limpia el HTML legal antiguo
├── pages/                     # Una ruta por fichero (/, /equipo/, /multimedia/, …)
└── styles/                    # tokens.css (colores, tipografía, espaciado) + global.css
public/                        # Imágenes, favicon, robots.txt y redirecciones de URLs antiguas (*.html)
scripts/                       # crop-brand.mjs (recortes de marca) e import-legal.mjs (textos legales)
tests/unit/                    # Vitest
tests/e2e/                     # Playwright
```

## Principios

- **El contenido vive en `src/data/` y `src/content/`.** Los componentes y páginas no contienen datos de negocio en
  duro: cambiar un email, un vídeo o una persona del equipo es editar un fichero de datos.
- **Un componente, una responsabilidad**, con props tipadas.
- **`url()` es obligatorio para enlaces internos.** En GitHub Pages el sitio se sirve bajo el subpath
  `/pulidoGestionPage/`; `url('equipo/')` devuelve `/pulidoGestionPage/equipo/`. Al pasar a dominio propio basta con
  cambiar `base` en `astro.config.mjs`.
- **JS mínimo**, solo donde aporta: menú móvil (Header), carga de vídeo al pulsar (VideoEmbed), validación
  (QuoteForm) y consentimiento de cookies (CookieBanner).
- **Las URLs antiguas siguen funcionando**: `public/equipo.html`, `peticion_oferta.html`, etc. redirigen a las rutas
  nuevas conservando el ancla (`privacidad.html#presup` → `privacidad/#presup`).

## Responsive

- Mobile-first: estilos base para móvil; `min-width` en 640px, 960px y 1200px.
- Tokens de diseño en `src/styles/tokens.css`; tipografía fluida con `clamp()`.
- Rejillas con `auto-fit/minmax` (1 → 2 → 3 columnas), objetivos táctiles ≥ 44px, `overflow-wrap: anywhere` para
  textos largos (URLs, emails).
- Verificación: `tests/e2e/responsive.spec.ts` comprueba que no hay scroll horizontal en todas las páginas a 320, 375,
  768 y 1440px, y genera capturas en `test-results/screens/` para revisión visual.

## Cómo añadir una página

1. Crear `src/pages/mi-pagina.astro` usando `BaseLayout` (`title`, y `current` si está en el menú).
2. Si debe aparecer en el menú, añadirla a `src/data/nav.ts` (`href: 'mi-pagina/'`).
3. Añadir `'mi-pagina/'` a los arrays `pages` de `tests/e2e/responsive.spec.ts` y `tests/e2e/links.spec.ts`.
4. `npm run check && npm test && npm run test:e2e`.

## Privacidad

- Google Analytics (`G-VEZ300TBPB`) solo se carga tras aceptar cookies; el pie incluye "Preferencias de cookies" para
  revocar.
- Los vídeos usan `youtube-nocookie.com` y no se cargan hasta pulsar.
- Las fuentes están autoalojadas (`@fontsource-variable`): no se envían datos a Google Fonts.

## Tests

| Fichero | Qué cubre |
|---|---|
| `tests/unit/url.test.ts` | Construcción de enlaces con `base` |
| `tests/unit/data.test.ts` | Datos reales de empresa, 5 miembros con foto, 8 vídeos, subvención |
| `tests/unit/quote-form.test.ts` | Reglas del formulario (CP, teléfono, email, números) |
| `tests/unit/legal-transform.test.ts` | Limpieza del HTML legal antiguo (títulos, listas, `#presup`) |
| `tests/e2e/layout.spec.ts` | Menú escritorio/móvil, teclado, logo legible, datos del pie |
| `tests/e2e/home.spec.ts` | Accesos de la home (portal, presupuesto, vídeo, redes) |
| `tests/e2e/pages.spec.ts` | Equipo, Multimedia (vídeo al pulsar), Dónde estamos |
| `tests/e2e/quote.spec.ts` | Validación, modo demo sin envío, layout del formulario |
| `tests/e2e/legal-cookies.spec.ts` | Páginas legales y consentimiento de cookies |
| `tests/e2e/redirects.spec.ts` | URLs antiguas `.html` |
| `tests/e2e/responsive.spec.ts` | Sin scroll horizontal (320–1440px), rejillas, capturas |
| `tests/e2e/links.spec.ts` | Todos los enlaces e imágenes internos responden 200 bajo la base |
