export const site = {
  name: 'Pulido Gestión',
  legalName: 'Pulido Gestión de Fincas S.L.',
  cif: 'B82302365',
  tagline: 'Administración de Fincas. Gestoría.',
  description:
    'Gestionamos y administramos Comunidades de Propietarios, residenciales o industriales.',
  address: {
    street: 'C/ Linares 2, Local 10 A',
    postalCode: '28804',
    city: 'Alcalá de Henares',
    region: 'Madrid',
  },
  email: 'fincas@pulidogestion.com',
  mapsUrl:
    'https://www.google.com/maps/place/Calle+Linares,+2,+28804+Alcal%C3%A1+de+Henares,+Madrid/@40.4876032,-3.3471094,18z',
  portalUrl: 'https://portalpropietarios.es/',
  analyticsId: 'G-VEZ300TBPB',
  /** false mientras sea una demo en github.io: evita competir en Google con pulidogestion.com. */
  indexable: false,
  social: {
    linkedin: 'https://www.linkedin.com/in/ricardopulidosimon/detail/recent-activity/',
    youtube: 'https://www.youtube.com/channel/UCqdHdQcbg-mp7n_whZ2N9GA',
  },
} as const;
