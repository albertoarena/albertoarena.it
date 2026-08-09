import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { siteConfig } from '../src/utils/config';

// Two fixed posts covering the code-heavy and prose-heavy ends of the
// content mix (see docs/plans/reading-mode.md, "Sequencing"). Run against
// dist/, the static build output, not the dev server — this is what a real
// reader (Safari Reader, Firefox Reader View) actually sees.
interface TestPost {
  slug: string;
  label: string;
  firstParagraph: string;
  lastParagraph: string;
}

const TEST_POSTS: TestPost[] = [
  {
    // content dir: create-a-domain-with-spatie-event-sourcing — frontmatter
    // `slug` differs from the dir name and determines the dist/ path.
    slug: 'domain-using-spatie-event-sourcing',
    label: 'code-heavy',
    firstParagraph:
      'Event sourcing is a powerful pattern for tracking changes to application state',
    lastParagraph: 'crossed 10,000 downloads on Packagist',
  },
  {
    slug: 'ai-hallucination-in-coding-agents',
    label: 'prose-heavy',
    firstParagraph: 'AI coding agents are becoming part of our daily workflow',
    lastParagraph: 'Stay sceptical. Stay curious. And always read the diff.',
  },
];

const NAV_LABELS = siteConfig.railNav.flatMap((group) => group.items.map((item) => item.label));
const AUTHOR_BIO = siteConfig.author.bio;
const COOKIE_BANNER_COPY =
  'We use analytics cookies to understand how you use this site';
const MIN_TEXT_LENGTH = 1500;

function parsePost(slug: string) {
  const htmlPath = join('dist', 'posts', slug, 'index.html');
  const html = readFileSync(htmlPath, 'utf-8');
  // Readability mutates the document it's given, so build a fresh one per call.
  const dom = new JSDOM(html, { url: `https://albertoarena.it/posts/${slug}/` });
  const h1Text = dom.window.document.querySelector('h1')?.textContent?.trim();
  const result = new Readability(dom.window.document).parse();
  return { result, h1Text };
}

describe.each(TEST_POSTS)(
  'reader eligibility: $label ($slug)',
  ({ slug, firstParagraph, lastParagraph }) => {
    it('is parsed by Readability', () => {
      const { result } = parsePost(slug);
      expect(result).not.toBeNull();
    });

    it('title matches the post h1', () => {
      const { result, h1Text } = parsePost(slug);
      expect(result?.title).toBe(h1Text);
    });

    it('extracts a non-trivial amount of text', () => {
      const { result } = parsePost(slug);
      expect(result?.textContent?.length ?? 0).toBeGreaterThan(MIN_TEXT_LENGTH);
    });

    it('includes the first and last paragraph of the post', () => {
      const { result } = parsePost(slug);
      expect(result?.textContent).toContain(firstParagraph);
      expect(result?.textContent).toContain(lastParagraph);
    });

    it('excludes nav link labels', () => {
      const { result } = parsePost(slug);
      for (const label of NAV_LABELS) {
        expect(result?.textContent).not.toContain(label);
      }
    });

    it('excludes the author bio job title', () => {
      const { result } = parsePost(slug);
      expect(result?.textContent).not.toContain(AUTHOR_BIO);
    });

    it('excludes the cookie banner copy', () => {
      const { result } = parsePost(slug);
      expect(result?.textContent).not.toContain(COOKIE_BANNER_COPY);
    });

    it('excludes the footer copyright line', () => {
      const { result } = parsePost(slug);
      const year = new Date().getFullYear();
      expect(result?.textContent).not.toContain(`© ${year} Alberto Arena`);
    });

    it('has a non-empty byline', () => {
      const { result } = parsePost(slug);
      expect(result?.byline?.trim()).toBeTruthy();
    });
  },
);
