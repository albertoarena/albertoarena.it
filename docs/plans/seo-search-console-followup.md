# SEO / Search Console follow-up

**Status: proposed — awaiting approval, nothing implemented yet**
**Date:** 2026-07-18

## What was done already

`docs/plans/completed/seo-indexing-fixes.md` covered the first round (2026-05-25),
shipped across three commits on 2026-07-10:

| Commit | Fix |
|---|---|
| `9f14504` | `public/.htaccess` — 301 www/http → canonical `https://albertoarena.it` host |
| `5ce3ced` | Footer + cookie-banner links given trailing slashes |
| `a5d8a28` | Header nav, post category/tag links, `/categories`, `/tags`, pagination prev/next given trailing slashes |
| (earlier) | `astro.config.mjs` sitemap `filter()` excludes `/category/*`, `/categories`, `/tag/*`, `/tags`, `/page/N` from `sitemap-index.xml` |
| (earlier) | `public/robots.txt` created (`Disallow:` empty — allow-all + sitemap pointer) |

That round explicitly ruled out `noindex`/robots blocking for tag/category pages,
on the theory that sitemap exclusion alone would be enough (see "Out of Scope" in
the completed plan).

## Current state (2026-07-18)

Search Console → Page indexing (`sc-domain:albertoarena.it`) now shows **34
indexed / 63 not indexed**, down from 15/86 in May but still a large gap:

| Reason | Pages | Source |
|---|---|---|
| Page with redirect | 10 | Sito web |
| Alternate page with proper canonical tag | 2 | Sito web |
| Not found (404) | 1 | Sito web |
| Duplicate page without user-selected canonical | 1 | Sito web |
| Crawled, currently not indexed | 40 | Sistemi di Google |
| Discovered, currently not indexed | 9 | Sistemi di Google |

## Root cause analysis

### 1. Crawled/Discovered, not indexed (40 + 9 = 49) — the sitemap-exclusion approach didn't work

The site builds **85 pages**; the sitemap filter keeps only **32** of them (posts,
top-level pages, `/`, `/projects/`, `/subscribe/`). The other **53** — 36 tag
pages, 12 category pages, `/tags/`, `/categories/`, and 3 `/page/N/` pagination
pages — are excluded from `sitemap-index.xml`, but that only stops Google from
being *told* about them via the sitemap. `PostLayout.astro` and `PostCard.astro`
link to every tag and category on every single post, and `robots.txt` currently
has `Disallow:` (empty — allow everything), so Google reaches all 53 pages by
ordinary link-following regardless of the sitemap. It crawls thin, near-duplicate
listing pages and — correctly, from Google's perspective — declines to index most
of them. That's the 49-page bucket.

**53 excluded-from-sitemap pages vs. 49 reported not-indexed is a close enough
match to treat as the same problem.**

### 2. Page with redirect (10) — mostly the earlier fixes working as intended, plus two live gaps

Most of this bucket is expected: it's Google's cache of URLs that correctly
301-redirect *now* (www/http variants via `.htaccess`, non-trailing-slash paths
via Astro's canonical redirect) but haven't been recrawled since the 2026-07-10
fixes. This should shrink on its own.

Two live, currently-broken links were found during investigation that still
generate real redirect hops on every crawl:
- `src/content/posts/finally-i-moved-to-gatsby/index.md:15` — links to
  `/posts/i-moved-to-jekyll` (no trailing slash)
- `src/content/posts/moving-from-gatsby-to-astro/index.md:14` — links to
  `/posts/finally-i-moved-to-gatsby` (no trailing slash)

(`src/components/Sidebar/Copyright.astro` and `src/components/Feed/FeedItem.astro`
have the same non-trailing-slash pattern but are dead code — not imported by
`Layout.astro`/`Header.astro`/anything live — so they don't contribute to the
live GSC count. Worth deleting as unrelated cleanup, not a GSC fix.)

### 3. Not found (404) — 1 page — confirmed live cause

`src/layouts/BaseLayout.astro:56` unconditionally renders:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```
but `public/` only contains `favicon.svg` — there is no `favicon.ico`. Every
page references a resource that 404s.

### 4. Alternate page with proper canonical tag (2) — not a bug

Matches the two `it.md` translations (`pages/consulting/it/` and
`posts/laravel-netsons-deploy/it/`). Each self-canonicalizes and cross-links via
`hreflang`, which is exactly the pattern Google expects for translated pages.
This label is Google's way of saying "found, correctly deferring to canonical" —
no action needed.

### 5. Duplicate page without user-selected canonical (1) — no live code cause found

Checked pagination (`/` vs `/page/N/` — no collision, page 1 only ever serves at
`/`), IT/EN routing (distinct URLs, correct canonical + hreflang), and git
history for renamed post slugs (none). No reproducible cause in the current
codebase. Most likely a stale www/http crawl artifact from before `9f14504`,
same as most of bucket #2. Expected to self-resolve; needs a recrawl, not a
code change.

## Proposed changes

### Fix A — `robots.txt`: disallow the pages already excluded from the sitemap

Bring `robots.txt` in line with the intent already encoded in
`astro.config.mjs`'s sitemap filter, instead of relying on sitemap-exclusion
alone:

```
User-agent: *
Disallow: /tag/
Disallow: /category/
Disallow: /tags/
Disallow: /categories/
Disallow: /page/

Sitemap: https://albertoarena.it/sitemap-index.xml
```

Note this reverses a decision in the previous plan ("category/tag pages are
better handled by sitemap exclusion, not robots.txt"). That reasoning
conflated "not indexed" with "not accessible" — `Disallow` only blocks
*crawlers*, internal links continue to work normally for visitors. Given
sitemap-only exclusion has not closed the gap after nearly two months live,
`Disallow` is the next lever.

**Impact:** targets the 49-page crawled/discovered-not-indexed bucket.

### Fix B — Fix the missing favicon.ico

Either:
- generate a real `favicon.ico` from the existing `favicon.svg` (e.g. via
  ImageMagick: `magick favicon.svg -resize 32x32 favicon.ico`) and keep the
  `<link>` tag, or
- remove the `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` line
  from `BaseLayout.astro:56` and rely on `favicon.svg` alone (fine for all
  evergreen browsers; only matters for very old Safari/IE).

Recommend the first option — a real `.ico` costs nothing and has the broadest
compatibility.

**Impact:** resolves the 1-page 404.

### Fix C — Trailing slashes on the two remaining markdown links

```diff
- More than [5 years ago](/posts/i-moved-to-jekyll), I decided to move...
+ More than [5 years ago](/posts/i-moved-to-jekyll/), I decided to move...
```
```diff
- A few years ago, I [moved my blog to Gatsby](/posts/finally-i-moved-to-gatsby)...
+ A few years ago, I [moved my blog to Gatsby](/posts/finally-i-moved-to-gatsby/)...
```

**Impact:** removes 2 of the remaining live redirect hops; the rest of bucket
#2 should clear on recrawl.

### Out of scope for this round

- Deleting dead code (`Sidebar/Copyright.astro`, `Feed/FeedItem.astro`) — real
  cleanup opportunity, unrelated to Search Console.
- "Duplicate without user-selected canonical" (1 page) — no reproducible cause;
  just request revalidation after the above ships and watch it clear.
- "Alternate page with proper canonical tag" (2 pages) — not a problem.

## Implementation order

1. Fix B — favicon (trivial, standalone)
2. Fix C — two markdown trailing slashes (trivial, standalone)
3. Fix A — `robots.txt` (no build step, deploy independently)
4. Deploy, then in Search Console: resubmit the sitemap and click "Convalida"
   (Validate fix) on each of the six reason rows.

---

## Playbook: debugging future Google Search Console indexing warnings

Reusable checklist for the next time the Page Indexing report shows a
regression or a new "not indexed" reason.

1. **Get the actual page count, not just GSC's summary.**
   ```bash
   npm run build
   find dist -name index.html | wc -l          # total pages built
   grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | wc -l   # pages submitted
   ```
   A big gap between built pages and submitted pages is usually the sitemap
   filter (`astro.config.mjs`) doing its job — cross-check that gap against
   GSC's non-indexed count before assuming something is broken.

2. **Check whether excluded-from-sitemap pages are actually blocked, or just
   quietly reachable.**
   ```bash
   grep -rn "robots\|noindex" src/ public/robots.txt
   ```
   If a page type is deliberately excluded from `sitemap-index.xml` but not
   also `Disallow`'d in `robots.txt` (or given a `noindex` meta tag), Google
   will still find it via internal links and it'll show up as
   "crawled/discovered, not indexed" rather than being cleanly invisible.

3. **For "Page with redirect": grep for non-trailing-slash internal links.**
   Astro serves the trailing-slash form as canonical here (no `trailingSlash`
   override in `astro.config.mjs`), so any internal `href="/foo"` without a
   trailing slash costs an unnecessary 301. Check both `.astro` components
   *and* markdown post bodies (`src/content/posts/**/*.md`) — prose links are
   easy to miss since they don't show up in component greps:
   ```bash
   grep -rEn 'href="/[a-zA-Z][^"]*[^/"]"' src/components src/layouts src/pages
   grep -rEn '\]\(/[a-zA-Z][^)]*[^/)]\)' src/content/posts
   ```
   Before trusting a match, confirm the component is actually imported/live —
   this repo has some dead components (`Sidebar/`, `Feed/`) with stale links
   that don't affect the real site.

4. **For "Not found (404)": check every unconditional `<link>`/`<img>`/asset
   reference in the layouts, not just page routes.** GSC's 404 bucket can be a
   single static asset (favicon, manifest icon, OG image) referenced on every
   page, not necessarily a missing route. Cross-check `public/` actually
   contains every file referenced in `BaseLayout.astro`.

5. **For "Duplicate without user-selected canonical" or "Alternate with proper
   canonical": check `BaseLayout.astro`'s canonical logic is still
   self-referencing (`new URL(Astro.url.pathname, Astro.site)`) and that
   `hreflang` pairs (`it.astro` routes) point at each other, not at
   themselves.** If both checks pass and there's no reproducible dual-URL
   route in `src/pages/`, it's most likely stale crawl data from before a
   previous fix — don't chase it further; request revalidation and let it
   clear on the next crawl.

6. **Host/protocol duplication**: confirm `public/.htaccess` still 301s
   `www.albertoarena.it` and `http://` to the canonical
   `https://albertoarena.it` host. This is the fix from `9f14504` — if it ever
   regresses (e.g. `.htaccess` gets overwritten by a hosting migration), most
   of the "duplicate content" bucket comes back at once.

7. **After shipping a fix**, don't expect the GSC report to update quickly —
   validation cycles run over days to weeks. Click "Convalida" (Validate fix)
   per reason row in Search Console rather than waiting for the dashboard to
   change on its own, and re-check after ~1-2 weeks.
