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

## Task 6: CI automation — manual GEO audit

Add `.github/workflows/geo-audit.yml` using the composite action
`Auriti-Labs/geo-optimizer-skill@v4.14.0` (free, open source, same tool
behind the report — no Studio subscription needed for this check) against
`https://albertoarena.it`, `format: json`, with the score/band written to
the job summary and the full report uploaded as a workflow artifact.

Originally designed around `format: sarif` uploaded to GitHub's code-scanning
tab, matching the action's own README example. Dropped after the first real
run: GitHub's SARIF ingestion expects finding locations as `file://` URIs
relative to a checked-out repo (it's built for source-code analysis), but
this workflow never checks out the repo — it's auditing a live URL, so the
tool emits `https://...` URIs and GitHub rejects the upload outright
("SARIF URI scheme https did not match checkout URI scheme file"). SARIF/
code-scanning isn't the right fit for a live-URL audit; job summary + artifact
is simpler and actually works.

Trigger: `workflow_dispatch` only — not `schedule`, not `push`/`pull_request`
like `test.yml`. See finding below for why the schedule was dropped.

Leave `min-score` unset initially (observe-only) for a few runs; revisit
setting a gate once Tasks 1-5 land and a stable baseline score is known.

**Real finding from the first two runs (2026-08-05):** both reported a
`0/100 critical` score. Not a real regression — every HTTP request from the
runner hit a TCP *connect* timeout, never reaching TLS/HTTP at all, and the
tool silently falls back to 0 on total failure instead of erroring the job.
The same commit's `deploy.yml` verification step (`curl https://albertoarena.it/`
from an identical `ubuntu-latest` runner) got `200` around the same time, and
that same deploy workflow had itself failed once on this commit two days
earlier before succeeding on manual retry — so plain `curl` reaches the host
fine. What ruled out ordinary IP-reputation blocklisting: the failure was
2/2, reproducible, across two independent runner instances (different
ephemeral IPs, ~15 minutes apart) — if only *some* fraction of GitHub's IP
pool were blocked, an occasional pass would be expected. Getting it every
time, while `curl` (different TLS handshake) passes every time, points more
specifically at TLS-fingerprint-based bot blocking on Netsons' side — a
common WAF technique (Cloudflare/Imunify360/Sucuri-style) that silently
drops (not rejects) requests matching known non-browser TLS client
signatures, which is exactly why this is a connect timeout rather than a 403.

Given that, this is unlikely to ever return a real score against this host
as currently configured, so a `schedule` trigger would just produce a false
"critical 0/100" every week — noise, not signal. Dropped the `schedule`
trigger; `workflow_dispatch` stays so the audit can still be run manually,
e.g. once hosting changes (the already-planned server-pull deployment
migration, `docs/plans/server-pull-deployment.md`) or the TLS-blocking
question gets resolved on Netsons' side. The job summary still prints a
warning when score is exactly 0, for whenever it is run.

**Acceptance:** workflow runs via manual dispatch, writes score/band to the
job summary, uploads the JSON report as an artifact, doesn't fail the build
while `min-score` is unset.

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
4. GEO audit workflow is manual-dispatch only, not scheduled or per-push —
   it checks the live site, not the diff, so per-commit runs would be
   redundant, and a schedule would just repeat a false 0/100 every week
   given the TLS-fingerprint blocking finding in Task 6.

## Definition of done

- `WebSite` JSON-LD present alongside `Person` on every page.
- `/.well-known/ai.txt` live at site root.
- `Crawl-delay` present in `robots.txt`.
- No dead `<head>` asset links.
- `mailto:hello@albertoarena.it` reachable from the About page.
- `geo-audit.yml` runnable via manual dispatch, score/band in job summary,
  report artifact uploaded, no CI gate yet.
