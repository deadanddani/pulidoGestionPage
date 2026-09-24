# Despliegue

## GitHub Pages (actual)

- Workflow: `.github/workflows/deploy.yml` (acción oficial `withastro/action`).
- Se publica en cada push a `main` o `feature/redesign-poc`, o a mano desde Actions → "Deploy to GitHub Pages" →
  Run workflow.
- URL: https://deadanddani.github.io/pulidoGestionPage/
- Configuración necesaria (ya hecha):
  - Settings → Pages → Source: **GitHub Actions**
    (`gh api -X POST repos/deadanddani/pulidoGestionPage/pages -f build_type=workflow`).
  - Para publicar desde la rama feature: Settings → Environments → `github-pages` → añadir `feature/redesign-poc` a las
    ramas permitidas.
  - GitHub Pages gratis requiere repositorio público (en privado hace falta GitHub Pro/Team).
- `.github/workflows/ci.yml` ejecuta type check, tests unitarios y e2e en cada push a ramas que no son `main` y en
  cada PR, y guarda las capturas responsive como artefacto.

## Dominio propio (`pulidogestion.com`)

1. En `astro.config.mjs`: `site: 'https://pulidogestion.com'` y `base: '/'`.
2. Crear `public/CNAME` con el contenido `pulidogestion.com`.
3. En el proveedor DNS: registros `A` del apex a las IPs de GitHub Pages (185.199.108.153, 185.199.109.153,
   185.199.110.153, 185.199.111.153) y `CNAME` de `www` a `deadanddani.github.io`.
4. Settings → Pages → Custom domain → `pulidogestion.com` y activar "Enforce HTTPS".
5. Actualizar `baseURL` en `playwright.config.ts` y las comprobaciones de `/pulidoGestionPage/` en los tests.

Las redirecciones `public/*.html` mantienen funcionando las URLs antiguas (`peticion_oferta.html`, etc.) tras la
migración.

## Alternativas (Netlify, Vercel, Cloudflare Pages)

- Comando de build: `npm run build` · Directorio de salida: `dist` · Node 26.
- Cambiar `base` a `/` en `astro.config.mjs` (sirven en la raíz del dominio).
- En Netlify, activar Netlify Forms es una vía directa para el formulario real (ver `pendientes.md`).
