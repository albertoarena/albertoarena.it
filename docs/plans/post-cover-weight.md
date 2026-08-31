# Post cover weight

**Status:** Phase 1 done. Phase 2 not started.
**Date:** 2026-08-31
**Related:** `three-ways-to-build-a-laravel-erd` (the cover that surfaced it),
`lighthouserc.json` (already in CI, asserts accessibility only)

## Context

The cover for `three-ways-to-build-a-laravel-erd` is **273 KB**, the largest on
the site. It is the LCP element on that page: `loading="eager"`,
`fetchpriority="high"`, and it is the article written to rank for the `laravel
erd` category term, so it is the page where load cost matters most.

**The whole site has the same shape to a lesser degree.** 33 covers, **3.2 MB
total, 100 KB mean**, and nine of them over 150 KB.

## The diagnosis that was wrong, and the one that is right

**First guess, and it was wrong: bad encoding settings.** It is not. Every cover
checked is 1200x630, **quality 85**, chroma subsampling 2x2, which are sensible
choices. `the-laravel-schema-nobody-chose` is 91 KB and
`context-engineering-not-slop` is 90 KB **at identical settings**.

**So the variable is the image content, not the encoder.** The ERD cover is
railway tracks and gravel photographed from above: dense high-frequency texture,
which is close to worst case for any lossy codec. The 90 KB covers have larger
flat areas.

**Measured on the actual file, rather than estimated:**

| Treatment | Size | Saving |
|---|---|---|
| Original | 273,313 B | |
| `-strip` only | 269,958 B | **1.2%** |
| `-strip -quality 80` | 249,561 B | 8.7% |
| `-strip -quality 75` | 231,527 B | 15% |
| WebP q80 | 206,274 B | 25% |
| WebP q72 | 170,278 B | **38%** |

**Two things this kills.** Stripping metadata is worth 3 KB here, not the tens of
KB it is worth on camera originals. And re-encoding the JPEG is worth **under 10%**
at a quality drop that is more visible on a detailed photo than on a flat one.
**There is no cheap win by re-encoding.**

## The constraint that shapes every option

**The cover file is doing two jobs with different requirements.**

- **The social card.** `og:image` and `twitter:image` both point at it, with
  `twitter:card: summary_large_image`. Scrapers need a **stable absolute URL** and
  a **widely supported raster**. LinkedIn's WebP handling is patchy. This file must
  stay a JPG at an unhashed path.
- **The in-page image.** This is the LCP element and has no such constraints. It
  can be WebP or AVIF, and it can be served at the size actually displayed.

**Serving one file for both is why this is hard.** Converting the cover to WebP to
save 38% would risk the social card, which is the same class of error as pointing
`og:image` at an SVG.

## Phase 1: this article only

**Goal: reduce the in-page LCP cost without touching the social card.**

1. **Measure the displayed width first.** The `<img>` declares 1200x628. If the
   post content column renders it at roughly 700 px, a phone at 375 px is being
   sent a 1200 px image for a third of that. **Responsive sizing is very likely a
   bigger win than codec choice, and it has not been measured.** Do this before
   anything else, because it may make the rest unnecessary.
2. **Add a WebP alternative for the in-page render only**, via `<picture>` with a
   JPEG fallback, or Astro's `<Image>`. WebP q72 measured 170 KB against 273 KB.
   **Leave `og:image` and `twitter:image` pointing at the JPG.**
3. **Do not re-encode the JPG below quality 80.** Under 10% saving, visible cost on
   this image, and it degrades the social card everyone sees.
4. **Consider the image itself.** If a less texture-dense crop or frame reads as
   well, it is worth more than every codec option combined: the 90 KB covers prove
   1200x630 can be light on this site without any special handling.

**Do not move the file into `src/`.** `public/` bypasses Astro entirely, which is
the underlying cause, but Astro's processed assets get hashed filenames and the
social card needs a permanent URL. That split is Phase 2 work, not a quick fix.

### Phase 1 result, shipped 2026-08-31

**Measured the displayed width first, per step 1**, with `npx lighthouse` against
a local build rather than estimating: the `uses-responsive-images` audit reports
the actual rendered `boundingRect` of the `<img>` node. Mobile (412px viewport,
Lighthouse's default emulation, DPR 1.75): **364 CSS px**. Desktop (`--preset=desktop`,
1350px viewport, DPR 1): **784 CSS px**. Confirmed live in a real browser too
(`img.clientWidth` at a 1528px window: **782px**, `devicePixelRatio: 1`) — matches.
So the "roughly 700 px" guess in step 1 was close but on the low side for the
common wide-desktop case.

**Went with step 2's `<picture>` + WebP route, plus responsive sizing in the same
element**, since generating three widths cost nothing extra once generating one
did. `public/images/posts/three-ways-to-build-a-laravel-erd/` now also has
`cover-700.webp`, `cover-900.webp` and `cover-1400.webp`, built from the original
Unsplash download at the same center crop as `cover.jpg`, quality 78. **900w
exists because 700/1400 alone left a gap**: the measured 784px desktop slot sits
between them, so with only two widths every DPR-1 desktop hit rounded up to the
1400w file. `og:image`/`twitter:image` still resolve to `cover.jpg`, untouched,
confirmed in the built HTML.

`PostLayout.astro` renders the `<source>` only when a post has all three
`cover-{700,900,1400}.webp` files sitting next to its `cover.*` (checked with
`fs.existsSync` at build time) — every other post keeps the plain `<img>` it had
before, unaffected. Confirmed in the build output.

**Before/after, `uses-responsive-images` audit on this page:**

| | Before | After |
|---|---|---|
| Mobile (412px, DPR 1.75) | `cover.jpg`, 273,313 B, **72% wasted** | `cover-700.webp`, 77,576 B, 18% wasted |
| Desktop (1350px, DPR 1) | `cover.jpg`, 273,313 B, **58% wasted** | `cover-900.webp`, 120,238 B, 25% wasted |

Neither hits 0% waste — three discrete widths can't match every viewport exactly,
and closing that last gap is a diminishing return not worth chasing here. **Not
done**: the "less texture-dense crop" option in step 4, and re-encoding the JPG
(correctly, per step 3 — it wasn't touched).

## Phase 2: the other 32 covers, and stopping it recurring

**Not urgent.** The mean is 100 KB and most covers are fine. Including the ERD
cover, nine site-wide are over 150 KB; excluding it, the other eight are:

```
261 KB  generator-vs-ai-skill              158 KB  ai-laravel-event-sourcing
227 KB  the-bug-that-only-showed-up...     157 KB  claude-code-auto-mode-still-needs-a-human
210 KB  domain-using-spatie-event-sourcing
189 KB  introducing-envaudit
174 KB  goal-command-claude-code
163 KB  introducing-truss
```

**Two pieces of work, in this order:**

1. **A per-file size budget as a Vitest test, not a Lighthouse assertion.**
   `lighthouserc.json`'s `collect.url` is a hardcoded two-entry array (`/` and
   `/posts/goal-command-claude-code/`). A `resource-summary:image:size`
   assertion there only ever runs against those two fixed pages — it would not
   have caught the ERD cover (that page isn't tested at all) and won't catch
   any future post unless the URL array is also kept in sync by hand, which
   defeats the "stops it recurring" goal. Instead, add
   `tests/image-budget.test.ts`: glob `public/images/posts/*/cover.*`, assert
   each file is under a byte budget (300 KB, matching the figure above).
   Wire it into the existing `test` script in `package.json`, alongside
   `test:eligibility`, `test:seo-indexing`, etc. — that script already runs
   in `test.yml` before the Lighthouse step, so no CI file changes are
   needed, and unlike the Lighthouse route it checks every cover on every
   PR regardless of which pages happen to be in `lighthouserc.json`.
2. **The structural split.** Social card JPG stays in `public/` at a permanent URL;
   the in-page image moves into `src/` and goes through Astro for WebP or AVIF and
   a responsive `srcset`. `sharp` is already a dependency. This is the real fix and
   it is the only one that also helps every future post automatically.

**Order matters.** The budget first, because it stops the problem growing while the
structural work waits. Doing the structural work first and the budget never is how
this comes back in six months.

## What this plan does not claim

**It has not been shown that the cover is actually hurting anything measurable.**
Lighthouse asserts accessibility only, so there is no performance baseline for this
site, and no Core Web Vitals reading has been taken on the new article. **The case
here is that 273 KB is avoidable, not that it is currently costing traffic.** If a
performance baseline is wanted, that is its own task and should be done before
anyone claims an improvement.
