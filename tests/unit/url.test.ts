import { describe, expect, it } from 'vitest';
import { url } from '../../src/lib/url';

describe('url', () => {
  it('returns base with trailing slash for root', () => {
    expect(url('')).toBe('/pulidoGestionPage/');
    expect(url('/')).toBe('/pulidoGestionPage/');
  });
  it('joins page paths without double slashes', () => {
    expect(url('equipo/')).toBe('/pulidoGestionPage/equipo/');
    expect(url('/equipo/')).toBe('/pulidoGestionPage/equipo/');
  });
  it('keeps anchors and file paths', () => {
    expect(url('privacidad/#presup')).toBe('/pulidoGestionPage/privacidad/#presup');
    expect(url('img/logo.png')).toBe('/pulidoGestionPage/img/logo.png');
  });
});
