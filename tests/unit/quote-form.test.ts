import { describe, expect, it } from 'vitest';
import { validateQuote, type QuoteData } from '../../src/lib/quote-form';

const valid: QuoteData = {
  nombre: 'Ana López', direccion: 'C/ Mayor 1', codigoPostal: '28804', telefono: '600 123 456',
  email: 'ana@example.com', viviendas: '12', locales: '', naves: '', garajes: '0', privacidad: true,
};

describe('validateQuote', () => {
  it('accepts a complete valid request', () => {
    expect(validateQuote(valid)).toEqual({});
  });
  it('requires name, address, postal code, phone, email and privacy', () => {
    const errors = validateQuote({ ...valid, nombre: ' ', direccion: '', codigoPostal: '', telefono: '', email: '', privacidad: false });
    expect(Object.keys(errors).sort()).toEqual(['codigoPostal', 'direccion', 'email', 'nombre', 'privacidad', 'telefono']);
  });
  it('accepts postal codes with leading zero and rejects non 5-digit ones', () => {
    expect(validateQuote({ ...valid, codigoPostal: '02001' })).toEqual({});
    expect(validateQuote({ ...valid, codigoPostal: '2880' }).codigoPostal).toBeDefined();
    expect(validateQuote({ ...valid, codigoPostal: '28A04' }).codigoPostal).toBeDefined();
  });
  it('accepts phones with spaces, dashes and +34, rejects too short ones', () => {
    expect(validateQuote({ ...valid, telefono: '+34 600-123-456' })).toEqual({});
    expect(validateQuote({ ...valid, telefono: '91 888 77 66 / 600123456' })).toEqual({});
    expect(validateQuote({ ...valid, telefono: '12345' }).telefono).toBeDefined();
    expect(validateQuote({ ...valid, telefono: 'llamar tarde' }).telefono).toBeDefined();
  });
  it('rejects malformed emails', () => {
    expect(validateQuote({ ...valid, email: 'ana@' }).email).toBeDefined();
    expect(validateQuote({ ...valid, email: 'ana example.com' }).email).toBeDefined();
  });
  it('allows empty counts but rejects negative or decimal ones', () => {
    expect(validateQuote({ ...valid, viviendas: '' })).toEqual({});
    expect(validateQuote({ ...valid, locales: '-1' }).locales).toBeDefined();
    expect(validateQuote({ ...valid, naves: '2.5' }).naves).toBeDefined();
  });
});
