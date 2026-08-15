import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Tag/category/tags/categories/pagination pages are thin, near-duplicate
// listing pages. Blocking them with robots.txt `Disallow` (as done on
// 2026-07-18) prevents Google from ever recrawling pages that were already
// indexed *before* the block existed, freezing them in the index forever
// (see docs/plans/seo-search-console-followup.md, 2026-07-28 entry). The fix
// is `noindex,follow`: the page must stay crawlable for Google to see the
// directive and drop it, while link equity still flows to the real posts
// linked from these hub pages.

const NOINDEX_TAG = '<meta name="robots" content="noindex,follow">';

function readDist(relativePath: string): string {
  return readFileSync(join('dist', relativePath), 'utf-8');
}

describe('noindex on thin listing pages', () => {
  it('tag pages are noindex', () => {
    const html = readDist(join('tag', 'php', 'index.html'));
    expect(html).toContain(NOINDEX_TAG);
  });

  it('category pages are noindex', () => {
    const html = readDist(join('category', 'laravel', 'index.html'));
    expect(html).toContain(NOINDEX_TAG);
  });

  it('the /tags/ index is noindex', () => {
    const html = readDist(join('tags', 'index.html'));
    expect(html).toContain(NOINDEX_TAG);
  });

  it('the /categories/ index is noindex', () => {
    const html = readDist(join('categories', 'index.html'));
    expect(html).toContain(NOINDEX_TAG);
  });

  it('pagination pages are noindex', () => {
    const html = readDist(join('page', '2', 'index.html'));
    expect(html).toContain(NOINDEX_TAG);
  });
});

describe('noindex does not leak onto real content', () => {
  it('the homepage has no robots meta tag', () => {
    const html = readDist(join('index.html'));
    expect(html).not.toContain(NOINDEX_TAG);
    expect(html).not.toMatch(/<meta name="robots"/);
  });

  it('a post page has no robots meta tag', () => {
    const html = readDist(join('posts', 'domain-using-spatie-event-sourcing', 'index.html'));
    expect(html).not.toMatch(/<meta name="robots"/);
  });

  it('a top-level page has no robots meta tag', () => {
    const html = readDist(join('pages', 'about', 'index.html'));
    expect(html).not.toMatch(/<meta name="robots"/);
  });
});

describe('robots.txt allows crawling of tag/category/pagination paths', () => {
  it('the User-agent: * group has no Disallow rules', () => {
    // Other groups (e.g. specific bot user-agents blocked at the host level)
    // may carry their own Disallow lines — see the WAF-block group below.
    const robotsTxt = readFileSync(join('public', 'robots.txt'), 'utf-8');
    const wildcardGroup = robotsTxt.split(/\n\s*\n/).find((group) => /^User-agent:\s*\*\s*$/m.test(group));
    expect(wildcardGroup).toBeDefined();
    expect(wildcardGroup).not.toMatch(/Disallow:[^\n\S]*\S/);
  });

  it('still points to the sitemap', () => {
    const robotsTxt = readFileSync(join('public', 'robots.txt'), 'utf-8');
    expect(robotsTxt).toContain('Sitemap: https://albertoarena.it/sitemap-index.xml');
  });
});

describe('llms.txt post links resolve to real slugs', () => {
  it('has no broken link to the old content-folder-name slug', () => {
    const llmsTxt = readFileSync(join('public', 'llms.txt'), 'utf-8');
    expect(llmsTxt).not.toContain('/posts/create-a-domain-with-spatie-event-sourcing/');
  });

  it('links to the real post slug, and the post exists in dist/', () => {
    const llmsTxt = readFileSync(join('public', 'llms.txt'), 'utf-8');
    expect(llmsTxt).toContain('https://albertoarena.it/posts/domain-using-spatie-event-sourcing/');
    expect(existsSync(join('dist', 'posts', 'domain-using-spatie-event-sourcing', 'index.html'))).toBe(true);
  });
});
