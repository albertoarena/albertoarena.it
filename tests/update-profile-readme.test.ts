import { describe, expect, it, afterEach } from 'vitest';
import {
  formatDate,
  parseFeedItems,
  buildListLines,
  applyListToReadme,
  MAX_POSTS,
} from '../scripts/update-profile-readme.mjs';

const rss = (items: string) => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${items}</channel></rss>`;

const item = (title: string, link: string, pubDate: string) =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate></item>`;

describe('formatDate', () => {
  it('formats an RFC-822 pubDate as "Mmm d, yyyy"', () => {
    expect(formatDate('Wed, 05 Aug 2026 10:00:00 GMT')).toBe('Aug 5, 2026');
  });

  it('does not zero-pad the day', () => {
    expect(formatDate('Thu, 01 Jan 2026 00:00:00 GMT')).toBe('Jan 1, 2026');
  });

  it('uses UTC, not the runner\'s local timezone', () => {
    // 05:00 GMT on Aug 10 is still Aug 9 in UTC-10 (Honolulu). If the
    // implementation ever regresses to getMonth()/getDate() (local) instead
    // of getUTCMonth()/getUTCDate(), this assertion catches it regardless of
    // what timezone the machine or CI runner happens to be in.
    const original = process.env.TZ;
    process.env.TZ = 'Pacific/Honolulu';
    try {
      expect(formatDate('Mon, 10 Aug 2026 05:00:00 GMT')).toBe('Aug 10, 2026');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('parseFeedItems', () => {
  it('parses multiple items into an array, in feed order', () => {
    const xml = rss(
      item('First', 'https://albertoarena.it/posts/first/', 'Mon, 10 Aug 2026 10:00:00 GMT') +
        item('Second', 'https://albertoarena.it/posts/second/', 'Wed, 05 Aug 2026 10:00:00 GMT'),
    );
    const items = parseFeedItems(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('First');
    expect(items[1].title).toBe('Second');
  });

  it('wraps a single item in an array (fast-xml-parser returns an object, not a 1-item array)', () => {
    const xml = rss(item('Only post', 'https://albertoarena.it/posts/only/', 'Mon, 10 Aug 2026 10:00:00 GMT'));
    const items = parseFeedItems(xml);
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Only post');
  });

  it('returns an empty array when the channel has no items', () => {
    const items = parseFeedItems(rss(''));
    expect(items).toEqual([]);
  });

  it('decodes XML entities in titles (e.g. an apostrophe encoded as &apos;)', () => {
    const xml = rss(
      item(
        "I gave my schema viewer your app&apos;s colours",
        'https://albertoarena.it/posts/gave-my-schema-viewer-your-app-colours/',
        'Mon, 03 Aug 2026 10:00:00 GMT',
      ),
    );
    expect(parseFeedItems(xml)[0].title).toBe("I gave my schema viewer your app's colours");
  });
});

describe('buildListLines', () => {
  const items = [
    { title: 'Post A', link: 'https://albertoarena.it/posts/a/', pubDate: 'Mon, 10 Aug 2026 10:00:00 GMT' },
    { title: 'Post B', link: 'https://albertoarena.it/posts/b/', pubDate: 'Wed, 05 Aug 2026 10:00:00 GMT' },
  ];

  it('formats each line as "- <date> · [<title>](<url>)" with a middot separator (U+00B7)', () => {
    const [line] = buildListLines(items, 1);
    expect(line).toBe('- Aug 10, 2026 · [Post A](https://albertoarena.it/posts/a/)');
  });

  it('defaults to MAX_POSTS (5) and truncates longer feeds', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      title: `Post ${i}`,
      link: `https://albertoarena.it/posts/${i}/`,
      pubDate: 'Mon, 10 Aug 2026 10:00:00 GMT',
    }));
    expect(buildListLines(many)).toHaveLength(MAX_POSTS);
  });

  it('honours a custom max', () => {
    expect(buildListLines(items, 1)).toHaveLength(1);
  });

  it('trims whitespace around title and link', () => {
    const [line] = buildListLines([{ title: '  Padded  ', link: '  https://x/  ', pubDate: 'Mon, 10 Aug 2026 10:00:00 GMT' }]);
    expect(line).toBe('- Aug 10, 2026 · [Padded](https://x/)');
  });
});

describe('applyListToReadme', () => {
  const wrap = (middle: string) =>
    `# Profile\n\nsome intro\n\n<!-- BLOG-POST-LIST:START -->${middle}<!-- BLOG-POST-LIST:END -->\n\nfooter\n`;

  it('replaces only the content between the markers, leaving the rest untouched', () => {
    const readme = wrap('\n- old line');
    const updated = applyListToReadme(readme, ['- Aug 10, 2026 · [New](https://x/)']);
    expect(updated).toBe(wrap('\n- Aug 10, 2026 · [New](https://x/)'));
  });

  it('puts a newline right after START, so the first item is on its own line', () => {
    const updated = applyListToReadme(wrap(''), ['- item one', '- item two']);
    expect(updated).toContain('<!-- BLOG-POST-LIST:START -->\n- item one\n- item two<!-- BLOG-POST-LIST:END -->');
  });

  it('has no trailing newline before the END marker', () => {
    const updated = applyListToReadme(wrap(''), ['- only item']);
    expect(updated).not.toMatch(/- only item\n<!-- BLOG-POST-LIST:END -->/);
    expect(updated).toContain('- only item<!-- BLOG-POST-LIST:END -->');
  });

  it('returns null when the markers are missing, instead of corrupting the file', () => {
    expect(applyListToReadme('# Profile\n\nno markers here\n', ['- item'])).toBeNull();
  });

  it('returns null when only one marker is present', () => {
    const readme = '# Profile\n\n<!-- BLOG-POST-LIST:START -->\n- old\n';
    expect(applyListToReadme(readme, ['- new'])).toBeNull();
  });

  it('is idempotent: applying the same lines twice yields the same result', () => {
    const lines = ['- Aug 10, 2026 · [New](https://x/)'];
    const once = applyListToReadme(wrap('\n- old line'), lines)!;
    const twice = applyListToReadme(once, lines)!;
    expect(twice).toBe(once);
  });
});
