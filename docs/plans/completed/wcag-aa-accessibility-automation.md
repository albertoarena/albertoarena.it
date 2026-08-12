# WCAG AA accessibility: CI automation + fixes

**Status:** Merged ([PR #20](https://github.com/albertoarena/albertoarena.it/pull/20), 2026-08-12)
**Date:** 2026-08-12

## Context

User ran [WAVE](https://wave.webaim.org/) against `https://albertoarena.it/`
(homepage + `/writing`) and shared screenshots (Details, Order, Structure,
Contrast tabs, plus each alert isolated one at a time via WAVE's checkbox
filters). WAVE has no export/report-download feature on the free web tool,
so this plan is grounded in those screenshots plus a repo grep to match
each flagged element to its source — not a full crawl of every page.
Shipping the CI automation in Part 1 is how the rest of the site gets
covered going forward.

### What WAVE found on the two scanned pages

| Category | Count | Meaning |
|---|---|---|
| Errors | 0 | No hard WCAG failures detected |
| Contrast errors | 0 | No automated contrast failures |
| Alerts | 5 | Needs human judgment — not automatically pass/fail |
| Features | 3 | Things WAVE confirms are working (1 skip link) |
| Structure | 22 | Headings/lists/landmarks, informational |
| ARIA | 28 | ARIA attributes present, informational |

The 5 alerts, matched against the codebase:

1. **3× "Very small text"** — confirmed via the isolated-alert screenshot:
   all three hits are the nav section labels "READ" / "BUILD" / "WORK" in
   `src/components/Rail.astro:51` (`text-[0.625rem]` = 10px, `aria-hidden`
   group header rendered once per `railNav` group — 3 groups → 3 flagged
   instances of the same class). WAVE's threshold is roughly text below
   ~10px. This isn't itself a WCAG AA failure (the site uses `rem`, so it
   still scales with the user's browser font-size setting, satisfying 1.4.4
   Resize Text) but it's a real readability concern for low-vision users and
   cheap to fix. Note: the bio (line 40) and location block (line 78), both
   `text-[0.6875rem]`/11px, were *not* flagged — only the 10px labels
   crossed WAVE's threshold.
2. **1× "Noscript element"** — `src/layouts/BaseLayout.astro:237`, the GTM
   `<noscript><iframe>` fallback pixel. This is expected and not a WCAG
   issue; WAVE flags every `<noscript>` block for manual review to confirm
   it doesn't hide content a JS user would otherwise get. It doesn't — no
   action needed.
3. **1× "Long alternative text"** — confirmed via the isolated-alert
   screenshot on `/writing`: it's the cover image for the post "My coding
   agent kept inventing columns"
   (`src/content/posts/my-coding-agent-kept-inventing-columns/index.md:16`):
   ```
   coverAlt: "A two-way radio handset centred against a moody
   blue-to-purple gradient backdrop, its reflection faint below"
   ```
   111 characters — WAVE's long-alt-text threshold is ~100 chars. WCAG
   1.1.1 doesn't set a hard length cap, but alt text this scene-setting
   reads as a caption, not a functional description, and screen-reader
   users hear the whole thing before the post title. A repo-wide check
   found two more `coverAlt` values close to the same threshold worth
   trimming in the same pass: `the-schema-doctor-is-in` (96 chars, "A
   stethoscope resting on a handwritten notebook next to a laptop
   keyboard, in black and white") and `introducing-truss` (91 chars, "A
   steel truss lattice shot from below against a bright sky, bolted
   joints forming a grid"). Recommend rewriting all three to the essential
   subject only (roughly the pattern already used by shorter ones like
   `introducing-envaudit`: "A rusty old key on a wooden table, photo by
   Nick Russill on Unsplash").
4. **Skip link, ARIA landmarks, language attribute** (the 3 Features / 22
   Structure / 28 ARIA counts) — confirmed via the isolated-alert
   screenshot: skip link, skip-link target, and `lang` attribute all
   present and correct. No action; the CI check in Part 1 turns this into a
   regression guard going forward.
5. **Contrast** — 0 errors, and the sampled swatch in the Contrast tab
   passes both AA and AAA. WAVE's own caveat (visible in the screenshot):
   it cannot check contrast where a background is an image or gradient, or
   uses transparency. Worth a manual spot-check on cover-image overlays and
   the cookie-consent buttons, but not a known problem today.

### Second page scanned: a post page

`https://albertoarena.it/posts/my-coding-agent-kept-inventing-columns/` —
7 alerts (vs. 5 on the homepage/`/writing`), 0 errors, 0 contrast errors.
Two of the alerts are new template-level issues (post pages only), not
repeats of the homepage findings:

6. **1× "Redundant alternative text"** — confirmed via the isolated-alert
   screenshot: the author bio avatar image at the bottom of every post
   (`src/layouts/PostLayout.astro`, `post-author` block, `alt=
   {siteConfig.author.name}`) has alt text identical to the visible name
   text rendered immediately next to it (`<p>{siteConfig.author.name}
   </p>`). A screen-reader user hears "Alberto Arena" twice in a row for no
   reason. **Fix:** since the name is already conveyed as adjacent text,
   the image is decorative in this context — set `alt=""` rather than
   duplicating it. This is a shared layout, so the fix applies to every
   post page at once, not just this one.
7. **1× "Skipped heading level"** — confirmed via `grep -n "<h[1-6]"
   src/layouts/PostLayout.astro`: the page's heading sequence is `h1`
   (post title) → `h2` × N (prose body headings, plus the "Liked this? Get
   the next one." newsletter box at line 287) → `h4` (desktop sidebar "On
   this page" TOC, line 341) → `h4` (series-nav widget, line 356). There is
   no `h3` anywhere in the template, so both sidebar widgets skip a level.
   **Fix:** change both `<h4>` tags (lines 341, 356) to `<h3>`. Both
   headings live in the `<aside>`, outside the `.prose` typography-plugin
   wrapper, and already carry explicit Tailwind classes for size/weight —
   changing the tag name has no visual effect, purely fixes the semantic
   hierarchy. Shared layout, so this also fixes every post page at once.

The repeated findings on this page — the same `coverAlt` long-alt-text hit
(expected, it's this post's own cover image), the same 3 `Rail.astro`
small-text instances, and the same GTM noscript alert — confirm those are
sitewide/template-level rather than page-specific, which is exactly what
the Part 1 CI crawl is meant to catch automatically across every URL
instead of relying on manual page-by-page WAVE runs.

## Part 1 — automate WCAG checks in CI

### Recommended approach: axe-core crawl over the built site

The repo already has `puppeteer` as a devDependency (used by
`scripts/generate-cheatsheet-pdf.mjs`) and a `test:*` pattern of
`astro build && vitest run tests/*.test.ts` (see `test:eligibility`,
`test:seo-indexing`, `test:geo-aeo` in `package.json`). Follow the same
shape rather than introducing a new test runner:

1. Add `tests/accessibility.test.ts`.
2. Build the site (`astro build`), serve `dist/` locally (e.g.
   `astro preview` on a fixed port, or a small `http-server`/`sirv`
   process spawned from the test's `beforeAll`).
3. Read the generated `dist/sitemap-0.xml` (via `@astrojs/sitemap`, already
   configured) to get the full, current URL list — not a hardcoded array,
   so new posts/pages are covered automatically without editing the test.
4. For each URL: launch via the existing `puppeteer` dependency, inject
   `axe-core` (`@axe-core/puppeteer` or `axe-core` + `page.evaluate`), run
   with tags `['wcag2a', 'wcag2aa', 'wcag21aa']`, collect violations.
5. Assert zero `serious`/`critical` violations across all pages; print
   `moderate`/`minor` violations as warnings (non-failing) to avoid false-
   positive CI breaks from third-party embeds (Disqus, GTM) the site
   doesn't control.
6. Wire into the composite `npm run test` (already invoked by
   `.github/workflows/test.yml`) as `test:accessibility`.

This gives full-site coverage for free (no new paid service, no API key),
matches the existing test conventions, and — per this repo's own working
agreement — ships with its own test rather than being a bare script.

### Keep Lighthouse CI, but understand what it actually covers

`lighthouserc.json` already asserts `categories:accessibility: minScore 1`
in `.github/workflows/test.yml`, but only against 2 URLs (`/` and one post).
Lighthouse's accessibility category is itself axe-core under the hood, so
it's redundant with Part 1 above rather than complementary — keep it as a
cheap smoke test on a couple of representative templates (home, post), but
treat the new axe-core crawl as the source of full-site truth. Not worth
expanding Lighthouse's URL list to every page: it's slow per-page and adds
no coverage the crawl doesn't already give.

### Not recommended: WAVE's official API

WebAIM sells a [WAVE API](https://wave.webaim.org/api/) for automation
(~$0.01/page/scan, tiered API-key billing). It would reproduce what the
free axe-core approach above already does, at a recurring dollar cost and
with an external dependency/API key to manage. Skip it — axe-core covers
the automated need; WAVE's free browser extension remains useful for the
kind of manual spot-check the user just did.

## Part 2 — WCAG 2.1 AA-relevant fixes, in priority order

1. **Bump the nav group label size in `Rail.astro:51`** from
   `text-[0.625rem]` (10px) to at least `0.75rem` (Tailwind's `text-xs`,
   already used elsewhere in the codebase for similar meta text — see
   `PostListRow.astro`, `PostLayout.astro`). Low effort, no layout risk
   given the rail's generous spacing; fixes all 3 flagged instances at once
   since it's one class shared by the 3 nav groups.
2. **Shorten the 3 long `coverAlt` values** identified above
   (`my-coding-agent-kept-inventing-columns`, `the-schema-doctor-is-in`,
   `introducing-truss`) to concise subject descriptions, dropping the
   scene-setting/mood phrasing.
3. **`PostLayout.astro` template fixes** (both apply to every post page at
   once): set the author-bio avatar's `alt=""` (redundant with adjacent
   visible name, line ~272), and change the two sidebar `<h4>` headings to
   `<h3>` (lines 341, 356) to remove the skipped heading level.
4. **Ship the axe-core CI crawl (Part 1)** before or alongside these fixes
   — it will independently confirm all of the above and catch anything
   WAVE's two-page manual scan missed on the other ~80 pages (posts, tag
   pages, cheat sheets, series index, etc.).
4. **Manual contrast spot-check** on non-solid-color surfaces WAVE can't
   automatically verify: post cover-image overlays with text, the
   dark-mode toggle icon against its background, cookie-consent buttons.
   Use WAVE's own Color Picker/eye-dropper (visible in the Contrast tab) or
   the axe DevTools browser extension.
5. **No action**: the noscript GTM pixel, and the existing skip
   link/landmarks/heading structure — already correct, now covered by the
   CI regression guard instead of needing a one-time fix.

## Part 3 — tools

| Tool | Cost | Use |
|---|---|---|
| **axe-core** (`@axe-core/puppeteer`) | Free | CI crawl, Part 1 — reuses the existing `puppeteer` devDependency and `astro build && vitest run` pattern |
| **Lighthouse CI** | Free | Already wired into `test.yml`; keep as a 2-page smoke test, not full coverage (same engine as axe-core under the hood) |
| **WAVE browser extension** | Free | Manual spot-checks like the one that started this plan — good for occasional human review, not for CI |
| **axe DevTools browser extension** | Free (Pro tier paid) | Alternative to WAVE for manual contrast/ARIA spot-checks, more detail on `moderate` issues |
| **WAVE API** | Paid (~$0.01/page) | Not recommended — axe-core in CI covers the same ground for free |
| **VoiceOver (macOS, built-in)** | Free | Periodic manual screen-reader pass — automated tools can't verify reading order or announcement quality, only structure |

## Implementation order

1. Branch, then: `Rail.astro` small-text fix, the 3 `coverAlt` rewrites,
   and the two `PostLayout.astro` fixes (avatar `alt=""`, `h4`→`h3`) — all
   trivial, standalone, independently reviewable.
2. Add `tests/accessibility.test.ts` + `test:accessibility` npm script +
   wire into `npm run test` / `test.yml`.
3. Re-run WAVE manually on `/`, `/writing`, and this post page to confirm
   alert counts drop to 1 (noscript — expected, no fix needed) on each,
   and let the new CI crawl cover the rest of the site.
4. PR + merge.

## Out of scope for this round

- WCAG AAA-level targets (e.g. 7:1 contrast, sign-language alternatives) —
  not requested, and the site already passes AA per WAVE's contrast check.
- Third-party embed accessibility (Disqus comments, GTM) — outside this
  repo's control; excluded from the CI crawl's failing threshold via the
  serious/critical vs moderate/minor split in Part 1.

---

## 2026-08-12 update: shipped

All fixes above landed, plus several more the axe-core crawl (Part 1) found
on its first run that WAVE's spot checks never reached — this is exactly
the coverage gap Part 1 was meant to close.

### Additional WAVE-reported issue: `/projects/`, skipped heading level

User scanned a third page and found the same "Skipped heading level" alert.
Traced to `TrussPromo.astro` (shared by the homepage and `/projects/`): its
internal heading opens at `<h3>` ("Laravel Truss"), which is correct on the
homepage (nested under an `<h2>Current project</h2>` wrapper) but wrong on
`/projects/`, where the component is dropped in directly after the page's
`<h1>` with no wrapping `<h2>` — so that page goes h1 → h3.

**Fix:** changed `TrussPromo.astro`'s internal `<h3>`→`<h2>` and `<h4>`→`<h3>`
(both purely semantic — same explicit Tailwind classes control appearance
either way). This makes `/projects/` go h1 → h2 → h3 (correct) and turns the
homepage's outline into two sibling h2s ("Current project" then "Laravel
Truss") followed by h3 — also valid, since WCAG only forbids skipping
levels forward, not repeating a level.

### What the axe-core crawl found beyond WAVE's 3-page manual scan

Running the new full-site crawl surfaced 3 more real, previously-unknown
issues (WAVE was never pointed at these specific pages):

- **`/cheatsheets/spatie-event-sourcing/`**: the "Wrong"/"Right" pair
  labels used `text-red-500` (3.81:1 on white, needs 4.5:1) and the custom
  `--color-ok` token (4.35:1) — both just under threshold. Also one inline
  link (`text-accent hover:underline`, no default underline) relying on
  color alone, 1.64:1 against surrounding text (needs 3:1).
- **`/subscribe/` and `/projects/`**: the same `text-accent hover:underline`
  pattern on inline prose links (as low as 1.02:1 against surrounding text).
- **`/tags/`**: the `(count)` badge next to each tag used `opacity-75` on
  top of `--color-muted`, dropping an already-compliant 5.76:1 base color
  to 3.36:1.

**Fixes:**
- `src/styles/global.css`: `--color-ok` light-mode value `#1f8a55` →
  `#1c7a4c` (5.33:1; dark-mode value was already fine at 9.05:1, untouched).
- `src/pages/cheatsheets/spatie-event-sourcing/index.astro`: `text-red-500`
  → `text-red-600` (4.77:1; dark variant `text-red-400` already fine at
  6.54:1, untouched) on the "Wrong" label; the inline link's class changed
  from `hover:underline` to a default `underline`.
- `src/pages/subscribe.astro`, `src/pages/projects.astro`,
  `src/layouts/PostLayout.astro` ("discuss this post" block): same
  `hover:underline` → `underline` fix on every genuinely inline prose link
  (link-only button rows like TrussPromo's Docs/GitHub/Install or
  Pagination's Prev/Next were left alone — axe's `link-in-text-block` rule
  only applies to links embedded in surrounding text, not standalone link
  lists, and none of those were flagged).
- `src/pages/tags.astro`: `opacity-75` → `opacity-90` on the count badge
  (4.62:1).

All shade/opacity replacements were derived by rendering the real compiled
Tailwind/OKLCH output in a headless browser and computing WCAG contrast
ratios against it (not guessed), to land just over 4.5:1 with a small
margin rather than exactly at the boundary.

### One issue left unfixed, deliberately: MailerLite's "Subscribe" button

`/subscribe/`'s embedded newsletter form button (white text on `#5c92ff`,
2.99:1) is rendered entirely by MailerLite's remote `universal.js` per the
theme configured in MailerLite's own dashboard — nothing in this repo
controls it. **Action needed outside this codebase:** darken the button
background in MailerLite's theme editor to restore ≥4.5:1. The CI crawl
blocks `assets.mailerlite.com` (alongside Disqus/GTM) so this known,
external gap doesn't fail every future build.

### CI crawl implementation notes (`tests/accessibility.test.ts`)

- Walks every `*.html` in `dist/` (not just the sitemap, which deliberately
  excludes noindex'd tag/category/pagination pages — those are still
  publicly reachable and still need to be accessible), except
  `/page/N/`-pattern files, which are legacy `<meta http-equiv="refresh">`
  redirect stubs (see `src/pages/page/[page].astro`) — auditing them just
  races axe against the browser's own client-side redirect.
- A minimal in-process `node:http` static server serves `dist/`; no new
  dependency for this. `axe-core` was added as the one new devDependency
  (`puppeteer` was already present).
- 8-way concurrency to keep the full ~112-page crawl under 30s.
- **Found and fixed a real flakiness source during development**: every
  page runs a 0.3s `.animate-fade-in` opacity animation on load
  (`global.css`), and axe-core factors element opacity into its
  color-contrast math — a scan landing mid-fade reported a blended,
  transient "failure" that changed every run. Fixed by injecting
  `animation: none !important; transition: none !important` before each
  scan, which is standard practice for automated a11y scanning, not a
  workaround for a real bug (a human reader never perceives the mid-fade
  frame).
- Fails the build only on `serious`/`critical` axe violations;
  `moderate`/`minor` are logged as warnings. Verified stable across 5
  consecutive full runs after the fixes above (0 failures).
- Wired into `package.json` as `test:accessibility` (`astro build && vitest
  run tests/accessibility.test.ts`) and into the existing `npm run test`
  composite, which `.github/workflows/test.yml` already runs on every push
  and PR — no workflow file changes needed.

### Verification

`npm run test` (all 6 suites, 58 tests) and `npm run build` both pass on
Node 20.19.5 (`.nvmrc`). Branch `wcag-aa-fixes` is ready for the user's
local review before merge.
