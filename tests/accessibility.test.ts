import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';

// Crawls every page in dist/ (not just the sitemap, which deliberately
// excludes thin tag/category/pagination pages via astro.config.mjs's
// sitemap filter — those pages are still publicly reachable and still need
// to be accessible) and runs axe-core's WCAG 2.0/2.1 AA rule set against
// each. See docs/plans/wcag-aa-accessibility-automation.md.

const PORT = 4322;
const DIST_DIR = join(process.cwd(), 'dist');
const AXE_SOURCE_PATH = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');

// Third-party embeds (Disqus comments, GTM, the MailerLite signup widget)
// are outside this repo's control and would make the crawl slow, flaky,
// and dependent on network access in CI. Block them so every page is
// tested against what this codebase actually renders. Known gap this
// currently hides: the MailerLite "Subscribe" button's white-on-#5c92ff
// styling is ~2.99:1 (needs 4.5:1) — set in MailerLite's own dashboard
// theme editor, not fixable here. See docs/plans/wcag-aa-accessibility-automation.md.
const BLOCKED_HOST_FRAGMENTS = [
  'disqus.com',
  'googletagmanager.com',
  'google-analytics.com',
  'assets.mailerlite.com',
];

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

// src/pages/page/[page].astro is a legacy meta-refresh redirect stub (old
// /page/N/ URLs -> /writing/page/N/), not real content — same URL pattern
// astro.config.mjs's sitemap filter already excludes. Auditing it would
// just race axe-core against the browser's own client-side redirect.
const REDIRECT_STUB_PATTERN = /^\/page\/\d+\/$/;

// axe-core tags empty-table-header as best-practice/minor, but a manual
// WAVE scan of a real post (claude-code-auto-mode-still-needs-a-human,
// 2026-08-12 — a markdown table with `| |` as its first header cell)
// flagged the identical issue as an Error, not an alert: a screen-reader
// user landing on that header hears nothing at all, which is a concrete
// barrier, not a stylistic nitpick. axe's own severity is wrong for this
// one rule specifically — force it to fail the build regardless of the
// impact axe assigns it. Don't add rules here speculatively; only ones
// with the same kind of real-world evidence that axe under-rates them.
const FORCE_FAIL_RULES = ['empty-table-header'];

async function collectPages(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const pages: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      pages.push(...(await collectPages(full, `${base}/${entry.name}`)));
    } else if (entry.name === 'index.html') {
      const path = base === '' ? '/' : `${base}/`;
      if (!REDIRECT_STUB_PATTERN.test(path)) pages.push(path);
    } else if (entry.name.endsWith('.html')) {
      pages.push(`${base}/${entry.name}`);
    }
  }
  return pages;
}

function startStaticServer(): Promise<Server> {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    try {
      const data = await readFile(join(DIST_DIR, relative));
      res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(relative)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

interface PageResult {
  path: string;
  seriousOrCritical: { id: string; impact: string; help: string; nodes: number }[];
  other: { id: string; impact: string; help: string; nodes: number }[];
}

async function auditPage(browser: Browser, axeSource: string, path: string): Promise<PageResult> {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (BLOCKED_HOST_FRAGMENTS.some((fragment) => url.includes(fragment))) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'load' });
  // Every page runs a 0.3s opacity fade-in (.animate-fade-in, global.css).
  // axe-core factors element opacity into its color-contrast math, so a
  // scan that lands mid-fade sees a blended, artificially-low-contrast
  // color and fails nondeterministically. Force animations/transitions to
  // their end state first — this is what a real reader sees within 300ms
  // of any page load, not a rendering bug.
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    // best-practice needed for heading-order (see FORCE_FAIL_RULES comment
    // and docs/plans/completed/wcag-aa-accessibility-automation.md for the
    // TrussPromo.astro/PostLayout.astro heading-skip bugs this tag set
    // previously missed entirely on real pages).
    // @ts-expect-error axe is injected via addScriptTag above
    return await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
  });
  await page.close();

  const violations = results.violations as {
    id: string;
    impact: string;
    help: string;
    nodes: unknown[];
  }[];

  const isFailing = (v: { id: string; impact: string }) =>
    v.impact === 'serious' || v.impact === 'critical' || FORCE_FAIL_RULES.includes(v.id);

  return {
    path,
    seriousOrCritical: violations
      .filter(isFailing)
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    other: violations
      .filter((v) => !isFailing(v))
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
  };
}

describe('WCAG 2.1 AA — full-site axe-core crawl', () => {
  let server: Server;
  let browser: Browser;
  let axeSource: string;
  let results: PageResult[];

  beforeAll(async () => {
    [server, browser, axeSource] = await Promise.all([
      startStaticServer(),
      // --no-sandbox: GitHub Actions' Ubuntu runners block Chromium's own
      // sandbox (unprivileged user namespaces are disabled by default),
      // so an unqualified launch() crashes with "No usable sandbox!".
      // Fine here — this only ever renders our own built static HTML.
      puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }),
      readFile(AXE_SOURCE_PATH, 'utf-8'),
    ]);

    const pages = await collectPages(DIST_DIR);
    results = [];
    const errors: { path: string; error: unknown }[] = [];
    const CONCURRENCY = 8;
    const queue = [...pages];
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        let path: string | undefined;
        while ((path = queue.shift())) {
          try {
            results.push(await auditPage(browser, axeSource, path));
          } catch (error) {
            errors.push({ path, error });
          }
        }
      }),
    );

    if (errors.length > 0) {
      throw new Error(
        `Failed to audit ${errors.length} page(s):\n` +
          errors.map(({ path, error }) => `  ${path}: ${(error as Error).message}`).join('\n'),
      );
    }

    const moderateOrMinor = results.flatMap((r) => r.other.map((v) => ({ path: r.path, ...v })));
    if (moderateOrMinor.length > 0) {
      console.warn(
        `[accessibility] ${moderateOrMinor.length} moderate/minor axe-core finding(s) ` +
          `(not failing the build — review manually):\n` +
          moderateOrMinor.map((v) => `  ${v.path} — ${v.id} (${v.impact}): ${v.help}`).join('\n'),
      );
    }
  }, 120_000);

  afterAll(async () => {
    // Guard against beforeAll throwing before assignment (e.g. Chromium
    // failed to launch) — otherwise that failure gets masked by a second,
    // unrelated "Cannot read properties of undefined" here.
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it('crawled at least the known page count', () => {
    // Sanity check that collectPages() actually walked dist/ rather than
    // silently returning nothing (e.g. build didn't run first).
    expect(results.length).toBeGreaterThan(100);
  });

  it('has no serious or critical WCAG 2.1 AA violations, on any page', () => {
    const failures = results.filter((r) => r.seriousOrCritical.length > 0);
    const message = failures
      .map((r) => `${r.path}:\n` + r.seriousOrCritical.map((v) => `  ${v.id} (${v.impact}, ${v.nodes} node(s)): ${v.help}`).join('\n'))
      .join('\n\n');
    expect(failures, message).toEqual([]);
  });
});
