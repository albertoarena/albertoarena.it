import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { siteConfig } from '../src/utils/config';

// If this whole file reports zero tests instead of failures, it is almost
// certainly not a code problem: jsdom 27 requires Node >= 20.19 to load its
// own ESM-only dependency chain, and an older Node throws
// `ERR_REQUIRE_ESM` before a single test is collected. Run `nvm use` first
// (see .nvmrc) — this bit both f9c61665 and the session that filed it.

// Runs against every published post, not a fixed pair, so a new post is
// covered the day it merges (see f9c61665). The two paragraph assertions
// are derived from each post's own source markdown rather than hand-copied,
// so editing a post's opening or closing line can't silently break this
// suite for a reason that has nothing to do with reader mode.

interface TestPost {
  slug: string;
  firstParagraph: string;
  lastParagraph: string;
  minTextLength: number;
}

const POSTS_DIR = join('src', 'content', 'posts');
const DIST_DIR = 'dist';
// A lone "/label" is not a safe signature: this corpus legitimately
// contains things like "visit /truss" (a real route) and
// "// config/truss.php" (a real file path), both of which contain
// "/truss" without the nav having leaked. Rail.astro renders each group's
// items back to back ("  read   /writing  /series  /cheatsheets  ", read
// straight from a rendered post — whitespace amount isn't exact markdown
// prose either way), so the safe signature is two whole rail items from
// the *same* group in order, separated only by whitespace: two labels
// that close together, in that order, is not something ordinary prose
// produces by coincidence.
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NAV_LEAK_PATTERNS = siteConfig.railNav.flatMap((group) =>
  group.items.slice(1).map((item, i) => new RegExp(`/${escapeRegExp(group.items[i].label)}\\s+/${escapeRegExp(item.label)}`)),
);
const AUTHOR_BIO = siteConfig.author.bio;
const COOKIE_BANNER_COPY = 'We use analytics cookies to understand how you use this site';

// A run of markdown between blank lines that isn't itself a heading, list,
// table, blockquote, code fence, image, rule, or raw HTML block. This is
// deliberately conservative: it only has to find one clean plain-text block
// near the top and one near the bottom of each post, not classify every
// block correctly.
function isNonProseBlock(block: string): boolean {
  const t = block.trim();
  if (!t) return true;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/^>/.test(t)) return true;
  if (/^```/.test(t)) return true;
  if (/^[-*+]\s/.test(t)) return true;
  if (/^\d+\.\s/.test(t)) return true;
  if (/^\|/.test(t)) return true;
  if (/^<[a-zA-Z]/.test(t)) return true;
  if (/^(-{3,}|\*{3,})$/.test(t)) return true;
  if (/^!\[/.test(t)) return true;
  return false;
}

// Splits a post body into blank-line-separated blocks without breaking up
// fenced code blocks that happen to contain blank lines.
function blocksOutsideFences(body: string): string[] {
  const lines = body.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      current.push(line);
      continue;
    }
    if (!inFence && line.trim() === '') {
      if (current.length) blocks.push(current.join('\n'));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join('\n'));
  return blocks;
}

// Strips inline markdown syntax down to the plain text a browser would
// render. Code spans are swapped out for a sentinel before the emphasis
// regexes run and restored afterwards, because a bare `(\*|_)(.*?)\1` pass
// over unprotected text pairs up underscores that happen to sit inside two
// separate `snake_case` identifiers (e.g. `author_id` ... `created_by`) and
// swallows everything between them.
function cleanInline(text: string): string {
  const MARK = String.fromCharCode(1);
  const codeSpans: string[] = [];
  let cleaned = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `${MARK}${codeSpans.length - 1}${MARK}`;
  });
  cleaned = cleaned
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(new RegExp(`${MARK}(\\d+)${MARK}`, 'g'), (_, i) => codeSpans[Number(i)]);
  return cleaned.replace(/\s+/g, ' ').trim();
}

// Astro's markdown pipeline runs smartypants by default (curly quotes, en/em
// dashes, an ellipsis character), so rendered text never matches the raw
// markdown byte-for-byte. Normalising both sides back to plain ASCII
// punctuation sidesteps having to reimplement smartypants' opening/closing
// quote logic just to compare two strings.
function normalizeTypography(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstAndLastParagraph(body: string): { first: string; last: string } {
  const prose = blocksOutsideFences(body).filter((b) => !isNonProseBlock(b));
  return {
    first: cleanInline(prose[0] ?? ''),
    last: cleanInline(prose[prose.length - 1] ?? ''),
  };
}

// A floor derived from the post's own source rather than one fixed number:
// a fixed absolute minimum (the original 1500) is exactly what let this
// suite silently stop covering short posts (835 rendered characters for the
// shortest post in the corpus). Comparing extracted length against ~half of
// the post's own plain-text length scales with the post instead.
function sourcePlainLength(body: string): number {
  return blocksOutsideFences(body).reduce((total, block) => {
    const t = block.trim();
    if (/^```/.test(t)) {
      return total + t.split('\n').slice(1, -1).join('\n').length;
    }
    const withoutBlockSyntax = t
      .replace(/^#{1,6}\s+/, '')
      .replace(/^>\s?/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\|/g, ' ')
      .replace(/^:?-+:?\s*$/gm, '');
    return total + cleanInline(withoutBlockSyntax).length;
  }, 0);
}

function loadTestPosts(): TestPost[] {
  return readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const raw = readFileSync(join(POSTS_DIR, entry.name, 'index.md'), 'utf-8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!match) return [];
      const frontmatter = parseYaml(match[1]) as { slug?: string; draft?: boolean; lang?: string };
      const body = match[2];
      // Drafts never ship and translations render at a different dist/
      // path (posts/<slug>/it/); both are out of scope for this suite.
      if (frontmatter.draft) return [];
      if (frontmatter.lang && frontmatter.lang !== 'en') return [];
      const slug = frontmatter.slug ?? entry.name;
      const { first, last } = firstAndLastParagraph(body);
      return [{ slug, firstParagraph: first, lastParagraph: last, minTextLength: sourcePlainLength(body) * 0.5 }];
    });
}

const TEST_POSTS = loadTestPosts();

function parsePost(slug: string) {
  const htmlPath = join(DIST_DIR, 'posts', slug, 'index.html');
  const html = readFileSync(htmlPath, 'utf-8');
  // Readability mutates the document it's given, so build a fresh one per call.
  const dom = new JSDOM(html, { url: `https://albertoarena.it/posts/${slug}/` });
  const h1Text = dom.window.document.querySelector('h1')?.textContent?.trim();
  const result = new Readability(dom.window.document).parse();
  return { result, h1Text };
}

describe('reader eligibility corpus', () => {
  it('covers every published English post', () => {
    // A regression test for the loader itself: if this drops to 0 or 1,
    // something upstream of the glob (frontmatter shape, the draft/lang
    // filter) is silently excluding real posts again.
    expect(TEST_POSTS.length).toBeGreaterThan(30);
  });
});

describe.each(TEST_POSTS)('reader eligibility: $slug', ({ slug, firstParagraph, lastParagraph, minTextLength }) => {
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
    expect(result?.textContent?.length ?? 0).toBeGreaterThan(minTextLength);
  });

  it('includes the first and last paragraph of the post', () => {
    const { result } = parsePost(slug);
    const text = normalizeTypography(result?.textContent ?? '');
    expect(text).toContain(normalizeTypography(firstParagraph));
    expect(text).toContain(normalizeTypography(lastParagraph));
  });

  it('excludes nav link labels', () => {
    const { result } = parsePost(slug);
    for (const pattern of NAV_LEAK_PATTERNS) {
      expect(result?.textContent).not.toMatch(pattern);
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
});
