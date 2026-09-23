export type QuoteField =
  | 'nombre' | 'direccion' | 'codigoPostal' | 'telefono' | 'email'
  | 'viviendas' | 'locales' | 'naves' | 'garajes' | 'privacidad';

export type QuoteData = Record<Exclude<QuoteField, 'privacidad'>, string> & { privacidad: boolean };
export type QuoteErrors = Partial<Record<QuoteField, string>>;

const COUNT_FIELDS = ['viviendas', 'locales', 'naves', 'garajes'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_RE = /^[\d\s+\-()/.]+$/;

/** Valida una solicitud de presupuesto. Devuelve un objeto vacío si es válida. */
export function validateQuote(data: QuoteData): QuoteErrors {
  const errors: QuoteErrors = {};
  const required = (field: keyof QuoteData, message: string) => {
    if (!String(data[field]).trim()) errors[field] = message;
  };

  required('nombre', 'Indique su nombre y apellidos.');
  required('direccion', 'Indique la dirección de la finca.');

  const cp = data.codigoPostal.trim();
  if (!/^\d{5}$/.test(cp)) errors.codigoPostal = 'El código postal debe tener 5 dígitos.';

  const phone = data.telefono.trim();
  if (!PHONE_CHARS_RE.test(phone) || phone.replace(/\D/g, '').length < 9) {
    errors.telefono = 'Indique un teléfono de contacto válido (mínimo 9 dígitos).';
  }

  if (!EMAIL_RE.test(data.email.trim())) errors.email = 'Indique un email válido.';

  for (const field of COUNT_FIELDS) {
    const value = data[field].trim();
    if (value && !/^\d+$/.test(value)) errors[field] = 'Debe ser un número entero igual o mayor que 0.';
  }

  if (!data.privacidad) errors.privacidad = 'Debe aceptar la política de privacidad.';

  return errors;
}
