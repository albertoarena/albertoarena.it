import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { siteConfig } from '../src/utils/config';

// Runs against the built homepage, so run `astro build` first (the
// test:site-links script does).

const html = readFileSync(join('dist', 'index.html'), 'utf8');
const doc = new JSDOM(html).window.document;

const buildItems = siteConfig.railNav.find((g) => g.label === 'build')!.items;
const UTM = 'utm_source=albertoarena.it';

describe('rail build section', () => {
  it('lists truss, cogway, sudoplay, phplives in that order', () => {
    expect(buildItems.slice(0, 4).map((i) => i.label)).toEqual([
      'truss',
      'cogway',
      'sudoplay',
      'phplives',
    ]);
  });

  it('tags sudoplay with utm_source', () => {
    const item = buildItems.find((i) => i.label === 'sudoplay')!;
    const url = new URL(item.path);
    expect(url.origin).toBe('https://sudoplay.dev');
    expect(url.searchParams.get('utm_source')).toBe('albertoarena.it');
  });

  it('leaves phplives untagged', () => {
    const item = buildItems.find((i) => i.label === 'phplives')!;
    expect(item.path).toBe('https://phplives.dev/');
    expect(item.path).not.toContain('utm_');
  });

  it('renders both links in the built rail, opening externally', () => {
    for (const host of ['sudoplay.dev', 'phplives.dev']) {
      const a = doc.querySelector(`aside a[href^="https://${host}/"], nav a[href^="https://${host}/"]`);
      expect(a, host).not.toBeNull();
      expect(a!.getAttribute('target')).toBe('_blank');
      expect(a!.getAttribute('rel')).toContain('noopener');
    }
    const sudo = doc.querySelector('nav a[href^="https://sudoplay.dev/"]')!;
    expect(sudo.getAttribute('href')).toContain(UTM);
  });
});

describe('dev-null profile link', () => {
  const URL_DEVNULL = 'https://dev-null.sh/@albertoarena';

  it('is in the rail footer', () => {
    const a = doc.querySelector(`a[href="${URL_DEVNULL}"]`);
    expect(a).not.toBeNull();
    expect(a!.getAttribute('target')).toBe('_blank');
    expect(a!.getAttribute('rel')).toContain('noopener');
  });

  it('is in the Person JSON-LD sameAs', () => {
    const graphs = [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => JSON.parse(s.textContent ?? '{}'));
    const nodes = graphs.flatMap((g) => (Array.isArray(g['@graph']) ? g['@graph'] : [g]));
    const person = nodes.find((n) => n['@type'] === 'Person');
    expect(person.sameAs).toContain(URL_DEVNULL);
  });
});

describe('rail footer social links', () => {
  it('never breaks a link label across lines', () => {
    const links = [...doc.querySelectorAll('aside a')].filter((a) =>
      /github\.com|x\.com|linkedin\.com|dev-null\.sh/.test(a.getAttribute('href') ?? ''),
    );
    expect(links).toHaveLength(4);
    for (const a of links) expect(a.className).toContain('whitespace-nowrap');
    expect(links[0].parentElement!.className).toContain('flex-wrap');
  });
});

describe('about page', () => {
  const about = new JSDOM(readFileSync(join('dist', 'pages', 'about', 'index.html'), 'utf8')).window.document;
  const hrefs = [...about.querySelectorAll('main a')].map((a) => a.getAttribute('href') ?? '');

  it('links sudoplay.dev with utm_source', () => {
    const href = hrefs.find((h) => h.startsWith('https://sudoplay.dev/'));
    expect(href).toBeDefined();
    expect(new URL(href!).searchParams.get('utm_source')).toBe('albertoarena.it');
  });

  it('links phplives.dev untagged', () => {
    expect(hrefs).toContain('https://phplives.dev/');
  });

  it('links the dev-null profile', () => {
    expect(hrefs).toContain('https://dev-null.sh/@albertoarena');
  });
});

describe('about page portfolio', () => {
  const about = new JSDOM(readFileSync(join('dist', 'pages', 'about', 'index.html'), 'utf8')).window.document;

  it('lists the four products as one list, not loose paragraphs', () => {
    const heading = [...about.querySelectorAll('h2')].find((h) => h.textContent === 'Portfolio')!;
    let el = heading.nextElementSibling;
    while (el && el.tagName !== 'UL') el = el.nextElementSibling;
    expect(el, 'a <ul> after the Portfolio heading').not.toBeNull();
    const names = [...el!.querySelectorAll(':scope > li > a:first-child')].map((a) => a.textContent);
    expect(names).toEqual(['Truss', 'Cogway', 'Sudo Play', 'PHP Lives']);
  });
});

describe('projects page', () => {
  it('includes PHP Lives with its site and repo', async () => {
    const { projects } = await import('../src/data/projects');
    const p = projects.find((x) => x.name === 'PHP Lives');
    expect(p).toBeDefined();
    expect(p!.url).toBe('https://phplives.dev/');
    expect(p!.github).toBe('https://github.com/albertoarena/phplives.dev');
    const page = readFileSync(join('dist', 'projects', 'index.html'), 'utf8');
    expect(page).toContain('https://phplives.dev/');
  });
});
