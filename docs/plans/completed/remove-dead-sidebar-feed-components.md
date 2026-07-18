# Remove dead Sidebar/ and Feed/ components

**Status: completed**
**Date:** 2026-07-18

## What

Delete `src/components/Sidebar/` (`Sidebar.astro`, `Author.astro`,
`Contacts.astro`, `Copyright.astro`, `Menu.astro`) and `src/components/Feed/`
(`Feed.astro`, `FeedItem.astro`) — 7 files, unreferenced anywhere in the live
site.

## Why

Surfaced as a side finding while investigating
[seo-search-console-followup.md](../seo-search-console-followup.md):
`Sidebar/Copyright.astro` and `Feed/FeedItem.astro` both contain internal
links missing trailing slashes
(the same pattern fixed live in `Footer.astro`/`Header.astro`/etc.), but
neither component is actually imported by anything reachable from a route, so
they don't affect Search Console and weren't part of that fix.

A deep-dive investigation before deletion confirmed:

- **Zero live references.** Grepped all of `src/` (every extension —
  `.astro`, `.ts`, `.js`, `.mdx`, markdown content bodies/frontmatter),
  `astro.config.mjs`, and every route under `src/pages/**`. The only hits were
  the components referencing each other inside their own dead directories
  (`Sidebar.astro` importing its siblings `Author`/`Menu`/`Contacts`/`Copyright`).
  No `Astro.glob()`, no dynamic/template-literal imports, no MDX files in the
  repo at all.
- **No orphaned CSS.** All 7 files use Tailwind utility classes only — no
  `<style>` blocks, nothing in `src/styles/` targets bespoke selectors from
  them.
- **Deliberate, documented deprecation — not an accidental regression.** Git
  history:
  - `245ebc20` (2026-02-07, Gatsby→Astro migration) — `Sidebar` was wired live
    into the original two-column `Layout.astro`. `Feed`/`FeedItem` were ported
    at the same time but were **never wired into any route**; `index.astro`
    used `PostCard` from day one instead — pure migration scaffolding that was
    always dead.
  - `1acc37ea` (2026-06-26, "feat: Option B — top bar, single column, retire
    sidebar") — commit message explicitly states *"Sidebar components kept in
    repo but no longer wired into layouts."* This is when the current
    single-column `Header` + `<main>` + `Footer` shell (documented in
    `CLAUDE.md`) replaced the two-column sidebar layout.
  - Neither directory was touched again after that commit.
  - `docs/plans/completed/structured-data-and-llms-txt.md` had already
    independently flagged `Sidebar/Contacts.astro` as dead.
- **Layout chain confirmed clean.** Read the live `BaseLayout.astro` and
  `Layout.astro` directly (not just relying on `CLAUDE.md`'s description):
  `BaseLayout` → `Layout` → `Header` + `<main><slot /></main>` + `Footer` +
  `CookieConsent`. No sidebar or feed component anywhere in that chain.

## Verification

```bash
npm run build   # 86 pages built successfully, no import errors
```

Ran after deletion — confirms nothing in the build graph depended on the
removed files.

## Out of scope

A few files under `docs/plans/**` mention `Sidebar/`/`Feed/` paths in
historical prose (e.g. describing the old two-column layout). These go stale
but don't affect the build — not worth editing retroactively.
