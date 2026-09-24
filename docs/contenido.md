# Editar contenido

Todo el contenido está en ficheros de datos; no hace falta tocar componentes.
Después de cualquier cambio: `npm test && npm run test:e2e`.

## Equipo — `src/data/team.ts`

Añadir la foto a `public/img/equipo/` (cuadrada o casi, p. ej. 450×461) y una línea:

```ts
export const team: TeamMember[] = [
  // …
  { name: 'Nombre Apellido Apellido', photo: 'img/equipo/nombre.jpg' },
];
```

Para quitar a alguien, borrar su línea (y su foto). Si cambia el número de personas, actualizar el `toHaveLength(5)`
de `tests/unit/data.test.ts` y `tests/e2e/pages.spec.ts`.

## Vídeos — `src/data/videos.ts`

El `id` es lo que va después de `v=` en la URL de YouTube (`https://www.youtube.com/watch?v=38ltWMv22JM` →
`38ltWMv22JM`). Mantener el orden del más reciente al más antiguo:

```ts
export const videos: Video[] = [
  { id: 'NUEVO_ID', title: 'Título del vídeo 2026', year: 2026 },
  // …
];
```

El vídeo de la home es `featuredVideo`.

## Datos de empresa — `src/data/site.ts`

Nombre, CIF, dirección, email, enlace de Google Maps, URL del portal de propietarios (`portalUrl`), id de Analytics y
redes sociales. Se usan en cabecera, pie, home y "Dónde estamos".

## Cartel de subvención — `src/data/subsidy.ts`

Textos (`lines`) y la imagen `public/img/subvencion-fse.png`. Si cambia la convocatoria, sustituir la imagen y los
textos. La imagen se recortó de la cabecera original con `npm run brand`, que necesita las cabeceras en
`scripts/.cache/`:

```bash
mkdir -p scripts/.cache
curl -sfL -o scripts/.cache/cabecera.png https://pulidogestion.com/img/cabecera_pulido_1280.png
curl -sfL -o scripts/.cache/cabecera_comunidad.png https://pulidogestion.com/img/cabecera_pulido_1280_comunidad.png
npm run brand
```

## Textos legales — `src/content/legal/*.html`

Se importaron tal cual de la web actual con `npm run legal` (descarga y limpia el HTML). Para cambiar un texto se
puede editar directamente el `.html` (solo etiquetas `h2`, `h3`, `p`, `ul`, `li`, `strong`, `em`, `a`). El título de la
sección del formulario debe conservar `id="presup"` (lo enlaza el checkbox de privacidad).
