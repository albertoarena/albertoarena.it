# Reader mode boundary leaks

**Status:** In progress
**Date:** 2026-08-28
**Related:** f9c61665 (the bug report that started this)

## Context

`tests/reader-eligibility.test.ts` used to run Readability against two
hardcoded posts with hand-copied first/last paragraph strings, and — because
of a local Node version mismatch (jsdom 27 needs Node >= 20.19, see
`.nvmrc`) — hadn't actually been collecting any tests for a while. Both are
now fixed: `TEST_POSTS` is derived from every published English post's own
source markdown (`src/content/posts/*/index.md`, skipping drafts and `it.md`
translations), with paragraph assertions generated from the source instead
of copied by hand, and a length floor scaled to each post instead of one
fixed constant.

Running the generalized suite against all 35 posts instead of 2 immediately
found two real leaks. Neither was reachable with a 2-post fixture.

## Finding 1: author bio + newsletter box leak into the article (11 posts)

`.post-author` and `.post-newsletter` in `PostLayout.astro` (~line 270-295)
are DOM children of `<article class="post-content">`, not siblings of it.
Readability's boundary heuristic scores content by paragraph density and
usually strips this kind of trailing block on longer posts, but doesn't
reliably do it when the real article text is thin relative to the
boilerplate around it. Confirmed failing:

`finally-i-moved-to-gatsby`, `i-am-back`, `i-moved-to-jekyll`,
`installing-store-kit-in-titanium-studio`, `introducing-codemetry`,
`introducing-envaudit`, `laravel-event-sourcing-generator-10k`,
`moving-from-gatsby-to-astro`, `my-react-calculator`,
`special-effects-in-css3`, `the-schema-doctor-is-in`.

**Fix:** move `.post-author`, `.post-newsletter`, `.discuss`, and the pager
`<nav>` (prev/next post) to be siblings of `</article>` rather than
children, still inside `<main>`. Leave `.post-tags` where it is — it's
short and arguably part of the article's own metadata, not chrome. This is
a pure DOM-nesting change: every moved block already carries its own
`max-w-[68ch]` class rather than inheriting from `<article>`, so it should
be visually and structurally identical, just outside the boundary
Readability treats as "the article."

## Finding 2: not a real leak, a test false positive

`introducing-truss`, `gave-my-schema-viewer-your-app-colours`,
`my-coding-agent-kept-inventing-columns` failed "excludes nav link labels"
because they legitimately contain the substring `/truss` in real prose —
"Install it, visit `/truss`, and you get the diagram" (an actual route) and
`// config/truss.php` (an actual file path) twice. The rail nav never
leaked; the test's own signature (a bare `/label` anywhere in the extracted
text) was too loose to tell a real leak apart from a post that happens to
mention a path. Confirmed by checking what Rail.astro actually renders:
consecutive items render as `/writing  /series  /cheatsheets` (whitespace
between them, not glued together), so the safe signature is two whole
labels from the same rail group, in order, separated only by whitespace —
something ordinary prose won't produce by coincidence. Fixed in
`tests/reader-eligibility.test.ts` (`NAV_LEAK_PATTERNS`).

## Fix shipped for Finding 1

`PostLayout.astro`'s `.endnote` wrapper (`.post-tags`, `.post-author`,
`.post-newsletter`, `.discuss`) changed from a `<div>` to an `<aside>`.
Readability.js unconditionally strips every `<aside>` from whatever content
it selects (`_grabArticle` calls `this._clean(articleContent, "aside")`),
regardless of nesting depth or how the content scores — a guarantee that
class-name-based scoring penalties don't give. The prev/next pager was
deliberately left *outside* the new `<aside>` and off reading mode's hide
list: it stays useful in a focused read, and `.pager` already matches
Readability's own `unlikelyCandidates` regex, so it doesn't need the same
treatment. This is a same-classes, same-nesting change (aside is a
find/replace on the tag name, not a restructure) — no visual diff.

`global.css`'s reading-mode block already listed `.post-tags`,
`.post-author`, `.post-newsletter`, and `.discuss` individually (for the
site's own reading-mode toggle, unrelated to Readability) and also had a
blanket `aside` selector whose comment claimed exactly two `<aside>`
elements existed sitewide. Updated that comment for the new third one
rather than leave it stale.

## Verification (done)

- [x] `npm run test:eligibility`: 316/316 passing, all posts
- [x] `npx vitest run tests/components/rail.test.ts`: passes too — same
      Node-version root cause as the eligibility suite, no code fix needed
      there
- [x] Visually spot-checked `i-am-back` (short post) via a local static
      server + Chrome: tags/author/newsletter render identically; toggled
      the site's own reading-mode button and confirmed rail/tags/author/
      newsletter hide while the prev/next pager stays visible, exactly as
      before
- [x] `npm run test:accessibility`: 2/2 passing
- [x] Full `npm run build` + seo-indexing, geo-aeo, cheatsheet-pdf,
      profile-readme, code-label-contrast: all passing (361 tests, 8 files,
      0 failures)

## Done

- [x] Diagnosed both leaks and confirmed the runner failure was a local
      Node version mismatch, not a CI or code bug (CI has been green on
      this test all along, including the merge that just landed)
- [x] Rewrote `tests/reader-eligibility.test.ts` to cover all posts instead
      of 2, verified 0 false-positive mismatches on the corpus before
      wiring the generated fixtures into the suite
- [x] Fixed Finding 1 (`PostLayout.astro` `<div>` → `<aside>`, `global.css`
      comment update)
- [x] Fixed Finding 2 (test's own false-positive signature, not a real bug)
- [ ] PR (holding — no commit/push without explicit approval)
