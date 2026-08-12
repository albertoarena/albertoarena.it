# Accessibility TDD: component-level checks

**Status:** Merged ([PR #21](https://github.com/albertoarena/albertoarena.it/pull/21), 2026-08-12)
**Date:** 2026-08-12

## Context

`docs/plans/wcag-aa-accessibility-automation.md` shipped a full-site
axe-core crawl (`tests/accessibility.test.ts`) that runs on every push/PR
and catches WCAG AA regressions across every page. That closes the
*regression* half of the problem: nothing merges with a new violation.

It doesn't give a TDD loop. Writing a failing accessibility check before
the markup that satisfies it needs something fast enough to run while a
component is being built — the full crawl needs `astro build` (~2s) plus
serving and auditing ~112 pages (~25-30s), which is fine as a merge gate
but too slow to sit in an edit-save-check loop for a single component.

This doc sketches a second, narrower layer for that loop. Two pieces were
spiked (not assumed) before writing this down, since the goal is a plan
grounded in what actually works in this repo, not a guess.

## What was verified

### 1. `axe-core` runs against `jsdom` for structural rules

`jsdom` is already a devDependency (used by `tests/reader-eligibility.test.ts`).
Loaded `axe-core`'s bundled script into a `jsdom` document via `dom.window.eval()`
and ran `axe.run()`:

```
node -e "... JSDOM with <img> (no alt) and <h1><h3> (skipped level) ..."
→ violations: [ 'image-alt' ]  (with default wcag2a/wcag2aa/wcag21aa tags)
→ incomplete: [ 'color-contrast' ]
```

`image-alt` fires correctly. `color-contrast` comes back `incomplete`, not
`violation` — expected: `jsdom` has no layout engine, so it can't compute
real rendered colors. **This layer can only ever catch structural/semantic
issues (missing alt, ARIA validity, form labels, list/table structure), never
contrast.** Contrast stays the full crawl's job.

`heading-order` didn't fire under the default WCAG tag set — because it's
one of axe-core's `best-practice` rules, not a strict WCAG 2.x success
criterion (matches WAVE labeling the same finding an "alert," not an
"error," in the original audit). Re-ran with `best-practice` added to
`runOnly`:

```
→ violations: [ 'heading-order', 'region' ]
```

`heading-order` now fires correctly. `region` also fired — a landmark
check that only makes sense for a whole page (expects a `<main>`), not an
isolated component fragment. Confirms the helper needs to disable
page-level `best-practice` rules (`region`, `landmark-one-main`,
`page-has-heading-one`, similar) while keeping the useful ones
(`heading-order`).

### 2. Astro 5's Container API can render a single component to a string

`node_modules/astro/dist/container/index.d.ts` confirms `astro/container`
exports `AstroContainer` with `create()` and `renderToString(Component,
{ props, slots })` — already present in the installed `astro@^5.0.0`, no
new dependency. This is what makes the loop actually fast: a component can
be rendered in isolation, without a dev server or full site build.

## Proposed shape

```ts
// tests/helpers/audit-component.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const AXE_SOURCE = readFileSync(
  join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
  'utf-8',
);

// Rules that only make sense for a whole page, not one rendered fragment.
const PAGE_ONLY_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];

export async function auditComponent(Component, options: { props?: Record<string, unknown> } = {}) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Component, { props: options.props });

  const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><body>${html}</body></html>`, {
    pretendToBeVisual: true,
  });
  dom.window.eval(AXE_SOURCE);

  const rules = Object.fromEntries(PAGE_ONLY_RULES.map((id) => [id, { enabled: false }]));
  return dom.window.axe.run(dom.window.document, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    rules,
  });
}
```

Usage in a future component's test, written *before* the component's
markup is finalized:

```ts
it('has no structural accessibility violations', async () => {
  const results = await auditComponent(NewCard, { props: { title: 'x', href: '/y' } });
  expect(results.violations).toEqual([]);
});
```

## What this does and doesn't replace

- **Does**: give a sub-second, no-server feedback loop for the class of
  bugs actually found in this repo's own audit — missing/redundant alt
  text, skipped heading levels, bad ARIA. Two of the three template-level
  fixes in the WCAG AA round (`PostLayout.astro`'s heading skip,
  `TrussPromo.astro`'s heading skip) are exactly what this would have
  caught the moment those components were written, instead of waiting for
  a manual WAVE scan months later.
- **Doesn't**: replace the full crawl. Contrast — half of what the WCAG AA
  round actually fixed (`--color-ok`, `text-red-600`, the `opacity-90`
  tag-count badge) — is invisible to `jsdom` and needs real rendering.
  Third-party embeds, animation-timing issues (the `.animate-fade-in`
  flakiness fixed in the crawl), and cross-page concerns (a component that
  is fine alone but breaks a page's heading sequence in context, like
  `TrussPromo.astro` did) also need the full-page, full-browser crawl —
  a component passing in isolation isn't a guarantee the page it lands on
  still makes sense structurally.

## Open questions before implementing

- Where do these tests live — alongside a future component's other tests,
  or a dedicated `tests/components/` directory? No component-level test
  convention exists yet in this repo (all current tests assert against a
  built `dist/`).
- Is this worth building speculatively now, or added the next time a new
  component is actually written? Currently leaning toward the latter —
  build the helper alongside the first real usage, rather than as
  unexercised infrastructure.

## Implementation order (when triggered)

1. Add `tests/helpers/audit-component.ts` per the sketch above.
2. Write one real test against an existing simple component (e.g.
   `Rail.astro` or `TrussPromo.astro`, both already fixed once for
   accessibility) to prove the helper against known-good markup before
   relying on it for something new.
3. Use it going forward for any new component, written before the
   component's final markup — the actual TDD part.

---

## 2026-08-12 update: shipped

Built and verified on branch `a11y-component-tdd`, deliberately chosen
before Netsons' next deploy retry rather than left as unexercised
infrastructure. Three things came up that the sketch above didn't
anticipate, all found by actually running it rather than assumed:

1. **A root `vitest.config.ts` was required, not just the helper.**
   `import Rail from '../../src/components/Rail.astro'` in a test file
   fails outright without Astro's own Vite plugin to transform `.astro`
   syntax — the sketch's code sample assumed this would just work. Added
   `vitest.config.ts` using Astro's own documented `getViteConfig()` (from
   `astro/config`, confirmed present in the installed `astro@5.14.5`).
   Verified this doesn't affect the other 6 existing test suites: full
   `npm run test` still passes (59 tests, one more than before — the new
   `Rail.astro` test — across 7 files) and `npm run build` is unaffected.
2. **`JSDOM` needed `runScripts: 'dangerously'`.** Dropped from the
   sketch's code sample when writing the real helper — without it,
   `dom.window.eval(AXE_SOURCE)` silently no-ops and `dom.window.axe` is
   `undefined`. First test run failed with exactly that
   (`TypeError: Cannot read properties of undefined (reading 'run')`),
   which is what caught it.
3. **The page-only rule list was smaller than sketched, and had a
   different member.** Running against real `Rail.astro` output only ever
   surfaced `region` (as the original spike found) and `document-title`
   (a fragment has no `<title>`, and never will) — not
   `landmark-one-main` or `page-has-heading-one`, which the sketch listed
   speculatively. Kept the list to only what actually fired rather than
   guessing at the full set; `tests/helpers/audit-component.ts` has a
   comment telling the next person to extend it only on confirmed
   misfires, same discipline.

**Verification beyond what the sketch called for**: the sketch's step 2
only asked for one test against known-good markup. Also wrote a throwaway
scratch component with a deliberate missing `alt` and a skipped heading
level, confirmed `auditComponent` reports both `image-alt` and
`heading-order`, then deleted the scratch files — proving the helper
actually catches violations, not just that it passes trivially on markup
that was already fixed once.

**Shipped**: `vitest.config.ts`, `tests/helpers/audit-component.ts`,
`tests/components/rail.test.ts`, wired in as
`test:accessibility-components` (part of the `npm run test` composite).
