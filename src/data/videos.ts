export interface Video {
  id: string;
  title: string;
  year: number;
}

export const featuredVideo: Video = {
  id: 'Yzf-VKOsBLM',
  title: 'Por qué trabajar con nosotros',
  year: 2020,
};

export const videos: Video[] = [
  { id: '38ltWMv22JM', title: 'Propuestas en GBC España 2019', year: 2019 },
  { id: 'E5WCDOEskkM', title: 'Propuestas Elecciones CAFMadrid 2018', year: 2018 },
  { id: '7lGp3FzKPdk', title: 'Entrevista a Ricardo Pulido en EOI 2016', year: 2016 },
  { id: 'iXlKA-J_GPk', title: 'Propuestas Elecciones CAFMadrid 2015', year: 2015 },
  { id: 'I2yr_nexLf0', title: 'Jornada Repartidores de Costes 2015', year: 2015 },
  { id: 'NAcYbmBpC9Y', title: 'IFEMA 2014. Los AAFF ante la Rehabilitación Energética', year: 2014 },
  { id: 'AyXIVbL64uA', title: 'RIEd 2013. Transformación Caldera Gasóleo a Biomasa', year: 2013 },
  { id: 'Hfj6oztq0Ts', title: 'Propuesta Financiación para Comunidades 2013', year: 2013 },
];
