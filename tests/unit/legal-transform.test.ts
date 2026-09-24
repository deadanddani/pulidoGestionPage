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

  it('drops the doctype and wraps loose text between headings in paragraphs', () => {
    const html = `<!DOCTYPE html>\n<html><head><title>x</title></head><body><div>
<p style="font-size:24.5pt"><b>Redes Sociales</b></p> <br><br> Texto suelto <b>importante</b> aquí.<br><br>
<p>Siguiente.</p></div></body></html>`;
    const result = transformLegalHtml(html);
    expect(result).not.toMatch(/DOCTYPE|<title|<br>/i);
    expect(result).toBe('<h2>Redes Sociales</h2><p>Texto suelto <strong>importante</strong> aquí.</p><p>Siguiente.</p>');
  });

  it('unwraps unclosed spans around blocks and splits double <br> into paragraphs', () => {
    const html = `<body><div><p class=Default><span style="x">Uno.<br><br> Dos:<br><br></p>
<ul><li>Punto</li></ul><p><a href="mailto:a@b.es">a@b.es<br><br></a></p></div></body>`;
    expect(transformLegalHtml(html)).toBe('<p>Uno.</p><p>Dos:</p><ul><li>Punto</li></ul><p><a href="mailto:a@b.es">a@b.es</a></p>');
    const nested = `<body><p><span>Lista:<br><br><ul><li>Punto</li></ul></span></p></body>`;
    expect(transformLegalHtml(nested)).toBe('<p>Lista:</p><ul><li>Punto</li></ul>');
  });

  it('keeps lists whose items leave spans unclosed (real legal page markup)', () => {
    const html = `<body><table><tr><td colspan="3"><div>
<p class=Default><span style="x">Esta responsabilidad se extenderá a:<br><br></p>
<ul style="padding-left: 40px;"><li><span>La veracidad.</span></li><li><span>El uso.<span><br><br></li></ul>
<p class=Default><span style="color:#7e7e7e"><b>Política de enlaces</b><br><br></span></div></td></tr></table></body>`;
    expect(transformLegalHtml(html)).toBe(
      '<p>Esta responsabilidad se extenderá a:</p><ul><li>La veracidad.</li><li>El uso.</li></ul><h3>Política de enlaces</h3>',
    );
  });
});
