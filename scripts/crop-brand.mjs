// Recorta logo, sello colegiado y cartel de subvención de las cabeceras originales.
import sharp from 'sharp';

const cache = 'scripts/.cache';
const out = 'public/img';

const crops = [
  // cabecera.png: 1240x250. Logo "P" + "Pulido Gestión de Fincas" a la izquierda.
  { src: 'cabecera.png', dest: 'logo.png', region: { left: 0, top: 0, width: 300, height: 250 } },
  // Sello "Administrador Fincas Colegiado" a la derecha.
  { src: 'cabecera.png', dest: 'sello-colegiado.png', region: { left: 880, top: 80, width: 230, height: 90 } },
  // cabecera_comunidad.png: 1240x310. Bloque de subvención FSE+ (texto, logos y recuadro rojo).
  { src: 'cabecera_comunidad.png', dest: 'subvencion-fse.png', region: { left: 740, top: 0, width: 500, height: 310 } },
];

for (const { src, dest, region } of crops) {
  // extract y trim en pipelines separados: sharp aplica trim antes que extract si se encadenan.
  const cropped = await sharp(`${cache}/${src}`).extract(region).png().toBuffer();
  const info = await sharp(cropped).trim({ threshold: 10 }).png().toFile(`${out}/${dest}`);
  console.log(`${dest}: ${info.width}x${info.height}`);
}
