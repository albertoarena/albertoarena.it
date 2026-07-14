# SEO Indexing Fixes

**Status:** Completed — all three fixes shipped (Fix 1 via `public/.htaccess` www/http→https redirect)
**Date:** 2026-05-25

## Problem

Google Search Console shows 86 non-indexed pages vs 15 indexed, with 5 distinct reasons:

| Reason | Pages | Priority |
|---|---|---|
| Page with redirect | 5 | Low (mostly correct) |
| Duplicate without user-selected canonical | 3 | High |
| Alternate page with proper canonical tag | 2 | Medium |
| Discovered, not indexed | 38 | Medium |
| Crawled, not indexed | 38 | Medium |

---

## Root Cause Analysis

### 1. www and http variants being served (not redirected)

The `.htaccess` currently only handles 404 pages and MIME types. It does **not** redirect:
- `http://albertoarena.it` → `https://albertoarena.it`
- `http://www.albertoarena.it` → `https://albertoarena.it`
- `https://www.albertoarena.it` → `https://albertoarena.it`

Evidence: Google found and crawled pages at `http://albertoarena.it/`, `http://www.albertoarena.it/`, `http://www.albertoarena.it/category/react/`, etc. as 200 responses — not redirects.

- The 2 "Alternate with canonical" pages are the http homepage variants; these are handled well (canonical tag is correct), but ideally Google should get a 301 instead.
- The 3 "Duplicate without canonical" pages are www/http category and tag pages. Google found them but the canonical tag may not have been recognised correctly, possibly because they are served with a different host.

### 2. Trailing slash redirects (Astro default behaviour)

Astro redirects `/projects` → `/projects/`, `/category/laravel` → `/category/laravel/`, etc. Google flagged 5 such redirects. These redirects are correct (the sitemap already uses trailing-slash URLs), so this is not a real problem — it will resolve itself as Google updates its index. The only action needed is to make sure internal links and any external links use the canonical trailing-slash form.

### 3. Thin content pages in sitemap (category / tag / pagination)

The sitemap includes all of the following:
- `/categories/`, `/category/ai/`, `/category/css/`, … (12 category pages)
- `/tags/`, `/tag/ai/`, `/tag/astro/`, … (30+ tag pages)
- `/page/2/`, `/page/3/` (pagination)

Google has either not bothered crawling them ("Discovered, not indexed") or crawled and rejected them ("Crawled, not indexed"). These are thin listing pages with no original content. Submitting them wastes crawl budget and signals low quality to Google.

### 4. Utility pages with /pages/ prefix

The sitemap submits `https://albertoarena.it/pages/credits/` and `https://albertoarena.it/pages/privacy-policy/`. The `/pages/` prefix in the URL is an artefact of the Astro content collection path. These pages appear in the "Discovered, not indexed" list, which means Google found them but didn't crawl them. They should either be excluded from the sitemap or given proper noindex treatment.

### 5. Posts "Crawled but not indexed"

Several posts have been crawled but not indexed. Examples: `goal-command-claude-code/`, `sharing-your-house-factory-method-pattern-can-help-you/`, `is-it-really-an-integer/`. This is a content-quality or domain-authority signal from Google. There is no quick technical fix — it will improve over time as the domain gains authority and posts are shared. No action planned for this phase.

---

## Proposed Changes

### Fix 1 — Add www/http → https redirects in .htaccess

Add 301 redirects to consolidate all traffic to `https://albertoarena.it`.

```apache
# Redirect www to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.albertoarena\.it [NC]
RewriteRule ^(.*)$ https://albertoarena.it/$1 [R=301,L]

# Redirect http to https (if not already handled by the server)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
```

**Impact:** Resolves "Duplicate without canonical" (3 pages) and "Alternate with canonical" (2 pages). Google will consolidate link equity to the canonical domain.

**Note:** Netsons exposes redirect configuration via cPanel (currently under maintenance as of 2026-05-25). Prefer setting these up through cPanel's Redirects tool when it's back — it writes the same `.htaccess` rules under the hood. Direct `.htaccess` editing is the fallback if cPanel doesn't expose the option.

---

### Fix 2 — Filter category, tag, and pagination pages out of the sitemap

Configure `@astrojs/sitemap` to exclude thin listing pages from the generated sitemap. This reduces the sitemap to pages that have real content (posts, about, projects).

In `astro.config.mjs`:

```js
sitemap({
  filter: (page) => {
    const url = new URL(page);
    const path = url.pathname;
    // Exclude category, tag, pagination, and utility listing pages
    if (path.startsWith('/category/')) return false;
    if (path.startsWith('/categories')) return false;
    if (path.startsWith('/tag/')) return false;
    if (path.startsWith('/tags')) return false;
    if (/^\/page\/\d+\/$/.test(path)) return false;
    return true;
  }
})
```

**Impact:** Removes ~45 thin-content pages from the sitemap. Focuses Google's crawl budget on posts and key pages. Addresses most of the "Discovered, not indexed" group.

**Note:** The excluded pages remain accessible — they just won't be submitted. Internal links to them still work.

---

### Fix 3 — Create robots.txt

A `robots.txt` file is currently missing. Create `/public/robots.txt`:

```
User-agent: *
Disallow:

Sitemap: https://albertoarena.it/sitemap-index.xml
```

This tells all crawlers they can access everything (matching current behaviour) and explicitly points to the sitemap. It's also a signal of a well-maintained site.

**Scope:** Minimal — just allow all + sitemap reference. No blocking of specific paths (category/tag pages are better handled by sitemap exclusion, not robots.txt, since we want them accessible to users).

---

## Out of Scope

- **"Crawled, not indexed" posts**: Content/authority issue. No technical fix is likely to help in the short term.
- **Italian post translations in sitemap**: `/posts/laravel-netsons-deploy/it/` is included in the sitemap alongside the English version, which is correct given the hreflang setup.
- **Adding noindex to category/tag pages**: More invasive than removing from sitemap; not needed if sitemap exclusion is sufficient.

---

## Implementation Order

1. Fix 1 — `.htaccess` redirects (simple, high impact, no build step)
2. Fix 3 — `robots.txt` (trivial, good hygiene)
3. Fix 2 — Sitemap filter in `astro.config.mjs` (requires a build + deploy)

After deploying, re-submit the sitemap in Google Search Console and request re-validation of the affected URL groups.
