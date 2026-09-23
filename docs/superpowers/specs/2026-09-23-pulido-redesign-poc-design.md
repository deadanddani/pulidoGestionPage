# Rediseño web Pulido Gestión — Proof of Concept

**Fecha:** 2026-09-23 · **Rama:** `feature/redesign-poc` · **Estado:** spec aprobada

## 1. Objetivo

Construir una réplica renovada y 100 % estática de https://pulidogestion.com/ para presentársela a
Pulido Gestión de Fincas S.L. como propuesta de rediseño de pago.

**Criterios de éxito**

- Mismas páginas, funcionalidades, imágenes y textos que la web actual (sin inventar contenido).
- Imagen de marca reconocible: logo original, azul `#0055FF`, sello "Administrador Fincas Colegiado".
- Estilo actual, responsive (móvil primero) y accesible.
- Desplegado públicamente en GitHub Pages desde GitHub Actions.
- Arquitectura que permita crecer (formulario real, blog, CMS) sin reescribir.
- Documentación en `docs/`.

**Fuera de alcance del PoC**

- Envío real del formulario de presupuesto (queda **pendiente documentado**, ver §7).
- Copy nuevo de marketing: se proponen huecos en la documentación, no se publica.
- Dominio propio / migración DNS.

## 2. Inventario de la web actual

| URL actual | Contenido |
|---|---|
| `index.html` | Cabecera (logo + sello + cartel subvención FSE+), titular "Por Qué Trabajar con Nosotros...", vídeo YouTube `Yzf-VKOsBLM`, enlaces LinkedIn (`linkedin.com/in/ricardopulidosimon`) y YouTube (canal `UCqdHdQcbg-mp7n_whZ2N9GA`), enlace "Acceso a Gestiones en su Comunidad" → `https://portalpropietarios.es/`, menú a 4 secciones |
| `equipo.html` | 5 miembros con foto: María Dolores Rodrigo López (`dolores.jpg`), María Prado Poves Martínez (`prado.jpg`), Margarita de Gorostiza Castro (`margarita.jpg`), Jaime Bandrés Lopera (`jaime.jpg`), Pablo Sheikha García (`pablo.jpg`) |
| `multimedia.html` | 8 vídeos YouTube: GBC España 2019 (`38ltWMv22JM`), Elecciones CAFMadrid 2018 (`E5WCDOEskkM`), Entrevista Ricardo Pulido EOI 2016 (`7lGp3FzKPdk`), Elecciones CAFMadrid 2015 (`iXlKA-J_GPk`), Jornada Repartidores de Costes 2015 (`I2yr_nexLf0`), IFEMA 2014 Rehabilitación Energética (`NAcYbmBpC9Y`), RIEd 2013 Caldera Gasóleo a Biomasa (`AyXIVbL64uA`), Propuesta Financiación Comunidades 2013 (`Hfj6oztq0Ts`) |
| `contacto.html` | Imagen `mapa.png` enlazada a Google Maps (C/ Linares 2, 28804 Alcalá de Henares) |
| `peticion_oferta.html` | Formulario → `enviar.php`: Nombre y apellidos*, Dirección finca*, Código postal*, Teléfonos*, Email*, Nº viviendas, Nº locales, Nº naves, Nº plazas de garaje, checkbox aceptación privacidad* |
| `privacidad.html` | Texto legal (aviso legal + protección de datos), ancla `#presup` |
| `politica_cookies.html` | Texto legal de cookies |

**Datos de empresa** (del aviso legal): Pulido Gestión de Fincas S.L. · CIF B82302365 · Linares 2, Local 10 A,
28804 Alcalá de Henares (Madrid) · fincas@pulidogestion.com.

**Extras actuales:** banner de cookies (cookieconsent), Google Analytics `G-VEZ300TBPB`, `sitemap.xml`, `favicon.ico`.

**Subvención (publicidad obligatoria):** Programa de fomento de la contratación — FSE+, Estímulo a la contratación de
jóvenes. Línea 2: Contratación estable de personas jóvenes. Convocatoria 2024. Importe concedido 5.500,00 €.
Expediente 09-GCE1-02365.0/2024. Ayuda del FSE+: 40 %. Logos: Comunidad de Madrid (Consejería de Economía, Empleo y
Competitividad), Cofinanciado por la Unión Europea, Fondos Europeos.

## 3. Stack y hosting

- **Astro** (salida estática, 0 JS por defecto) + **TypeScript**.
- CSS propio con custom properties (sin framework CSS).
- **GitHub Pages** vía GitHub Actions (`withastro/action`). Migrable a Netlify/Vercel/Cloudflare sin cambios de código.
- `site`/`base` configurados en `astro.config.mjs` para el subpath de GitHub Pages (`/pulidoGestionPage/`); todos los
  enlaces internos se construyen con un helper que respeta `base`.

## 4. Arquitectura

```
src/
├── layouts/BaseLayout.astro   # <head> (SEO, OG, favicon), Header, Footer, CookieBanner
├── components/
│   ├── Header.astro           # logo + navegación + CTA presupuesto; menú móvil
│   ├── Footer.astro           # datos empresa, legales, redes, SubsidyNotice
│   ├── SubsidyNotice.astro    # bloque FSE+ (logos + datos expediente)
│   ├── VideoEmbed.astro       # miniatura → iframe youtube-nocookie al pulsar
│   ├── TeamCard.astro
│   ├── QuoteForm.astro        # formulario + validación cliente (sin envío)
│   └── CookieBanner.astro     # consentimiento; carga GA solo si se acepta
├── data/
│   ├── site.ts                # empresa, contacto, redes, analytics id, portal URL
│   ├── nav.ts                 # entradas de menú
│   ├── team.ts                # miembros del equipo
│   ├── videos.ts              # vídeos multimedia + vídeo principal
│   └── subsidy.ts             # datos de la subvención
├── pages/
│   ├── index.astro
│   ├── equipo.astro
│   ├── multimedia.astro
│   ├── contacto.astro
│   ├── presupuesto.astro
│   ├── privacidad.astro
│   └── cookies.astro
├── lib/url.ts                 # helper de enlaces con base
└── styles/{tokens.css,global.css}
public/img/                    # imágenes originales optimizadas + logo recortado
docs/                          # documentación del proyecto
.github/workflows/deploy.yml
```

**Principios**

- Contenido de negocio solo en `src/data/` (tipado). Las páginas componen componentes; los componentes no contienen datos
  de negocio en duro.
- Un componente = una responsabilidad; props tipadas.
- Rutas limpias (`/equipo/`…) y **redirecciones** desde las URLs antiguas (`index.html`, `equipo.html`, `multimedia.html`,
  `contacto.html`, `peticion_oferta.html`, `privacidad.html`, `politica_cookies.html`) vía ficheros estáticos en `public/` con meta-refresh relativo, para
  preservar enlaces y SEO.

## 5. Páginas

- **Inicio:** hero con logo, titular basado en la meta-descripción real ("Gestionamos y administramos Comunidades de
  Propietarios, residenciales o industriales"), CTA "Solicitar presupuesto" y botón destacado "Acceso a gestiones en su
  comunidad" (portalpropietarios.es, pestaña nueva). Sección "¿Por qué trabajar con nosotros?" con el vídeo principal.
  Accesos a Equipo, Multimedia, Dónde estamos, Presupuesto. Enlaces a LinkedIn y YouTube.
- **Equipo:** rejilla responsive de 5 `TeamCard` con foto y nombre.
- **Multimedia:** rejilla de 8 `VideoEmbed` con título; ordenados del más reciente al más antiguo.
- **Dónde estamos:** `mapa.png` enlazada a Google Maps + dirección y email en texto.
- **Presupuesto:** `QuoteForm` con los mismos campos y obligatoriedad; campos numéricos como `type="number" min="0"`;
  enlace a `privacidad#presup`; botones Enviar y Borrar. Al enviar un formulario válido muestra un aviso
  "Formulario de demostración: aún no se envían datos".
- **Privacidad / Cookies:** textos íntegros de la web actual, con jerarquía de títulos y ancla `#presup` preservada.

## 6. Marca y diseño visual

Dirección: **profesional cercano**.

- Logo: recorte de la cabecera original (trazo "P" + "Pulido Gestión de Fincas") a PNG transparente; sello "Administrador
  Fincas Colegiado" recortado aparte y mostrado en header/footer.
- Paleta: azul marca `#0055FF` (primario), azul claro del trazo (secundario), fondo claro cálido, texto gris muy oscuro.
  Contraste AA verificado.
- Tipografía: serif elegante para titulares, sans-serif legible para texto (autoalojadas con @fontsource-variable: Source Serif 4 y
  Source Sans 3, con fallbacks del sistema).
- Footer común con datos de empresa, legales, redes y `SubsidyNotice` (logos recortados de la cabecera original + texto
  del expediente).
- Accesibilidad: HTML semántico, `alt` en imágenes, foco visible, navegación por teclado del menú móvil,
  `prefers-reduced-motion`.

### 6.1 Responsive (requisito crítico)

- Mobile-first: estilos base para móvil, ampliación con `min-width` en breakpoints `640px`, `960px`, `1200px`.
- Sin scroll horizontal en ningún ancho ≥ 320px.
- Header: menú hamburguesa accesible por debajo de 960px; navegación completa por encima.
- Rejillas con CSS Grid `auto-fit/minmax`: equipo y vídeos 1 columna (móvil) → 2 → 3.
- Hero: una columna en móvil (texto, CTAs, vídeo apilados); dos columnas en escritorio.
- Formulario: campos a ancho completo en móvil; pares de campos en 2 columnas desde 640px; objetivos táctiles ≥ 44px.
- Footer y bloque de subvención apilados en móvil; logos escalan con `max-width: 100%`.
- Imágenes y vídeos con `aspect-ratio` y `max-width: 100%`; tipografía fluida con `clamp()`.
- Verificación visual obligatoria en 375px, 768px y 1440px de todas las páginas.

## 7. Pendientes documentados (`docs/pendientes.md`)

- **Formulario real:** opciones Formspree / Web3Forms / Netlify Forms / función serverless; el componente expone un
  único punto (`action`) para activarlo.
- Copy propuesto para la home ("por qué nosotros", servicios) a validar con el cliente.
- Dominio `pulidogestion.com` y migración de DNS.
- Revisar vigencia de textos legales y del cartel de subvención.
- Fotos del equipo: revisar resolución original.

## 8. Documentación (`docs/`)

- `README.md` (raíz): qué es, cómo arrancar, scripts.
- `docs/arquitectura.md`: estructura, principios, cómo añadir una página/componente.
- `docs/contenido.md`: cómo editar equipo, vídeos, datos de empresa.
- `docs/despliegue.md`: GitHub Pages, cambio a dominio propio u otro host.
- `docs/pendientes.md`: §7.

## 9. Verificación

- `astro check` y `astro build` sin errores (local y en CI).
- Comprobación de enlaces internos del build y de las redirecciones `.html`.
- Revisión visual (capturas) en 375px, 768px y 1440px de todas las páginas, sin scroll horizontal.
- Validación manual del formulario (campos obligatorios, email, checkbox).
