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
