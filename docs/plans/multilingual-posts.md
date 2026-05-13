# Plan: Multilingual posts (English + Italian)

**Status**: Implemented  
**Date**: 2026-05-13  
**Scope**: Add Italian translations for individual posts without changing existing EN URLs or requiring a full i18n rewrite.

---

## Goals

- English posts keep their existing URL: `/posts/slug/`
- Italian translation lives at: `/posts/slug/it/`
- A language toggle appears on posts that have both languages; hidden otherwise
- English is always the fallback/default
- No Astro i18n routing (`/en/` prefix) — only the `/it/` suffix on post pages
- AI-assisted translation via a Claude Code command

---

## Decisions

| Question | Decision |
|----------|----------|
| UI language scope | Post body and title only — sidebar, menu, and UI labels stay English |
| Categories/tags | English-only |
| Disqus | Shared thread — Italian page uses the same identifier as the English post |
| RSS | English-only feed; Italian posts excluded |
| Translation command | Auto-generate `index.it.md` via `/translate-post` slash command; user reviews and edits the file before committing |

---

## Approach: file-based sibling translations

### Content structure

```
src/content/posts/
└── my-laravel-post/
    ├── index.md        # English (canonical, existing)
    └── index.it.md     # Italian translation (new)
```

Astro's content collection automatically picks up both files as separate entries. We detect translations via the `lang` and `translationOf` frontmatter fields.

### Frontmatter schema changes

`src/content/config.ts` extended with two optional fields:

```typescript
lang: z.enum(['en', 'it']).default('en'),
translationOf: z.string().optional(),  // English post slug, set in IT files only
```

Italian `index.it.md` example:

```markdown
---
title: Distribuire Laravel su Netsons
date: 2026-05-20
template: post
lang: it
translationOf: my-laravel-post
category: Laravel
tags: [laravel, deploy, netsons]
description: Come distribuire un'app Laravel sul provider italiano Netsons.
---

[Italian content here]
```

The English `index.md` does NOT need `lang` (defaults to `'en'`).

---

## Implementation

### Files changed / created

| File | Action |
|------|--------|
| `src/content/config.ts` | Extended schema with `lang`, `translationOf` |
| `src/utils/translations.ts` | New — helpers: `getEnglishPosts`, `getItalianPosts`, `findItalianTranslation` |
| `src/pages/posts/[slug]/index.astro` | Moved from `[slug].astro`; filters to EN posts only; detects Italian twins |
| `src/pages/posts/[slug]/it.astro` | New — generates `/posts/slug/it/` for every Italian post |
| `src/layouts/PostLayout.astro` | Added `lang`, `englishUrl`, `italianUrl`, `disqusSlug` props; localised date; renders LanguageToggle; Disqus always uses EN slug |
| `src/components/Layout.astro` | Threads `lang`, `hreflangEn`, `hreflangIt` to BaseLayout |
| `src/layouts/BaseLayout.astro` | Sets `<html lang>` dynamically; adds `hreflang` alternate links |
| `src/components/LanguageToggle.astro` | New — EN/IT switcher, only rendered when translation exists |
| `src/pages/index.astro` | Added EN-only filter |
| `src/pages/page/[page].astro` | Added EN-only filter |
| `src/pages/category/[category].astro` | Added EN-only filter |
| `src/pages/tag/[tag].astro` | Added EN-only filter |
| `src/pages/categories.astro` | Added EN-only filter |
| `src/pages/tags.astro` | Added EN-only filter |
| `.claude/commands/translate-post.md` | New — slash command for AI-assisted translation |

### Key implementation notes

**Routing**: The English route was initially at `src/pages/posts/[slug].astro`. When the Italian route `src/pages/posts/[slug]/it.astro` was added, Astro's dev server had a conflict between the file and the directory sharing the same `[slug]` name. Fix: moved the English route to `src/pages/posts/[slug]/index.astro` so both routes live cleanly inside the same directory.

**Listing pages**: All pages that list posts (`index.astro`, `[page].astro`, `[category].astro`, `[tag].astro`, `categories.astro`, `tags.astro`) must filter to English-only posts. The filter used everywhere is:
```js
posts.filter((p) => (p.data.lang ?? 'en') === 'en')
```

**Disqus**: Italian pages pass `disqusSlug` (the English post slug) to `PostLayout`, which uses it as the Disqus identifier. Both language versions share the same comment thread.

**hreflang**: When a post has a translation, `BaseLayout` renders:
```html
<link rel="alternate" hreflang="en" href="https://albertoarena.it/posts/slug/" />
<link rel="alternate" hreflang="it" href="https://albertoarena.it/posts/slug/it/" />
<link rel="alternate" hreflang="x-default" href="https://albertoarena.it/posts/slug/" />
```

**Sitemap**: `@astrojs/sitemap` picks up all static routes automatically — no extra config needed.

---

## Translation workflow

### Day-to-day usage

```
1. Write post → src/content/posts/my-post/index.md
2. Commit and publish (English only — works immediately, no toggle shown)

   --- optionally, at any time ---

3. Ask Claude: "translate post my-post"
   → Claude reads index.md, writes index.it.md

4. Review index.it.md, edit as needed

5. Commit index.it.md → Italian version goes live,
   toggle appears automatically on the post
```

Italian translations can be added to existing posts retroactively, not just at creation time.

### Claude Code slash command

`.claude/commands/translate-post.md` — invoke with `/translate-post <slug>` in a new Claude Code session (requires session restart to pick up new commands).

The command reads the English `index.md`, translates to Italian, writes `index.it.md`, and flags uncertain translations for review. The file is never auto-committed.

---

## What this approach does NOT change

- All existing English URLs remain identical
- The site's overall navigation, sidebar, and UI text stays in English
- The RSS feed stays English-only
- Disqus uses the English post identifier for both language versions (shared thread)
- No Astro i18n middleware or config changes needed
- Category and tag archive pages stay English-only

---

## Trade-offs

| Trade-off | Notes |
|-----------|-------|
| Duplicate frontmatter | Italian files repeat date, category, tags — minor maintenance burden |
| Feed exclusion | Italian readers using RSS won't discover Italian posts |
| UI language mismatch | Sidebar/nav stays English even on `/it/` pages |
| Slash command requires restart | New `.claude/commands/` files are only picked up after starting a new Claude Code session |
