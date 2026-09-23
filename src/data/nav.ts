export interface NavItem {
  label: string;
  href: string;
}

export const nav: NavItem[] = [
  { label: 'Nuestro Equipo', href: 'equipo/' },
  { label: 'Área Multimedia', href: 'multimedia/' },
  { label: 'Dónde Estamos', href: 'contacto/' },
  { label: 'Solicitud de Presupuesto', href: 'presupuesto/' },
];
