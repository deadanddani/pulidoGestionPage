import { JSDOM } from 'jsdom';

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const DROP = new Set(['head', 'title', 'meta', 'link', 'header', 'footer', 'script', 'style', 'img', 'nav', 'noscript']);
/** Contenedores de maquetación: se aplanan y el contenido inline suelto se agrupa en <p>. */
const CONTAINERS = new Set(['html', 'body', 'div', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'center', 'section', 'article']);
/** Bloques que cortan un párrafo. */
const BLOCKS = new Set(['p', 'ul', 'ol', ...CONTAINERS]);
const INLINE_KEEP: Record<string, string> = { b: 'strong', strong: 'strong', i: 'em', em: 'em' };
const BLOCK_SELECTOR = [...BLOCKS].join(',');

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const children = (n: Node) => Array.from(n.childNodes);
const tagOf = (n: Node) => (n.nodeType === ELEMENT_NODE ? (n as Element).tagName.toLowerCase() : '');
const isBlock = (n: Node) => BLOCKS.has(tagOf(n));
const isDropped = (n: Node) => DROP.has(tagOf(n)) || (n.nodeType === ELEMENT_NODE && (n as Element).classList.contains('titular_2'));
const textOf = (nodes: Node[]) => nodes.map((n) => n.textContent ?? '').join('').replace(/\s+/g, ' ').trim();
const isBr = (n: Node) => tagOf(n) === 'br';
const isBlank = (n: Node) => n.nodeType === TEXT_NODE && !(n.textContent ?? '').trim();

function fontSizePt(el: Element): number {
  const m = (el.getAttribute('style') ?? '').match(/font-size:\s*([\d.]+)pt/i);
  return m ? Number(m[1]) : 0;
}

function boldText(nodes: Node[]): string {
  return nodes
    .map((n) => {
      if (n.nodeType !== ELEMENT_NODE) return '';
      const el = n as Element;
      return ['b', 'strong'].includes(tagOf(el))
        ? el.textContent ?? ''
        : Array.from(el.querySelectorAll('b, strong')).map((b) => b.textContent ?? '').join('');
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAllBold(nodes: Node[]): boolean {
  const text = textOf(nodes);
  return !!text && text.length <= 160 && boldText(nodes) === text;
}

/** Renderiza contenido inline (texto, negritas, enlaces, <br>); aplana cualquier otra etiqueta. */
function renderInline(node: Node): string {
  if (node.nodeType === TEXT_NODE) return escape(node.textContent ?? '');
  if (node.nodeType !== ELEMENT_NODE || isDropped(node)) return '';
  const el = node as Element;
  const tag = tagOf(el);
  const inner = children(el).map(renderInline).join('');
  if (tag === 'br') return '<br>';
  if (INLINE_KEEP[tag]) return `<${INLINE_KEEP[tag]}>${inner}</${INLINE_KEEP[tag]}>`;
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    return !href || href.startsWith('javascript:') ? inner : `<a href="${href}">${inner}</a>`;
  }
  return inner;
}

/** Párrafo (o título si todo es negrita) a partir de una secuencia de nodos inline. */
function paragraph(nodes: Node[], source?: Element): string {
  if (!textOf(nodes)) return '';
  const id = source?.getAttribute('id');
  const idAttr = id ? ` id="${id}"` : '';
  if (isAllBold(nodes)) {
    const heading = source && fontSizePt(source) >= 20 ? 'h2' : 'h3';
    return `<${heading}${idAttr}>${escape(textOf(nodes))}</${heading}>`;
  }
  return `<p${idAttr}>${nodes.map(renderInline).join('')}</p>`;
}

/** Inline con significado que se conserva; el resto (span, font…) es transparente. */
const isSemanticInline = (n: Node) => !!INLINE_KEEP[tagOf(n)] || tagOf(n) === 'a' || isBr(n);

/**
 * Sustituye por sus hijos los inline sin significado (span, font…) y los que contienen bloques,
 * para que los <br> y bloques que envuelven queden al nivel donde se agrupan los párrafos.
 */
function unwrapInline(nodes: Node[]): Node[] {
  return nodes.flatMap((n) =>
    n.nodeType === ELEMENT_NODE && !isBlock(n) && !isDropped(n) &&
    (!isSemanticInline(n) || (n as Element).querySelector(BLOCK_SELECTOR))
      ? unwrapInline(children(n))
      : [n],
  );
}

/** Divide una secuencia inline en párrafos en cada doble <br> (separación de párrafos del HTML original). */
function paragraphs(nodes: Node[], source?: Element): string {
  const chunks: Node[][] = [[]];
  for (let i = 0; i < nodes.length; i++) {
    if (isBr(nodes[i])) {
      let j = i + 1;
      while (j < nodes.length && isBlank(nodes[j])) j++;
      if (j < nodes.length && isBr(nodes[j])) {
        while (j + 1 < nodes.length && (isBr(nodes[j + 1]) || isBlank(nodes[j + 1]))) j++;
        chunks.push([]);
        i = j;
        continue;
      }
    }
    chunks[chunks.length - 1].push(nodes[i]);
  }
  return chunks.map((c, i) => paragraph(c, i === 0 ? source : undefined)).join('');
}

/** Recorre hijos de un bloque agrupando las secuencias inline en párrafos. */
function renderChildren(nodes: Node[]): string {
  let out = '';
  let run: Node[] = [];
  const flush = () => { out += paragraphs(run); run = []; };
  for (const n of unwrapInline(nodes)) {
    if (isBlock(n) || isDropped(n)) { flush(); out += renderBlock(n); }
    else run.push(n);
  }
  flush();
  return out;
}

function renderBlock(node: Node): string {
  if (isDropped(node)) return '';
  const el = node as Element;
  const tag = tagOf(el);
  if (tag === 'p') {
    const kids = unwrapInline(children(el));
    const split = kids.findIndex(isBlock);
    const own = split === -1 ? kids : kids.slice(0, split);
    const rest = split === -1 ? '' : renderChildren(kids.slice(split));
    return paragraphs(own, el) + rest;
  }
  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(el.children)
      .filter((li) => tagOf(li) === 'li')
      .map((li) => `<li>${children(li).map(renderInline).join('')}</li>`)
      .join('');
    return `<${tag}>${items}</${tag}>`;
  }
  return renderChildren(children(el));
}

/** Convierte una página legal antigua en un fragmento HTML semántico y limpio. */
export function transformLegalHtml(html: string): string {
  const { document } = new JSDOM(html).window;
  return renderChildren(children(document.body))
    .replace(/\s+/g, ' ')
    .replace(/<(p|li|h2|h3)( id="[^"]*")?>(\s|<br>)+/g, '<$1$2>')
    .replace(/(\s|<br>)+<\/(p|li|h2|h3|a|strong|em)>/g, '</$2>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/>\s+<(\/?)(p|ul|ol|li|h2|h3)\b/g, '><$1$2')
    .trim();
}
