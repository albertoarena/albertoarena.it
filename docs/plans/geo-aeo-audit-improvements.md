# GEO/AEO audit follow-up

**Status:** Planned
**Date:** 2026-08-05

## Context

Ran the site through geoready.dev's GEO (generative engine optimization) audit,
built on the open-source `Auriti-Labs/geo-optimizer-skill`. Score: 65/100
(Foundation band). Cross-checked every flagged item against the actual repo
and build output before trusting it — the scanner turned out to be wrong or
stale on several points.

**False/stale flags** (verified, no action needed):
- "No llms.txt / no H1 / no sections" — `public/llms.txt` exists, well-formed
  (`# albertoarena.it` H1, `## Posts` section), byte-identical in `dist/`.
  Scanner likely mis-crawled.
- "Missing about page" — `/pages/about/` exists and is in `siteConfig.menu`.
- "Brand name inconsistent" — "Alberto Arena" is used consistently in
  `siteConfig.author.name`, JSON-LD, footer, header; the only variance is the
  `<title>` tag saying "A blog by Alberto Arena," not a real inconsistency.

**Real gaps** (this plan addresses these):
- No `WebSite` JSON-LD — only `Person` (`BaseLayout.astro:36-49`) and
  `BlogPosting` (`PostLayout.astro`) are emitted.
- No `/.well-known/` directory at all (no `ai.txt`, no `summary.json`).
- No `Crawl-delay` in `robots.txt`.
- "No contact info" — only *partially* true. `hello@albertoarena.it` is
  already a live, plain `mailto:` link on `/pages/privacy-policy/` and
  `/pages/credits/`, but not on the About page or anywhere the scanner
  associates with the brand entity.
- Not flagged by the scanner, but found while auditing: `BaseLayout.astro:98`
  links `/manifest.webmanifest`, which doesn't exist anywhere in `public/` —
  a dead link on every page.

**Deliberately not addressing:**
- "Low word count" / "no structured lists" — true for a handful of older,
  short posts (e.g. `i-moved-to-jekyll` at 274 words), not the corpus as a
  whole. Not a systemic problem; rewriting old posts to hit a word count is
  out of scope.
- `Organization` schema — the scanner wants it, but this is a personal blog,
  not a company; `Person` is the correct schema.org type here. Adding
  `Organization` on top would be redundant/wrong.
- Studio's paid citation-tracking product ($49/mo) — separate concern
  (whether ChatGPT/Perplexity actually cite the site), not a build-time or
  CI-checkable signal. Not part of this plan.

## Task 1: Add `WebSite` JSON-LD

Add a `WebSite` schema block in `BaseLayout.astro`, alongside the existing
`personSchema` (lines 36-49), with `@id` `${siteConfig.url}/#website`, `name`
from `siteConfig.title`, `url` from `siteConfig.url`, and `publisher`
referencing the `Person` by `@id`. Emit both as an `@graph` array in the
single `<script type="application/ld+json">` at line 92, rather than two
separate script tags.

**Acceptance:** valid JSON-LD on every page, validates with Google's Rich
Results Test / schema.org validator, no visual change, no duplicate `@id`s
with the existing `BlogPosting` block on post pages.

## Task 2: Add `/.well-known/ai.txt`

Create `public/.well-known/ai.txt` (served at `/.well-known/ai.txt`): a short
plain-text summary — one line identifying the site, one line pointing to
`/llms.txt` for the full index, one line noting all crawlers are welcome
(matches the current permissive `robots.txt`). No new content to write; this
just gives AI crawlers a second, more conventional discovery path to the
same information already in `llms.txt`.

**Acceptance:** reachable at `/.well-known/ai.txt` after build, content
doesn't duplicate-maintain anything — it only points elsewhere.

## Task 3: Add `Crawl-delay` to `robots.txt`

Add `Crawl-delay: 1` under the existing `User-agent: *` block in
`public/robots.txt`. Low-value signal (major crawlers mostly ignore it,
AI bots aren't rate-sensitive for a site this size) but zero-risk and closes
the scanner's warning.

**Acceptance:** `robots.txt` still validates, `Disallow:` and `Sitemap:`
lines unchanged.

## Task 4: Fix dead `manifest.webmanifest` link

`BaseLayout.astro:98` references `/manifest.webmanifest`, which doesn't
exist in `public/`. Two options, pick one during implementation:
(a) remove the `<link rel="manifest">` and the three adjacent
`apple-mobile-web-app-*`/`mobile-web-app-capable` meta tags if there's no
real PWA intent, or (b) add a minimal `public/manifest.webmanifest` (name,
icons, theme_color, display) if the PWA tags are meant to stay.

**Acceptance:** no 404 on any linked/referenced asset from `<head>`.

## Task 5: Contact email on the About page

`hello@albertoarena.it` is already a plain `mailto:` link on
`/pages/privacy-policy/` and `/pages/credits/` — it's already fully exposed
in plain text and indexed on two live pages, so obfuscating a *third*
instance on the About page would add friction for real visitors without
reducing scraper exposure at all (the address is already harvestable from
the other two pages). Adding a plain `mailto:hello@albertoarena.it` link to
the About page (`src/content/pages/about/index.md`, near the existing
X/LinkedIn links at line 31-32) matches the site's existing convention and
puts contact info on the page most likely to be treated as the brand/entity
page by scanners and AI crawlers.

**Acceptance:** `mailto:hello@albertoarena.it` present on the About page,
matches the address already used on privacy-policy and credits.

## Task 6: CI automation — scheduled GEO audit

Add `.github/workflows/geo-audit.yml` using the composite action
`Auriti-Labs/geo-optimizer-skill@v4.14.0` (free, open source, same tool
behind the report — no Studio subscription needed for this check) against
`https://albertoarena.it`, `format: sarif` so results surface in GitHub's
code-scanning tab.

Trigger: `schedule` (weekly) + `workflow_dispatch` only — not on `push`/`pull_request`
like `test.yml`, since this audits the live production URL, not the working
tree, and there's no value re-running it per-commit.

Leave `min-score` unset initially (observe-only) for a few runs; revisit
setting a gate once Tasks 1-5 land and a stable baseline score is known.

**Acceptance:** workflow runs on schedule and via manual dispatch, produces a
SARIF report visible in the Security tab, doesn't fail the build while
`min-score` is unset.

## Out of scope

- Rewriting existing post content for word count / list structure.
- `Organization` schema.
- Studio's paid citation-tracking product.
- Gating CI on a `min-score` threshold (deferred until a baseline is known).
- A dedicated `/contact` page or contact form.

## Decisions

1. `WebSite` and `Person` combined into one `@graph` JSON-LD block rather
   than two separate `<script>` tags — fewer parse targets, same output.
2. `ai.txt` content is a pointer to `llms.txt`, not a parallel index — one
   source of truth for the post list.
3. Contact email is a plain `mailto:`, not obfuscated — the address is
   already exposed in plain text on two other live pages, so obfuscating a
   third instance would add friction with no anti-scraping benefit.
4. GEO audit workflow runs on a schedule, not per-push — it checks the live
   site, not the diff, so per-commit runs would be redundant.

## Definition of done

- `WebSite` JSON-LD present alongside `Person` on every page.
- `/.well-known/ai.txt` live at site root.
- `Crawl-delay` present in `robots.txt`.
- No dead `<head>` asset links.
- Obfuscated email reachable from About page or footer.
- `geo-audit.yml` running weekly, SARIF uploaded, no CI gate yet.
