import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { site } from '../../src/data/site';
import { nav } from '../../src/data/nav';
import { team } from '../../src/data/team';
import { featuredVideo, videos } from '../../src/data/videos';
import { subsidy } from '../../src/data/subsidy';

describe('site data', () => {
  it('keeps the real company data', () => {
    expect(site.cif).toBe('B82302365');
    expect(site.email).toBe('fincas@pulidogestion.com');
    expect(site.address.postalCode).toBe('28804');
    expect(site.portalUrl).toBe('https://portalpropietarios.es/');
    expect(site.analyticsId).toBe('G-VEZ300TBPB');
  });
  it('has the 4 main sections in nav', () => {
    expect(nav.map((n) => n.href)).toEqual(['equipo/', 'multimedia/', 'contacto/', 'presupuesto/']);
  });
  it('has the 5 team members with existing photos', () => {
    expect(team).toHaveLength(5);
    for (const m of team) expect(existsSync(`public/${m.photo}`), m.photo).toBe(true);
  });
  it('has 8 unique videos sorted newest first, plus the featured one', () => {
    expect(videos).toHaveLength(8);
    expect(new Set(videos.map((v) => v.id)).size).toBe(8);
    const years = videos.map((v) => v.year);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
    expect(featuredVideo.id).toBe('Yzf-VKOsBLM');
  });
  it('keeps the subsidy expedient data and image', () => {
    expect(subsidy.lines.join(' ')).toContain('09-GCE1-02365.0/2024');
    expect(existsSync(`public/${subsidy.image}`)).toBe(true);
  });
});
