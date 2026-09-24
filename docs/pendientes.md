# Pendientes

## Formulario de presupuesto (envío real)

Hoy el formulario solo valida en el navegador y muestra un aviso de demostración (`data-demo` en
`src/components/QuoteForm.astro`). Para activarlo:

1. Elegir servicio: Formspree, Web3Forms, Netlify Forms (si se aloja en Netlify) o una función serverless propia.
2. Añadir `action="<endpoint>"` y `method="post"` al `<form>` y quitar `data-demo`.
3. Añadir protección anti-spam (honeypot o captcha del proveedor) y página/mensaje de confirmación.
4. Verificar que el texto de privacidad (`#presup`) cubre el nuevo encargado del tratamiento.
5. Actualizar el test `valid submission shows demo notice without sending data` de `tests/e2e/quote.spec.ts`.

## Contenido a validar con el cliente

- Copy comercial de la home ("por qué trabajar con nosotros", servicios que ofrecen, zona de actuación).
- Texto de las tarjetas de acceso rápido de la home.
- Vigencia del cartel de subvención FSE+ (convocatoria 2024).
- Actualización de textos legales (datan de ~2020) y de la política de cookies (ahora con consentimiento previo).
  La política de privacidad original contiene la errata "legiS.L.ación" (por "legislación"); se ha mantenido literal.
- Fotos del equipo con mayor resolución y datos de cargo/rol.
- Teléfono de contacto (la web actual no lo publica).

## Técnico

- Dominio propio y migración DNS (ver `despliegue.md`).
- Sitemap automático (`@astrojs/sitemap`) al pasar a dominio propio.
- Logo en SVG vectorial (hoy son recortes PNG de la cabecera original).
