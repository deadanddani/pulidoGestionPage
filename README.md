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
| `npm run test:e2e` | Tests end-to-end y responsive (Playwright, puerto 4329) |
| `npm run brand` | Regenera logo/sello/cartel desde las cabeceras originales |
| `npm run legal` | Reimporta los textos legales desde la web actual |

> `npm run brand` necesita las cabeceras originales en `scripts/.cache/` (ver [docs/contenido.md](docs/contenido.md)).

## Documentación
- [Arquitectura](docs/arquitectura.md)
- [Editar contenido](docs/contenido.md)
- [Despliegue](docs/despliegue.md)
- [Pendientes](docs/pendientes.md)
- [Spec de diseño](docs/superpowers/specs/2026-09-23-pulido-redesign-poc-design.md)
