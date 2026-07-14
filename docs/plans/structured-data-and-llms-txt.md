# Structured data (JSON-LD) and llms.txt

**Status:** Approach agreed, pending implementation approval
**Date:** 2026-07-14

## Context

Follow-up to a Claude app review of SEO vs GEO (generative engine optimization)
readiness. The site is already in good shape: robots.txt allows all crawlers
including AI bots, sitemap and RSS exist, OG/Twitter/canonical/author meta tags
are complete. The one confirmed gap is structured data: no JSON-LD anywhere on
the site.

This plan closes that gap and adds an `llms.txt` file. Nothing else.

## Task 1: Audit current layout (done as part of this review)

- **No JSON-LD exists anywhere** in `src/layouts/BaseLayout.astro`, `src/components/Layout.astro`,
  or `src/layouts/PostLayout.astro`. Confirmed gap.
- **`<article>` and `<time datetime="...">` are already used** in `PostLayout.astro`
  (lines 47 and 59). No markup changes needed to satisfy schema requirements.
- **Author bio block** is rendered in `PostLayout.astro` (lines 95-107), sourced from
  `siteConfig.author` (`name`, `photo`, `bio`) in `src/utils/config.ts`. This is the
  right source for `Person` schema data.
- **`BaseLayout.astro` owns `<head>`** — this is where the sitewide `Person` JSON-LD
  block goes. `Layout.astro` (the component PostLayout actually imports) wraps
  `BaseLayout` with Header/main/Footer and doesn't touch `<head>` itself.

### Corrections to the original plan's assumptions

- **GitHub is not currently linked anywhere live.** `siteConfig.author.contacts.github`
  exists as a bare username, but the only code that turns it into a URL is
  `src/components/Sidebar/Contacts.astro`, which isn't imported by any page (the site
  is single-column, no sidebar, per CLAUDE.md — this looks like leftover dead code
  from an earlier layout). LinkedIn *is* on the site, but as a hardcoded raw URL
  written directly into the About page's markdown prose, not sourced from `siteConfig`.
  Twitter is the only one already wired into a meta tag (`twitter:creator`).
  None of this blocks Task 2 — we can build the GitHub/LinkedIn URLs from
  `siteConfig.author.contacts.*` the same way the dead Sidebar code already does — but
  the plan's premise that these links are "already used in existing meta tags" is
  only true for Twitter.
- **`dateModified` is not tracked.** The posts content collection schema
  (`src/content/config.ts`) has no `updated`/`lastmod`/`dateModified` field, only
  `date`. Task 3 should just omit `dateModified` rather than reading it from
  somewhere that doesn't exist — adding a new frontmatter field would mean touching
  every post's frontmatter, which is out of scope.
- **`socialImage` is missing on 8 of 23 posts.** `PostLayout` passes
  `image={post.data.socialImage}` down through `Layout` to `BaseLayout`, and
  `BaseLayout`'s prop default (`image = siteConfig.author.photo`) already covers the
  `undefined` case — this is exactly how the existing `og:image`/`twitter:image` tags
  handle it today. The Article schema's `image` field should reuse that same resolved
  URL (`socialImageURL` in `BaseLayout.astro`) rather than reading `post.data.socialImage`
  directly, so it never emits a missing/broken image URL.
- **No test suite exists** (no `test` script in `package.json`, no test framework
  installed). Task 5's "confirm existing tests still pass" has nothing to run —
  verification is manual (dev server + schema validator) only.

## Task 2: Add `Person` schema (sitewide)

Add a JSON-LD `Person` block in `BaseLayout.astro`'s `<head>`, built from `siteConfig.author`:
`name`, `photo` (absolute URL), `bio` as `jobTitle`, and `sameAs` linking Twitter/X,
LinkedIn, and GitHub (built from the username fields the same way the unused Sidebar
component does).

Give it a stable `@id` (e.g. `${siteConfig.url}/#person`) so Task 3 can reference it
by ID instead of repeating the full object on every post page — see open question below.

**Acceptance:** valid JSON-LD present in `<head>` on every page, validates with Google's
Rich Results Test and schema.org validator, no visual change to the page.

## Task 3: Add `BlogPosting` schema (per post)

Add a JSON-LD block in `PostLayout.astro`, populated from data already available there:
`headline` (title), `description`, `datePublished` (`post.data.date`), `author`
(reference the Task 2 `Person` by `@id`), and `image` (the resolved `socialImageURL`,
not the raw frontmatter field — see correction above).

**Acceptance:** valid JSON-LD on a sample post (e.g. `/posts/claude-md-is-ram-not-disk/`),
validates cleanly, no visual change, no duplicate/conflicting data with existing meta tags.

## Task 4: Add `llms.txt`

Create `public/llms.txt` (served at `/llms.txt`): one-line site description, a short
"about the author" line, and a list of all 23 posts with their URLs and existing
`description` field (no new copy). `pinned` isn't used for this — only 2 posts are
currently marked pinned, too thin to be a useful index on its own.

## Task 5: Verify

- Run the site locally, confirm no visual regressions.
- Validate JSON-LD on homepage and at least one post using a schema validator.
- Confirm `/llms.txt` is reachable after build/deploy.
- No automated test suite exists, so this step is manual only.

## Out of scope

- Rewriting or restructuring existing post content.
- `FAQPage`, `HowTo`, or other schema types beyond `Person` and `Article`/`BlogPosting`.
- Third-party AI-visibility tracking scripts.
- Changing URL structure, `robots.txt`, or sitemap config.
- Adding a `dateModified`/`updated` frontmatter field to posts.

## Decisions

1. **`BlogPosting`**, not generic `Article` — more specific type for this content,
   matches Google's own blog examples, same rich-result eligibility.
2. **`Person` deduped via `@id`** — defined once in `BaseLayout.astro` with a stable
   `@id` (`https://albertoarena.it/#person`); each post's `author` field references it
   by `@id` instead of repeating the full object.
3. **`llms.txt` lists all 23 posts**, not just the 2 currently `pinned:true` — pinned
   is too thin for a useful index here.

## Definition of done

- `Person` schema on every page.
- `BlogPosting` schema on every post, referencing `Person` by `@id`.
- `llms.txt` live at site root.
- No content rewrites, no new dependencies, no new frontmatter fields.
