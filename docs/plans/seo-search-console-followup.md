# SEO / Search Console follow-up

**Status: 2026-08-28 — `/current/` leak fix shipped (#32), deployed,
live-verified clean; GSC validation requested, awaiting recrawl**
**Date:** 2026-07-18 (see 2026-07-28, 2026-07-29, 2026-08-08 and 2026-08-28
updates at the bottom)

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

2. **Check whether the report's sample is the complete set or a subsample,
   before drawing a conclusion from what's listed.** The "Esempi" table
   under a reason row only shows the first page of results; if the
   pagination control (or the `Pagine` count vs. rows-shown) shows more
   rows exist than are displayed, treat the visible URLs as a sample, not
   an inventory — a specific bug (like the `/current/` leak below) can be
   present in the bucket without appearing in what's shown, and absence
   from a subsample is not evidence of absence from the bucket. Conversely,
   if the count and the pagination agree the shown rows are everything
   (e.g. "1-2 di 2" for a 2-page count), treat that as a real, checkable
   fact — don't blame a hypothetical live bug for an alert email when the
   complete set demonstrably doesn't contain it yet (caught cross-checking
   trussphp.com's plan, 2026-08-28: the `/current/`-leak hypothesis was
   correctly proposed as worth checking there, not asserted as already
   present — the complete-set check is what confirmed it wasn't, yet).

3. **Check whether excluded-from-sitemap pages are actually blocked, or just
   quietly reachable.**
   ```bash
   grep -rn "robots\|noindex" src/ public/robots.txt
   ```
   If a page type is deliberately excluded from `sitemap-index.xml` but not
   also `Disallow`'d in `robots.txt` (or given a `noindex` meta tag), Google
   will still find it via internal links and it'll show up as
   "crawled/discovered, not indexed" rather than being cleanly invisible.

4. **For "Page with redirect": grep for non-trailing-slash internal links.**
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

5. **For "Not found (404)": check every unconditional `<link>`/`<img>`/asset
   reference in the layouts, not just page routes.** GSC's 404 bucket can be a
   single static asset (favicon, manifest icon, OG image) referenced on every
   page, not necessarily a missing route. Cross-check `public/` actually
   contains every file referenced in `BaseLayout.astro`.

6. **For "Duplicate without user-selected canonical" or "Alternate with proper
   canonical": check `BaseLayout.astro`'s canonical logic is still
   self-referencing (`new URL(Astro.url.pathname, Astro.site)`) and that
   `hreflang` pairs (`it.astro` routes) point at each other, not at
   themselves.** If both checks pass and there's no reproducible dual-URL
   route in `src/pages/`, it's most likely stale crawl data from before a
   previous fix — don't chase it further; request revalidation and let it
   clear on the next crawl.

7. **Host/protocol duplication**: confirm `public/.htaccess` still 301s
   `www.albertoarena.it` and `http://` to the canonical
   `https://albertoarena.it` host. This is the fix from `9f14504` — if it ever
   regresses (e.g. `.htaccess` gets overwritten by a hosting migration), most
   of the "duplicate content" bucket comes back at once.

8. **For "Page with redirect": don't test only the homepage or already-slashed
   paths.** `curl -sI` a directory-style path *without* its trailing slash
   (e.g. `/pages/credits`, not `/pages/credits/`) on the canonical host —
   the 08-08 and 08-28 rounds each found a real live redirect-chain bug that
   only reproduced on that specific shape of request, and every prior round
   missed it by testing only the root path or paths that already had their
   slash. This deploy mechanism (`releases/<ts>/` + `current` symlink,
   shared with trussphp.com) has an established failure mode where a
   missing trailing slash on a directory route leaks the internal
   `/current/` path into the redirect chain — check for it specifically,
   don't assume the 08-28 fix generalizes without re-testing after any
   future change to `scripts/docroot.htaccess` or `public/.htaccess`.

9. **After shipping a fix**, don't expect the GSC report to update quickly —
   validation cycles run over days to weeks. Click "Convalida" (Validate fix)
   per reason row in Search Console rather than waiting for the dashboard to
   change on its own, and re-check after ~1-2 weeks.

---

## 2026-07-28 update: robots.txt Disallow froze 2 already-indexed pages

Ten days after the 2026-07-18 round shipped, a fresh Coverage export
(`albertoarena.it-Coverage-2026-07-28`) and a manual drill-down into every
reason row in Search Console turned up one real regression from that round,
one previously-misdiagnosed 404, and confirmed the rest needs no action.

### Root causes found

**1. "Indicizzata ma bloccata da robots.txt" (2 pages) — the robots.txt fix
itself is the bug.** `/tag/developer-tools/` and `/category/ai/` were indexed
*before* the 2026-07-18 `Disallow` rules existed. Once a URL is blocked by
`robots.txt`, Google can never crawl it again — which means it can never
discover it should be dropped from the index either. `Disallow` only stops
*future* crawling; it doesn't deindex anything already indexed. These 2 pages
were frozen in place by the very fix meant to clean things up. This is the
mechanism behind "pages excluded by robots.txt are still failing in
indexing" — the exclusion is what prevents the failure from ever resolving.

**Fix**: replaced robots.txt blocking with a `noindex,follow` meta tag
(`src/layouts/BaseLayout.astro`, `src/components/Layout.astro`, applied to
the 5 templates: `tag/[tag].astro`, `category/[category].astro`, `tags.astro`,
`categories.astro`, `page/[page].astro`) and reverted `robots.txt` to
allow-all. `noindex` requires the page to stay crawlable to work — that's the
whole point versus `Disallow`. `,follow` (not `,nofollow`) keeps link equity
flowing to the real posts these hub pages link to. Also submitted temporary
removal requests for the 2 stuck URLs via Search Console's "Rimozioni" tool
for faster relief while the `noindex` tag propagates through Google's normal
recrawl cycle.

**2. "Non trovata (404)" (1 page) — not the favicon after all.** The
2026-07-18 round assumed the 404 was the missing `favicon.ico`; that fix was
correct and confirmed live (200). The actual current 404 is
`/posts/create-a-domain-with-spatie-event-sourcing/`, which only existed as a
typo in the hand-maintained `public/llms.txt:25` — it used the post's content-
folder name (`create-a-domain-with-spatie-event-sourcing`) instead of its
actual frontmatter `slug` (`domain-using-spatie-event-sourcing`). Fixed the
one line.

### Confirmed to need no action

- **"Pagina con reindirizzamento" (14, failed validation)**: checked every
  live internal link source (header, footer, nav config, `PostCard`,
  `PostLayout`, tags/categories pages, RSS feed) — all already use correct
  trailing slashes and the canonical host. The 14 sampled URLs are all *stale*
  entries Google already had on file from before the May/July fixes; they
  correctly 301 today. A permanent redirect is supposed to keep redirecting —
  "failed validation" here just means Google rechecked and (correctly) found
  the redirect still there. This clears only as Google's crawler retires these
  URLs from its own backlog over time; nothing in the code to change.
- **"Crawled/discovered, not indexed" (38 + 6)**: mostly the same tag/category
  pages as above (will migrate to "excluded by noindex tag" once Google
  reprocesses them), one freshly-published post that showed as not-indexed in
  the snapshot but was confirmed indexed via URL Inspection by the time of
  writing (normal indexing lag, already resolved), one old thin post
  (`/posts/is-it-really-an-integer/`) that Google crawled successfully,
  confirmed indexable with a correct self-canonical, but chose not to index —
  a content-quality/authority judgment call, not a technical defect — and a
  few legitimate pages simply not yet crawled (queued, not a bug).
- **"Duplicate without canonical" / "Alternate with proper canonical"**: both
  at 0 pages, "Superata" (passed) — fully resolved.

### Tests

Added `tests/seo-indexing.test.ts` (`npm run test:seo-indexing`), following
the `tests/reader-eligibility.test.ts` pattern of building `dist/` and
asserting on the output: confirms `noindex,follow` renders on all 5 thin-page
types and nowhere else (homepage, posts, top-level pages), `robots.txt` has no
`Disallow` rules, and `llms.txt` no longer links to the broken slug.

---

## 2026-07-29 update: re-verified the 07-28 diagnosis, requested validation

User shared a fresh Coverage export (`albertoarena.it-Coverage-2026-07-29.zip`)
and flagged the two "Non riuscita" (failed validation) rows — "Pagina con
reindirizzamento" (14) and "Pagina scansionata, ma attualmente non
indicizzata" (38). Re-checked rather than assuming yesterday's diagnosis
still held:

- **The report itself predates the 07-28 fix.** Its "Ultimo aggiornamento"
  timestamp was 24/07/26 — the `df795028` fix landed 28/07 10:06am, so this
  export can't reflect it yet regardless of anything else.
- **Re-ran `npm run test:seo-indexing`** — all 12 tests still pass.
- **Live-`curl`-verified 8 of the 14 sampled "Page with redirect" URLs**
  against production (`/pages/credits`, `/pages/privacy-policy`, `/projects`,
  `/tag/github`, `/category/react`, `/page/2`, plus the `http://` and
  `http://www.` homepage variants) — every one still correctly 301s to its
  canonical trailing-slash/https/non-www form. Confirms the 07-28 conclusion
  ("stale Google-side cache of URLs that already redirect correctly, not a
  live bug") still holds; no code changes made.

**Action taken (in Search Console, not code):** clicked "Convalida
correzione" / "Avvia nuova convalida" (Validate fix) on three rows to
request a fresh Google recrawl rather than waiting for the passive cycle:
"Pagina con reindirizzamento" (14 — had a prior *failed* validation dated
19/07–25/07, restarted), "Bloccata da robots.txt" (12), and "Indicizzata ma
bloccata da robots.txt" (2 — the actual regression this round's fix
targets). All three show "Convalida iniziata" as of 29/07/26. No dashboard
change expected for days to weeks; check back per the playbook above rather
than re-diagnosing from scratch next time this comes up.

---

## 2026-08-08 update: found the real cause of the persistent redirect-validation failures

User forwarded a fresh GSC notification email plus a full Coverage export
(`albertoarena.it-Coverage-2026-08-08.zip` + 4 drilldown exports) after
noticing the redirect issue still hadn't cleared across three prior rounds.
Re-verified from scratch instead of trusting the earlier "just stale cache"
conclusion, since the user explicitly flagged that past attempts changed
little.

### Current report snapshot (05/08/26 data, 40 indexed / 86 not indexed)

| Reason | Pages | Validation |
|---|---|---|
| Pagina con reindirizzamento | 13 | **Non riuscita (failed)** |
| Pagina scansionata, ma attualmente non indicizzata | 31 | **Non riuscita (failed)** |
| Esclusa in base al tag "noindex" | 24 | Non iniziata (new) |
| Non trovata (404) | 1 | Non iniziata |
| Bloccata da robots.txt | 14 | Iniziata (in progress) |
| Rilevata, ma attualmente non indicizzata | 3 | Iniziata (in progress) |
| Duplicate / Alternate canonical | 0 | Superata (passed) |
| Indicizzata ma bloccata da robots.txt | 0 | **Superata** — confirms the 07-28 noindex fix worked |

### Root cause found: a real 2-hop redirect chain, missed by every prior round

Every prior round (05-25, 07-18, 07-28, 07-29) tested the www/http →
canonical-host redirect using only the **homepage** (`http://albertoarena.it/`,
`http://www.albertoarena.it/`) — a path that already ends in `/`, so the
`.htaccess` host-rewrite alone produces a clean single-hop 301. Today,
live-`curl`-verifying every sampled URL from the fresh export (not just the
homepage) turned up the actual bug:

```
$ curl -sI -L http://www.albertoarena.it/category/react
HTTP/1.1 301 Moved Permanently
Location: https://albertoarena.it/category/react       ← hop 1: .htaccess host rewrite (no slash added)
HTTP/2 301
location: https://albertoarena.it/category/react/       ← hop 2: Apache mod_dir DirectorySlash
HTTP/2 200
```

`public/.htaccess`'s host-canonicalization rule rewrites `www`/`http` to the
canonical host but preserves the original request path verbatim. If that
path lacks a trailing slash (true for every tag/category/page URL Google has
on file pre-dating the 07-10 trailing-slash fixes), the rewritten URL is
itself non-canonical and triggers a *second* 301 from Apache's own
`mod_dir` directory-slash behavior. A URL that redirects twice is much less
likely to pass Google's redirect validation than one that redirects once —
this is almost certainly why "Pagina con reindirizzamento" has failed
validation across four consecutive rounds despite each round concluding
"nothing to fix, just wait." This is the first round to catch it because
it's the first round to test a non-homepage, non-trailing-slash URL under
the www/http host-rewrite path specifically.

### Fix — collapse host + trailing-slash normalization into one 301

```apache
RewriteEngine On

# Collapse host+scheme+trailing-slash normalization into a single 301
# (avoids the 2-hop chain above for any www/http URL missing its slash)
RewriteCond %{HTTP_HOST} ^www\.albertoarena\.it$ [NC,OR]
RewriteCond %{HTTPS} off
RewriteCond %{REQUEST_URI} !/$
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
RewriteRule ^ https://albertoarena.it%{REQUEST_URI}/ [L,R=301]

# Existing host-only rewrite (root path, already-slashed paths, static files)
RewriteCond %{HTTP_HOST} ^www\.albertoarena\.it$ [NC,OR]
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://albertoarena.it/$1 [L,R=301]
```

The new rule only fires when the request path (a) doesn't already end in
`/` and (b) resolves to a real directory under `DOCUMENT_ROOT` (i.e. it's a
page route, not a static asset like `/favicon.ico`) — the `-d` filesystem
check handles this more reliably than an extension regex would (it correctly
classifies dotted slugs like `/tag/node.js/` as directories, not files).
When it fires, it redirects straight to the final `https://` +
non-www + trailing-slash URL in one hop; everything else (root `/`,
already-slashed paths, static files) falls through unchanged to the
existing rule.

**Verified locally** against a real Apache 2.4.66 instance (Homebrew httpd,
`mod_rewrite` + `mod_dir`, `AllowOverride All`, a docroot mirroring `dist/`'s
directory layout) before touching production — no staging environment
exists for this site, so this was the only way to test an `.htaccess`
change (which controls the entire domain's redirect behavior) without
risking a live regression. All 7 cases passed on the first try:

| Request | Result |
|---|---|
| `www` host, `/category/react` (no slash) | single 301 → `https://albertoarena.it/category/react/` |
| non-www `http`, `/category/react` (no slash) | single 301 → same |
| `/` (root) | single 301, no double slash |
| `/favicon.ico` (static file) | single 301, no slash appended |
| `/tag/node.js` (dotted slug, `-d` edge case) | single 301 → `.../tag/node.js/` |
| `/category/react/` (already slashed) | single 301, no double slash |
| `www` host, `/` (root) | single 301 |
| `/category/react?foo=bar` (query string) | query string preserved through the redirect |

### Other rows — confirmed no further action needed

- **"Esclusa in base al tag noindex" (24, new)**: not a regression — this is
  the 07-28 `noindex,follow` fix (`df795028`) finally being recognized by
  Google for the tag/category/pagination pages it targets. The GSC email
  ("new reason blocking indexing") is Google's generic new-reason notice,
  not a signal something broke. `grep -rn noindex src/` confirms the 5
  templates (`tag/[tag]`, `category/[category]`, `tags`, `categories`,
  `page/[page]`) still carry it and nothing else does; `npm run test:seo-indexing`
  passes (12/12).
- **"Pagina scansionata, ma attualmente non indicizzata" (31, failed)**: same
  diagnosis as 07-28/07-29, re-confirmed — a mix of (a) stale tag/category
  URLs still migrating into the noindex bucket above, (b) tracking-parameter
  post URLs (`?utm_source=`, `?ref=`) which already self-canonicalize
  correctly via `BaseLayout.astro`'s `new URL(Astro.url.pathname, Astro.site)`
  (query strings are dropped), and (c) genuine content-authority judgment
  calls (e.g. `/posts/is-it-really-an-integer/`). No reproducible technical
  defect found; checked every live internal link source again (playbook
  step 3) and found no non-trailing-slash `href`s or markdown links, only
  image asset references (which correctly don't need slashes).
- **"Non trovata (404)" (1, not started)**: confirmed via GSC UI to still be
  `https://albertoarena.it/posts/create-a-domain-with-spatie-event-sourcing/`
  — the exact slug already fixed in `public/llms.txt` by `df795028` on
  07-28. `grep -rn create-a-domain-with-spatie-event-sourcing .` (excluding
  `dist/`) finds zero remaining references anywhere in the repo. This one
  isn't stuck on a code issue — nobody ever clicked "Convalida correzione"
  on this specific row (the 07-29 round validated three other rows but not
  this one). Pure GSC-UI action needed, no code change.
- **"Bloccata da robots.txt" (14, in progress)** and **"Rilevata, ma
  attualmente non indicizzata" (3, in progress)**: both mid-validation from
  the 07-29 "Convalida" clicks, `robots.txt` confirmed still allow-all
  (`Disallow:` empty) — just need more time, consistent with GSC's own
  "days to weeks" guidance.

### Implementation order

1. Ship the `.htaccess` fix above (only code change this round).
2. Deploy (push to `master` → existing FTP CI deploy).
3. Live-`curl`-verify the same 7 cases against production.
4. In Search Console: click "Convalida correzione" on "Non trovata (404)"
   (never requested) and re-request "Pagina con reindirizzamento" (to give
   Google a fresh single-hop redirect to validate against, now that the
   chain is fixed).
5. No action on the other four rows this round — check back in 1-2 weeks
   per the playbook.

---

## 2026-08-08 update: shipped, deployed, live-verified; GSC validation requested

PR [#17](https://github.com/albertoarena/albertoarena.it/pull/17) (the
`.htaccess` fix above) merged to `master`, CI deployed via the existing FTP
pipeline.

**Live-`curl`-verified the fix on production**, including a case the local
Apache test couldn't cover (no TLS in that environment): `https://` + `www`
combined. All single-hop, `num_redirects: 1` via `curl -w`:

| Request | Result |
|---|---|
| `http://www.albertoarena.it/category/react` | 1 hop → `https://albertoarena.it/category/react/` |
| `https://www.albertoarena.it/tag/github` | 1 hop → `https://albertoarena.it/tag/github/` |
| `http://albertoarena.it/page/2` | 1 hop → `https://albertoarena.it/page/2/` |
| `http://www.albertoarena.it/` (root) | 1 hop, unchanged |
| `http://www.albertoarena.it/favicon.ico` (static file) | 1 hop, no slash appended |
| `http://www.albertoarena.it/tag/node.js` (dotted slug) | 1 hop → `.../tag/node.js/` |
| already-canonical URLs (`/`, `/category/react/`, `/pages/credits/`, a post) | unchanged, 200 direct |

Previously these same www/http + no-slash URLs took 2 hops; confirmed fixed.

**Search Console actions taken by the user:**
- Clicked "Convalida correzione" on **"Non trovata (404)"** (1 page,
  `/posts/create-a-domain-with-spatie-event-sourcing/`) — this was the
  already-code-fixed 404 that had never actually been submitted for
  validation before (see 07-28 entry).
- Re-requested a fresh "Convalida" on **"Pagina con reindirizzamento"** (13
  pages) — now that the redirect is genuinely single-hop, this gives Google
  something that should actually pass this time, unlike the prior four
  rounds of validation against a URL that was still secretly 2-hop.

**On the other two rows visible in the same report** (user asked
specifically about these):

- **"Esclusa in base al tag noindex" (24, Non iniziata)** — left alone,
  deliberately. This isn't a problem to fix; it's Google recognizing the
  intentional `noindex,follow` on the tag/category/pagination hub pages
  from the 07-28 fix. "Convalida" is for confirming a fix to something
  broken — there's nothing broken here, so nothing was clicked.
- **"Pagina scansionata, ma attualmente non indicizzata" (31, Non
  riuscita)** — re-confirmed as a non-technical bucket (stale tag/category
  migration + tracking-param URLs correctly deferring to their canonical +
  genuine content-authority judgment calls on a few old posts). No code fix
  identified on this or any prior round; not clicked this time since
  re-validating wouldn't change the outcome without an underlying fix to
  point at.

**Next check-in:** per the playbook, GSC validation cycles run days to
weeks — no dashboard change expected immediately. Come back to this doc
rather than re-diagnosing from scratch; if "Pagina con reindirizzamento"
still fails validation after this round, the redirect-chain fix can be
ruled out as the cause and the search should move elsewhere.

---

## 2026-08-28 update: found a real, currently-live cause — the 08-13 deploy fix collapsed one hop but grew another

User reported a fresh GSC notification ("new reason blocking indexing":
`noindex` tag) plus screenshots of the Page indexing report, both
still-failing rows grown since 08-08 (**"Pagina con reindirizzamento" 13 →
18**, **"Pagina scansionata, ma attualmente non indicizzata" 31 → 23**) and,
notably, the redirect-page sample now includes URLs never seen in this
report before: `https://albertoarena.it/current/pages/credits/`,
`.../current/projects/`, `.../current/posts/introducing-truss/`. Per the
playbook (step 7), re-verified from scratch with live `curl` rather than
re-asserting the 08-08 "just stale cache, wait it out" conclusion, since
the user flagged that recent changes hadn't helped and new `/current/...`
URLs appearing is a specific, checkable claim, not a vague symptom.

### Root cause: `mod_dir`'s automatic trailing-slash redirect exposes `current/`

Live `curl -sI` hop-by-hop against production:

```
$ curl -sI https://albertoarena.it/pages/credits          # canonical host+scheme, just missing the slash
HTTP/2 301
location: https://albertoarena.it/current/pages/credits/   ← leaks the internal deploy path
$ curl -sI https://albertoarena.it/current/pages/credits/
HTTP/2 200                                                  ← the 08-13 fix strips it back here
```

Same pattern reproduced for every other non-trailing-slash sample from the
report: `/projects` → `/current/projects/` → 200; `/posts/introducing-truss`
→ `/current/posts/introducing-truss/` → 200; `/category/static-websites`
(3 hops via `http://`) → `.../current/category/static-websites/` → 200;
`/tag/javascript`, `/page/3`, `/posts/is-it-really-an-integer`,
`/pages/privacy-policy` all show the same middle hop.

The mechanism: `scripts/docroot.htaccess` (mirrored by hand onto the host,
see DEPLOYMENT.md) internally rewrites every request that isn't already
under `/current/` to `current/$1` — preserving whatever trailing-slash-ness
the original request had. When the original request has **no** trailing
slash and maps to a directory, Apache's own `mod_dir` `DirectorySlash`
fires a redirect — but it builds that redirect's `Location` from the
*already-internally-rewritten* path (`current/pages/credits`), not the
client's original request, because the rewrite happened in an earlier
per-directory phase. The result: any non-trailing-slash URL anywhere on
the site now takes an extra hop through a client-visible `/current/...`
URL before the 08-13 fix's own redirect strips it back to canonical. That
fix (`b5ade8e3`) only handles *direct* hits on `/current/...` — it doesn't
prevent this internally-generated exposure, so it turned what used to be a
single bad outcome (a `/current/...` URL serving 200 directly, i.e.
duplicate content) into a *two-hop chain that still surfaces the same URL*
as an intermediate redirect target on every crawl. That's consistent with
why the redirect bucket grew rather than shrank, and why validation keeps
failing — Google is being asked to validate a single clean redirect and
instead keeps finding a longer chain through internal deploy plumbing.

This also plausibly explains part of why "crawled, not indexed" hasn't
shrunk either: tag/category/pagination pages already carry
`noindex,follow` at their final URL (re-verified live — `/category/open-source/`,
`/category/type-checking/`, `/tag/javascript/` all render the tag correctly)
but every crawl of the old non-slash form now detours through `/current/`
first, which may be resetting or delaying Google's reclassification into
the "excluded by noindex tag" bucket instead of a distinct bug.

### Other rows re-checked, no action needed (consistent with prior rounds)

- **`/page/1/` → 404**: confirmed intentional. `src/pages/page/[page].astro`
  redirects old `/page/N/` URLs to `/writing/page/N/`, but its
  `getStaticPaths` only generates `N ≥ 2` (page 1 is the homepage/writing
  index, never had a `/page/1/` route) — this is Google's stale backlog
  from before the pagination redesign, not a live defect.
- **"Esclusa in base al tag noindex" (new-reason email)**: same as the
  08-08 diagnosis — Google recognizing the intentional `noindex,follow` on
  tag/category/pagination hub pages. Not a regression; no action.
- **`/rss.xml` in "crawled, not indexed"**: expected, it's a feed not a page.

### Proposed fix — stop relying on `mod_dir`, redirect the slash ourselves

Add a rule to `public/.htaccess` (the release-level file, the only one
proven to reliably fire on this host per the 08-13 findings) that adds the
trailing slash directly, before Apache's own `mod_dir` gets a chance to
build a redirect from the rewritten path:

```apache
# Add the trailing slash ourselves instead of letting Apache's own mod_dir
# DirectorySlash do it. By the time this file runs, the docroot .htaccess
# has already internally rewritten the request to current/$1 (preserving
# the original's missing slash) -- mod_dir builds its own redirect from
# that rewritten path, which leaks /current/ into the Location header for
# every non-trailing-slash URL on the entire site. This rule fires first,
# using $1 (the per-directory-relative path, already current/-stripped at
# this point) to build the correct canonical target instead.
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_URI} !/$
RewriteRule ^(.*)$ https://albertoarena.it/$1/ [R=301,L,QSA]
```

Placed after the existing current/releases-block rule (so a direct hit on
`/current/...` still gets handled by that rule first) and before the
host-canonicalization rules.

**Verification plan — deploy then live-check, no local repro this round:**

The 08-08 round tested against a local Homebrew Apache instance before
touching production. Revisited 2026-08-28: local dev on this machine is
Herd (nginx), which doesn't read `.htaccess` at all and has no equivalent
of `mod_dir`'s automatic directory-slash behavior — the exact interaction
this bug is about. Testing this rule under nginx would look fine
regardless of whether it actually works, which is worse than not testing.
Rather than add an Apache install for a one-off check, this round skips
local repro and verifies directly against production immediately after
deploy, with rollback being a one-file revert + push (~5 min via the pull
cron) if the hop count comes back wrong.

1. Ship the `public/.htaccess` rule.
2. Deploy (existing server-pull pipeline, ~5 min after merge).
3. Immediately live-`curl -sI` the exact URLs from this round's GSC
   sample — `/pages/credits`, `/projects`, `/category/static-websites`,
   `/tag/javascript`, `/current/pages/credits/` — and confirm
   `num_redirects=1` (or 2 for `http://`+`www` combinations, matching the
   08-08-confirmed floor) with **no `/current/` appearing at any hop** in
   any case, including the direct `/current/...` hit (must still collapse
   to one hop, not regress to two).
4. If any case still shows `/current/` in a `Location` header or an
   unexpected hop count, revert immediately (same PR's revert commit) —
   don't leave a half-working rewrite live on a domain-wide `.htaccess`.
5. In Search Console: re-request "Convalida" on "Pagina con
   reindirizzamento" only after step 3 passes clean — don't request it
   speculatively, this row has now failed validation across five
   consecutive rounds and a sixth request without a verified fix underneath
   it just burns another 1-2 week cycle for nothing.
6. Leave "Esclusa in base al tag noindex" and "Crawled, not indexed" alone
   this round (no code change targets them directly); re-assess once the
   redirect fix has had a couple of weeks to propagate, since it may
   indirectly unblock the noindex reclassification too.

### Implementation order

1. Ship the `public/.htaccess` rule, PR + merge per the git-workflow rule
   (fixes are fine direct to master, but given the domain-wide blast radius
   and five prior failed rounds on this exact row, route it through a PR
   for a second look before merging).
2. Deploy (existing server-pull pipeline, ~5 min after merge).
3. Live-`curl` verification against production (step 3 above), revert
   immediately if it doesn't check out clean.
4. Search Console validation request (step 5 above) only after step 3
   passes.

### Cross-site confirmation: same bug reproduces on trussphp.com

trussphp.com shares this exact `releases/<ts>` + `current` symlink deploy
mechanism (see `DEPLOYMENT.md`) and was independently investigating its own
"page with redirect" alert at the same time. Flagged the `/current/`-leak
hypothesis to that session as worth checking there; confirmed reproducible:
`https://trussphp.com/roadmap` (no trailing slash) → `.../current/roadmap/`
→ `.../roadmap/`, same two-hop shape, same root cause (their `cc4d8af`,
13/08, is the equivalent of this repo's `b5ade8e3` — cleans up the second
hop, doesn't prevent the first).

One correction to the original flag: it was speculated the leak might
already be sitting inside trussphp's "page with redirect" bucket,
misdiagnosed as the expected permanent state. Checked and it is not — both
rows there show a complete set (pagination `1-2 di 2`, all four URLs
already slashed), not a subsample, so the leak genuinely hasn't surfaced
in their GSC data yet. Their site is earlier on the same curve this one is
on. This is the case behind playbook step 2 above (sample vs. complete
set) — good to get this from an independent check rather than assuming.

No action needed here beyond the playbook update — this is trussphp.com's
fix to ship, tracked in its own repo.

### Shipped, deployed, live-verified; GSC validation requested

PR [#32](https://github.com/albertoarena/albertoarena.it/pull/32) merged
to `master`. CI publish run succeeded, server-pull cron deployed within
~5 min. All five `curl -sI` cases from the PR's test plan verified clean
against production — no `/current/` at any hop, hop counts exactly as
predicted (1 hop for `/pages/credits`, `/projects`, `/tag/javascript`; the
direct `/current/pages/credits/` hit still collapses to 1 hop, not
regressed to 2; the `http://www.albertoarena.it/category/react` combo at
2 hops, matching the confirmed floor). Broader smoke test also clean:
homepage, static assets (`favicon.svg`, `photo.jpg` — confirms the new
rule's `-d` check doesn't misfire on files), an already-canonical post,
the 08-24 slug-rename redirect, RSS, sitemap, `robots.txt`, the custom 404
page, and the `/writing/page/2/` pagination route all behaved correctly.

User clicked "Convalida" on "Pagina con reindirizzamento" in Search
Console, 2026-08-28.

**Next check-in:** per the playbook, validation cycles run days to weeks —
no dashboard change expected immediately. Come back to this doc rather
than re-diagnosing from scratch. If this row still fails validation after
this round despite the fix being live-verified correct, the `/current/`
leak can be ruled out as the cause (unlike prior rounds, this one has
direct production evidence the redirect is now clean) and the remaining
gap is most likely just Google's own recrawl/reclassification lag.
