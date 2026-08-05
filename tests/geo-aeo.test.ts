import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Follow-up to the geoready.dev GEO/AEO audit (2026-08-05) — see
// docs/plans/geo-aeo-audit-improvements.md for the full findings and
// reasoning behind each fix below.

function readDist(relativePath: string): string {
  return readFileSync(join('dist', relativePath), 'utf-8');
}

describe('WebSite JSON-LD', () => {
  it('is present on the homepage alongside the existing Person schema', () => {
    const html = readDist(join('index.html'));
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    expect(match).not.toBeNull();

    const json = JSON.parse(match![1]);
    const graph = Array.isArray(json['@graph']) ? json['@graph'] : [json];
    const types = graph.map((node: { '@type': string }) => node['@type']);

    expect(types).toContain('Person');
    expect(types).toContain('WebSite');
  });

  it('WebSite node points at the site URL and publisher references the Person by @id', () => {
    const html = readDist(join('index.html'));
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    const json = JSON.parse(match![1]);
    const graph = Array.isArray(json['@graph']) ? json['@graph'] : [json];

    const person = graph.find((node: { '@type': string }) => node['@type'] === 'Person');
    const website = graph.find((node: { '@type': string }) => node['@type'] === 'WebSite');

    expect(website.url).toBe('https://albertoarena.it');
    expect(website.publisher).toEqual({ '@id': person['@id'] });
  });
});

describe('.well-known/ai.txt', () => {
  it('is built and points to llms.txt', () => {
    const path = join('dist', '.well-known', 'ai.txt');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('/llms.txt');
  });
});

describe('robots.txt Crawl-delay', () => {
  it('declares a crawl delay', () => {
    const robotsTxt = readFileSync(join('public', 'robots.txt'), 'utf-8');
    expect(robotsTxt).toMatch(/^Crawl-delay:\s*\d+$/m);
  });
});

describe('no dead manifest link', () => {
  it('the homepage does not link a manifest.webmanifest that does not exist', () => {
    const html = readDist(join('index.html'));
    const linksManifest = /<link[^>]+rel="manifest"/.test(html);
    if (linksManifest) {
      expect(existsSync(join('dist', 'manifest.webmanifest'))).toBe(true);
    } else {
      expect(linksManifest).toBe(false);
    }
  });
});

describe('About page contact email', () => {
  it('links the same address already used on privacy-policy and credits', () => {
    const html = readDist(join('pages', 'about', 'index.html'));
    expect(html).toContain('mailto:hello@albertoarena.it');
  });
});
