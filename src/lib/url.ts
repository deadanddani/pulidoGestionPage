const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Construye una URL interna respetando `base` (despliegue en subpath). */
export function url(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return `${base}/${clean}`;
}
