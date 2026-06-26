# Modernisation Plan: Tailwind v4 + Content Layer

## Goal

Move away from Astro Starter Kit patterns by upgrading to Tailwind CSS v4 and migrating to
the Astro 5 Content Layer API. Content files and layout structure are preserved entirely.

## What does NOT change

- All posts (`/src/content/posts/`) and pages (`/src/content/pages/`) — zero changes to Markdown
- Component structure and visual layout
- Astro version (already on v5)
- All integrations: MDX, RSS, sitemap, Disqus, GTM, cookie consent, View Transitions, i18n

---

## Phase 1 — Tailwind CSS v4

### 1.1 Update dependencies

```bash
npm uninstall @astrojs/tailwind
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography
```

`tailwindcss` v4 is a single package; `@tailwindcss/vite` replaces `@astrojs/tailwind` as the
integration layer; `@tailwindcss/typography` is the v4-compatible prose plugin.

### 1.2 Update `astro.config.mjs`

Remove `@astrojs/tailwind` from `integrations`. Add Tailwind as a Vite plugin.

```js
// Before
import tailwind from '@astrojs/tailwind';
integrations: [tailwind(), sitemap(), mdx()]

// After
import tailwindcss from '@tailwindcss/vite';
integrations: [sitemap(), mdx()]
vite: {
  plugins: [tailwindcss()]
}
```

### 1.3 Delete `tailwind.config.mjs`

All configuration moves into CSS. The file is no longer used by Tailwind v4 and should be
removed to avoid confusion.

### 1.4 Rewrite `src/styles/global.css`

This is the core change. The three directives collapse to one import, custom tokens move into
`@theme`, the typography plugin is declared inline, and dark mode is defined with
`@custom-variant` — eliminating the 80+ lines of `!important` prose overrides.

**Structure of the new file:**

```css
/* 1. Import Tailwind v4 */
@import "tailwindcss";

/* 2. Load typography plugin */
@plugin "@tailwindcss/typography";

/* 3. Define dark mode variant (targets html.dark and all descendants) */
@custom-variant dark (&:where(.dark, .dark *));

/* 4. Design tokens — replaces tailwind.config.mjs theme.extend */
@theme {
  --color-primary: hsl(220, 100%, 68%);
  --color-secondary: hsl(31, 92%, 62%);
  --color-dark: hsl(220, 17%, 17%);
  --color-dark-cloud: hsl(220, 17%, 30%);
  --color-dark-paper: hsl(220, 17%, 12%);
  --color-white-cloud: hsl(240, 1%, 92%);
  --color-gray: hsl(220, 17%, 57%);

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* 5. Base styles */
@layer base {
  /* ... body, html, skip-to-content, scrollbar, code blocks, etc. */
  /* Dark mode prose overrides now use CSS custom properties cleanly */
}
```

**Dark mode prose:** Instead of overriding every `--tw-prose-*` variable with `!important`,
configure the typography plugin via `@variant dark` in the `@layer base` block:

```css
@layer base {
  @variant dark {
    .prose {
      --tw-prose-body: #e5e7eb;
      --tw-prose-headings: #ffffff;
      --tw-prose-links: hsl(220, 100%, 68%);
      /* ... etc, no !important needed */
    }
  }
}
```

### 1.5 Component class name audit

Tailwind v4 has breaking changes in some default values. Every `.astro` file must be checked.

**Known breaking changes to look for:**

| Pattern | Issue | Fix |
|---|---|---|
| Bare `border` | Default color changed from `gray-200` to `currentColor` | Add explicit color: `border-gray-200` or `border-white-cloud` |
| Bare `ring` | Default width changed from 3px to 1px | Use `ring-3` if old behaviour needed |
| `shadow`, `shadow-sm`, etc. | Scale values changed | Verify visually, adjust size if needed |
| `transform`, `filter`, `backdrop-filter` | No longer needed (automatic in v4) | Remove the standalone class |
| `bg-opacity-*`, `text-opacity-*` | Removed | Use slash syntax: `bg-black/50` |
| `overflow-ellipsis` | Removed | Use `text-ellipsis` |
| Custom colours in classes | Now reference CSS vars | `text-primary` still works via `--color-primary` |

**Files to audit:**

- `src/layouts/BaseLayout.astro`
- `src/layouts/PostLayout.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Layout.astro`
- `src/components/Sidebar/Sidebar.astro`
- `src/components/Sidebar/Author.astro`
- `src/components/Sidebar/Menu.astro`
- `src/components/Sidebar/Contacts.astro`
- `src/components/Sidebar/Copyright.astro`
- `src/components/ThemeSwitcher.astro`
- `src/components/PostCard.astro`
- `src/components/Feed/Feed.astro`
- `src/components/Feed/FeedItem.astro`
- `src/components/Pagination.astro`
- `src/components/ProjectCard.astro`
- `src/pages/index.astro`
- `src/pages/404.astro`
- `src/pages/categories.astro`
- `src/pages/tags.astro`
- `src/pages/projects.astro`
- `src/pages/category/[category].astro`
- `src/pages/tag/[tag].astro`
- `src/pages/page/[page].astro`
- `src/pages/pages/[...slug].astro`
- `src/pages/posts/[slug]/index.astro`
- `src/pages/posts/[slug]/it.astro`

---

## Phase 2 — Astro Content Layer API

This phase is independent from Phase 1 and can be done before or after it.

The current `src/content/config.ts` uses the Astro v2-style `type: 'content'` collections.
Astro 5 introduced the Content Layer API as the new recommended approach, using file loaders.

### 2.1 Rename and update the config file

Move `src/content/config.ts` to `src/content.config.ts` (one level up, at `src/`).

Update the collection definitions to use the `glob` loader:

```ts
// Before
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({ ... })
});

// After
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({ ... })
});
```

The Zod schema is identical — no changes to frontmatter fields or validation rules.

### 2.2 Audit page queries

With the Content Layer API, `getCollection()` and `getEntry()` work the same way, but entry
shape changes slightly:

- `entry.id` is now the file path relative to `base` (e.g., `my-post/index.md`) instead of
  the short slug. Update any code that compares or filters on `entry.id` to use `entry.slug`
  or frontmatter fields instead.
- `entry.body` is removed. The render pattern (`const { Content } = await render(entry)`)
  already used everywhere is unchanged.

Files to check for `entry.id` usage:

- `src/pages/posts/[slug]/index.astro`
- `src/pages/posts/[slug]/it.astro`
- `src/pages/pages/[...slug].astro`
- `src/pages/category/[category].astro`
- `src/pages/tag/[tag].astro`
- `src/pages/page/[page].astro`

---

## Phase 3 — Verification

After each phase, run through this checklist before committing:

### Build
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds with no warnings about missing classes or unresolved tokens

### Visual
- [ ] Light mode renders correctly on all page types (home, post, category, tag, 404)
- [ ] Dark mode toggle works and persists across page loads and View Transitions
- [ ] No unstyled or broken elements visible at mobile, tablet, and desktop widths
- [ ] Code blocks render with correct syntax highlighting and dark background

### Content
- [ ] All post pages render with correct typography, headings, links, images, code
- [ ] Italian post (`/laravel-netsons-deploy/it`) renders correctly
- [ ] Category pages list posts correctly
- [ ] Tag pages list posts correctly
- [ ] Pagination works on the home and category feeds
- [ ] About and credits pages render correctly

### Features
- [ ] RSS feed renders at `/rss.xml`
- [ ] Sitemap renders at `/sitemap-index.xml`
- [ ] Cookie consent banner appears on first visit and remembers choice
- [ ] Disqus comments load on post pages
- [ ] OG/Twitter social image tags are populated correctly
- [ ] View Transitions work between pages (no full reloads)

---

## Suggested commit sequence

1. **Phase 1 (Tailwind v4)** — single commit after full audit
2. **Phase 2 (Content Layer)** — separate commit; isolated change, easy to revert independently
3. Keep docs/plans/completed/ for reference after each phase lands

---

## Risk notes

- Tailwind v4 is a major version — the class name audit (1.5) is the highest-effort step.
  Running the dev server with the browser open is the most efficient way to spot visual
  regressions while working through components.
- The typography plugin dark mode migration should eliminate all `!important` from global.css.
  If any `prose` colour looks wrong in dark mode after Phase 1, it means a CSS variable was
  missed rather than a structural problem.
- Content Layer (Phase 2) is low risk for a pure-Markdown site with no remote loaders. The
  main gotcha is `entry.id` format change; grep for it first.
