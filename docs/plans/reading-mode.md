# Plan: Reading mode (native reader eligibility + in-site toggle)

**Status:** Phase 1 and Phase 2 implemented and verified — automated tests,
in-browser manual testing, and real iOS Safari/Chrome checks on an iPad
(both direct load and client-side navigation) all pass. Remaining: a real
keyboard-Tab check of the focus ring (automation gave an inconclusive
result), and the other manual QA checklist rows (Android Chrome, desktop
Firefox) if you want them covered too.
**Date:** 2026-07-26
**Source:** Adapted from a plan drafted externally (`reading-mode-plan.md`) against
the actual repo structure; several of its assumptions didn't hold and are
corrected below.

**Scope:** Two independent tracks:

1. Make post pages reliably detected by native readers (Safari Reader, Firefox
   Reader View, Chrome's simplified view) with clean extracted content.
2. Add an in-site "reading mode" toggle on post pages that hides site chrome
   and switches to reading typography, in every browser.

---

## What discovery found (this replaces the original plan's Phase 0)

The original plan asked an agent to inspect the repo before writing code.
That inspection has already been done directly:

| Question | Finding |
|---|---|
| Post layout | `src/layouts/PostLayout.astro`, wrapped by `src/components/Layout.astro` → `src/layouts/BaseLayout.astro` |
| Header / Footer / cookie banner | `Header.astro`, `Footer.astro`, `CookieConsent.astro` — all rendered in `Layout.astro`, **siblings of `<main>`**, not inside it. No fix needed here. |
| Post body wrapper | The entire `<article>` in `PostLayout.astro` contains the header (title/date/category), the prose body, the tags footer, the author bio box, **and the Disqus comments block** — all as one element. Looked like a reader-eligibility problem; measured and it isn't (see "Article structure" below). Still worth narrowing later for Phase 2 CSS ergonomics. |
| Prose wrapper class | `<div class="prose dark:prose-invert max-w-[68ch]">`. No positive identifying class like `post-content` exists yet. |
| Tailwind version | v4 (`tailwindcss@^4.3.1`, `@tailwindcss/vite`), global CSS at `src/styles/global.css`. Plain CSS selectors work the same regardless of version, so this doesn't change the approach. |
| Post date markup | Already `<time datetime={post.data.date.toISOString()}>{formattedDate}</time>` (`PostLayout.astro:74`). **Already correct, no fix needed.** |
| Cover image markup | Covers are not a template-rendered element — they're the first line of every post's Markdown body (`![alt](url)`), rendered by Astro's Markdown pipeline as a bare `<img>` inside the prose `<Content />`. Looked like a reader-eligibility problem; measured and it isn't (see "Cover image" below). |
| Test setup | **None.** No Vitest, no Playwright, no `test` script in `package.json`, no test files anywhere in the repo. This is a bigger lift than "run it as part of the existing pipeline" — the harness itself has to be built. |
| View transitions | `astro:transitions` `ViewTransitions` is enabled in `BaseLayout.astro` (not disabled for posts). Two existing precedents to reuse instead of inventing a new pattern: the theme toggle applies its `dark`/`light` class pre-paint via an `is:inline` script and re-applies on `astro:after-swap` (`BaseLayout.astro:102-136`); Disqus reloads itself on `astro:after-swap` (`DisqusComments.astro`). Reading mode should follow the same two proven hooks rather than a new mechanism. |
| CI | `.github/workflows/deploy.yml` builds and FTP-deploys on every push to `master`, with no test gate at all today. Adding a test step is optional for this plan, not a prerequisite. |

---

## Article structure — verified NOT a reader-eligibility problem

The original plan's 1.2 assumed the post body already sits alone in
`<article>` and just needed a class name. It doesn't — `PostLayout.astro`
puts **everything** inside `<article>`:

```
<article>
  <header> title, time, category, read time </header>
  <div class="prose ..."><slot /></div>      <!-- the actual post content -->
  <footer> tags </footer>
  <div> author bio box </div>
  <DisqusComments />
</article>
```

The theory (both the original plan's and this doc's first draft) was that
this is a reader-eligibility problem: a bloated `<article>` containing the
author bio and a Disqus mount point risks the extracted `byline`/`content`
picking up bio text or leaving an empty comments shell.

**That theory was tested empirically and turned out false.** Once the
eligibility harness was working (see below), running the real
`@mozilla/readability` assertions against the *current, unrestructured*
markup passed 18/18 on the first try, for both test posts — no changes to
`PostLayout.astro` needed. Direct inspection of `result.textContent`
confirms Readability already drops the nav labels, the author bio line, the
cookie banner copy, and the Disqus noscript fallback text, and picks up
`byline: "Alberto Arena"` correctly. Readability's scoring works on
individual block-level nodes (text density, link density) rather than
trusting `<article>` as a hard boundary, so short, link-dense, or
near-empty siblings inside the same `<article>` get pruned regardless of
container. The bare cover `<img>` inside a `<p>` (not a `<figure>`) is
likewise retained in the extracted content as-is.

**Revised conclusion:** no markup restructuring is required for Phase 1
(native reader eligibility) — that goal is already met. It turned out no
restructuring was needed for Phase 2 either, once the CSS was actually
written — see 2.3, "No DOM restructuring, in the end."

## Cover image — verified NOT a reader-eligibility problem

Same story. The original plan treated "wrap the cover image in `<figure>`"
as a fix for reader eligibility ("bare `<img>` inside a `<div>` is often
dropped by the reader"). Measured directly: the cover image (a bare `<img>`
inside a `<p>`, from the `![...]()` Markdown line that opens every post)
already survives into `result.content` unchanged. No rehype plugin is
needed for Phase 1.

It could still be a nice semantic improvement (a `<figure>` communicates
"this image belongs with a caption" more precisely than a bare `<img>` in a
`<p>`), but it's optional, cosmetic, and out of scope for this plan unless
requested separately — implementing it would mean a rehype plugin touching
~40+ existing posts for no measured eligibility benefit.

---

## Implementation branch

`feature/reading-mode`, cut from `master`.

## Sequencing: Vitest setup vs. markup fixes (as executed)

The plan was to decouple "the harness works" from "the markup is correct"
so a red test with no fix (or a fix with no test) couldn't get landed
separately. What actually happened, in order:

1. **Stood up Vitest in isolation** — `vitest`, `@mozilla/readability`,
   `jsdom` installed; a placeholder test (dist page exists and is
   non-empty for both fixed posts) proved the harness before any
   reading-mode-specific assertions existed.
2. **Fixed the two test posts**: code-heavy — URL slug
   `domain-using-spatie-event-sourcing` (content dir
   `create-a-domain-with-spatie-event-sourcing`; the frontmatter `slug`
   field differs from the dir name, and it's the frontmatter value that
   determines the `dist/posts/` path) — 115 lines of fenced code,
   ~980 words. Prose-heavy: `ai-hallucination-in-coding-agents` — zero
   code fences, ~730 words. Same two posts are used in the manual QA
   checklist.
3. **Wrote the real Readability assertions against current, unfixed
   markup, expecting red.** Got green instead, 18/18, on the first run —
   see "Article structure" and "Cover image" above. The markup fixes
   theorized in the original plan weren't needed; that section documents
   why, verified by direct inspection of `result.textContent`, not just
   the boolean pass/fail.
4. **Hit and fixed an unrelated environment blocker along the way**: see
   "Environment: Node version" below. Nothing to do with reading mode
   itself, but it blocked the harness from running at all until resolved.

## Phase 1: native reader eligibility

### 1.1 Eligibility test harness — done, green

There was no test runner in this repo before this plan. Added:
`vitest`, `@mozilla/readability`, `jsdom` as devDependencies;
`tests/reader-eligibility.test.ts`, running against `astro build` output in
`dist/` for the two fixed posts. Asserts, per post:

- `new Readability(doc).parse()` returns non-null.
- `result.title` equals the post's `<h1>` text.
- `result.textContent.length` is above a floor (1500 chars).
- `result.textContent` contains the first and last paragraph of the post.
- `result.textContent` excludes: nav link labels (`siteConfig.menu`), the
  author bio line (`siteConfig.author.bio`), the cookie banner copy
  (`CookieConsent.astro`), the footer copyright line (`Footer.astro`).
- `result.byline` is non-empty.

`package.json` scripts:

```json
"test:eligibility": "astro build && vitest run tests/reader-eligibility.test.ts",
"test": "npm run test:eligibility"
```

**Result: 18/18 assertions pass against the current, unmodified markup.**
No Phase 1 markup changes were needed (see "Article structure" and "Cover
image" above) — the harness's job here turned out to be confirming an
already-met goal, not driving a fix.

#### Environment: Node version

Standing up the harness hit a real blocker, unrelated to reading mode:
`jsdom@27` pulls `cssstyle` → `@asamuzakjp/css-color` → `@csstools/css-calc`,
and the last package ships ESM-only (no CJS entry point in its `exports`
map). Loading it via `require()` needs Node's native "require(esm)"
support, which only stabilized in Node 20.19+/22.12+. The local dev Node was
20.13.0 (pinned via nvm) — too old — and the crash reproduced identically
after swapping `jsdom` for `linkedom` (a different DOM implementation, same
Node-version wall via its own ESM-only `css-select` dependency), confirming
this was a Node version problem, not a library choice.

**Fix:** `.nvmrc` added at the repo root pinning `20.19.5` (already
installed locally via nvm, no new install needed); switched with `nvm use`.
`linkedom` was removed again since `jsdom` works fine once the Node version
is correct. Also added `"engines": { "node": ">=20.19.0" }` to
`package.json` so this doesn't silently bite the next person.

GitHub Actions' `deploy.yml` previously set `node-version: 20` (no lockfile
pin), which `actions/setup-node` resolves to the latest available 20.x —
almost certainly already >=20.19, so CI was unlikely to hit this in
practice. Changed anyway, with explicit user confirmation since it touches
the deploy pipeline: `deploy.yml` now uses `node-version-file: '.nvmrc'`, so
CI and local dev are guaranteed to run the same Node version instead of two
numbers that could drift apart.

### 1.2 Markup fixes

None required — see "Article structure" and "Cover image" above. Both
theorized fixes were tested against the real eligibility harness and found
unnecessary. The only structural change still planned is the `<article>`
narrowing, deferred to Phase 2.3 where it serves the toggle's CSS, not
reader eligibility.

- ~~Fix date markup~~ — already done, skip.
- ~~Move cookie banner out of `<main>`~~ — already correct, skip.

### 1.3 View transitions check

Post links live in `PostCard.astro:47` (homepage/list) and
`Pagination.astro` (prev/next). Same open question as the original plan:
browsers decide reader eligibility at document load, and Astro's client
router swaps the document without a full load.

- Manually verify on iOS Safari: direct URL load vs. tapping through from
  the homepage.
- If navigation breaks eligibility, add `data-astro-reload` to the anchor in
  `PostCard.astro` (and `Pagination.astro`'s post-to-post links, if any).
  This trades a little navigation speed for reader support — measure before
  committing to it site-wide.
- Record the outcome in a short comment in `PostLayout.astro`.

**Verified on real iOS Safari (iPad), 2026-07-26:** "Mostra modalità
Lettura" (Show Reading Mode) appears in Safari's page menu both on a direct
load of `domain-using-spatie-event-sourcing` and after tapping into the
same post from the homepage list. Astro's client-side navigation does
**not** break native reader eligibility — no `data-astro-reload` needed on
`PostCard.astro`/`Pagination.astro` links. This closes the last open item
in Phase 1.

---

## Phase 2: in-site reading mode

### 2.1 Behaviour spec

Same as the original plan, unchanged:

- Single toggle, visible only on post pages, fixed bottom-right, above the
  safe-area inset.
- Label "Reading mode" / "Exit reading mode", `aria-pressed` reflects state.
- `data-reading` attribute on `<html>`, backed by `localStorage['reading-mode']`.
- Applied pre-paint (no flash), survives client-side navigation, keyboard
  accessible, respects `prefers-reduced-motion`.

### 2.2 Verification — manual QA, no Playwright

Decided: Vitest only, no Playwright. The eligibility check earns its keep as
an automated regression guard (someone innocently adding a widget inside
`<article>` later would silently break reader extraction, and that's easy to
miss by eye). The toggle is a different kind of risk — a small, deterministic
piece of vanilla JS whose real failure modes (does Safari actually offer the
reader icon, does the toggle actually feel right) can only be judged by a
human in a real browser anyway. Playwright's webkit isn't real iOS Safari, so
it would mostly duplicate what the manual QA checklist below already covers,
for the cost of maintaining a second test framework and browser binaries in
CI, in a repo with no existing test gate.

The 7 behaviours from the original plan's spec become manual checks instead
of an automated spec, folded into the Manual QA checklist below:

1. Toggle off by default (no `data-reading`, header visible).
2. Click toggles the attribute, header hides, label/`aria-pressed` flip.
3. Reload keeps the mode on with no flash of normal layout.
4. Click again removes it, `localStorage` reads `0`.
5. Client-side navigation between posts preserves the mode.
6. Toggle doesn't render on the homepage or static pages.
7. Keyboard: focus + Enter toggles state.

`package.json` only needs the one script from 1.1:

```json
"test": "npm run test:eligibility"
```

If the toggle logic grows more complex later (font-size steps, serif option
in 2.4), revisit adding Playwright then — don't front-load it now.

### 2.3 Implementation — done

Because only post pages need the toggle, it's rendered directly in
`PostLayout.astro` (as `<ReadingModeToggle />`, sibling to `<article>`)
rather than conditionally in the shared `Layout.astro` — simpler, no new
prop needed.

**No DOM restructuring, in the end.** While writing the CSS it became clear
the theorized `<article>` restructure (moving tags/author/Disqus to be
siblings) wasn't needed even for CSS ergonomics: `Layout.astro` already
renders the sitewide `<Header />`/`<Footer />` as direct children of
`<body>`, while `PostLayout.astro`'s own internal `<header>` (title/date/
category) and `<footer>` (tags) are nested several levels deeper inside
`<main>`. A `body > header` / `body > footer` child-combinator selector
targets only the sitewide chrome, leaving the post's own same-tag-name
elements untouched — no need to move anything, just add three classes
(`post-content` on `<article>`, `post-tags` on the tags `<footer>`,
`post-author` on the bio `<div>`) and let `#disqus_thread`'s existing id
handle Disqus.

Pre-paint script added to `BaseLayout.astro`, right after the existing theme
script (same file, same proven `astro:before-swap`/`astro:after-swap` pair,
for one less place to keep in sync) — guarded to `/posts/` so a stored
preference never leaks onto non-post pages with no toggle to undo it:

```astro
<script is:inline>
  function applyReadingMode() {
    const onPost = location.pathname.startsWith('/posts/');
    if (onPost && localStorage.getItem('reading-mode') === '1') {
      document.documentElement.setAttribute('data-reading', '');
    } else {
      document.documentElement.removeAttribute('data-reading');
    }
  }
  applyReadingMode();
  document.addEventListener('astro:after-swap', applyReadingMode);
  document.addEventListener('astro:before-swap', (event) => {
    const onPost = event.to.pathname.startsWith('/posts/');
    const on = onPost && localStorage.getItem('reading-mode') === '1';
    event.newDocument.documentElement.toggleAttribute('data-reading', on);
  });
</script>
```

`src/components/ReadingModeToggle.astro`: button + script, matching this
repo's established rebind idiom (`ThemeSwitcher.astro`'s
`removeEventListener`/`addEventListener` guard + `astro:after-swap`, not the
`dataset.bound` flag or `astro:page-load` from the original external draft).

CSS in `global.css`, using the real selectors described above:

```css
html[data-reading] body > header,
html[data-reading] body > footer,
html[data-reading] .post-tags,
html[data-reading] .post-author,
html[data-reading] #disqus_thread {
  display: none;
}

html[data-reading] .post-content {
  max-width: 38rem;
  margin-inline: auto;
  font-size: 1.15rem;
  line-height: 1.75;
}

html[data-reading] .post-content pre {
  font-size: 0.95rem;
}
```

**Verified in a real browser** (Astro preview + claude-in-chrome), against
both fixed test posts: toggle default-off; click hides sitewide header/
footer/tags/author-box/Disqus while the post's own title header stays
visible; label and `aria-pressed` flip; reload persists with the attribute
already present (no flash); client-side navigation between two posts (via
an in-body link) keeps the mode on; navigating to the homepage clears it
and hides the toggle, and navigating back to a post re-applies it from the
stored preference; keyboard Enter toggles state; toggle absent on
`/pages/about/`. One item couldn't be confirmed via automation: the
`focus:ring-2` visual focus ring didn't render under a programmatic
`.focus()` call in the automated browser tab — but the site's pre-existing
`ThemeSwitcher.astro` toggle, using the identical Tailwind focus-ring
classes, showed the same result, so this isn't a regression introduced
here. Worth a real Tab-key check by a human before calling it done.

### 2.4 Optional, only if 1 and 2 are green

Unchanged from the original: font-size steps and a serif option, same key
namespace. Don't build before the base toggle ships.

---

## Open questions (need a decision before implementation)

1. ~~**Cover image `<figcaption>`**~~ — moot: measured directly, the bare
   `<img>` already survives Readability extraction, so no `<figure>`/rehype
   plugin work is planned (see "Cover image" above).
2. ~~**`data-astro-reload` tradeoff**~~ — resolved: verified on real iOS
   Safari that client-side nav doesn't break reader eligibility (see 1.3),
   so it's not needed.
3. ~~**Test runner scope**~~ — resolved: Vitest only for the eligibility
   check, no Playwright. Toggle behaviour is covered by manual QA instead of
   an e2e spec (see 2.2).
4. ~~**`deploy.yml` Node pin**~~ — resolved: user confirmed the change,
   `deploy.yml` now uses `node-version-file: '.nvmrc'` (see 1.1 above).

## Acceptance criteria

- `npm run test` (the eligibility check) is green.
- Reader icon appears on iOS Safari for a directly-loaded post; extracted
  content matches the post body only (no nav/footer/author/cookie text).
- Toggle works, persists, no flash on reload, survives navigation between
  posts — verified manually per the checklist below.
- Lighthouse accessibility score on a post page does not drop.
- No new client-side dependency ships in the production bundle — Vitest and
  Readability are dev/test-only.

## Manual QA checklist

Covers both the native-reader verification (1.3) and the toggle behaviours
that would otherwise have been a Playwright spec (2.2, items 1-7 above):

- iPhone Safari: direct load, then navigation from the homepage — reader
  icon offered in both cases.
- iPhone Safari with the native reader on and the in-site mode on
  simultaneously — confirm nothing breaks.
- Android Chrome: toggle works, simplified view offered.
- Desktop Firefox: Reader View offered, toggle works.
- The two fixed test posts: `domain-using-spatie-event-sourcing` (code-heavy,
  content dir `create-a-domain-with-spatie-event-sourcing`) and
  `ai-hallucination-in-coding-agents` (prose-heavy) — same ones used in the
  eligibility test (1.1).
- Toggle: default off, click to on (header hides, `aria-pressed`/label
  flip), reload with no flash, click to off (`localStorage` reads `0`),
  client-side nav between two posts keeps the mode, toggle absent on
  homepage/static pages, keyboard (focus + Enter) toggles state.
