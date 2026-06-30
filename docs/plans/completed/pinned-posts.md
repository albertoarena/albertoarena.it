# Plan: Pinned / featured posts on the homepage

**Status:** Completed — live on master 2026-06-30
**Date:** 2026-06-30
**Scope:** Allow 2–3 posts to be marked as pinned in their frontmatter and always shown at the top of the homepage, above the regular chronological list and pagination.

---

## Goal

The homepage currently shows posts in reverse-chronological order. Some posts are worth surfacing permanently regardless of age. The feature should be lightweight, self-contained in content, and not affect the paginated articles list or the `/articles` page.

---

## Approach: `pinned` frontmatter field

Add a `pinned: boolean` field to the post schema. Pinned posts are extracted before pagination, rendered in a dedicated section at the top of the homepage, and excluded from the regular list so they never appear twice.

This is the most Astro-idiomatic solution: the post itself declares its pinned state, and no external config file needs updating when pins change.

---

## Implementation steps

### 1. Update content schema — `src/content/config.ts`

Add `pinned` to the posts schema:

```ts
pinned: z.boolean().default(false),
```

### 2. Mark posts in frontmatter

Add `pinned: true` to the posts to feature. Starting with:
- `src/content/posts/introducing-filament-event-sourcing/index.md`
- `src/content/posts/claude-md-is-ram-not-disk/index.md`

### 3. Update homepage — `src/pages/index.astro`

Split the sorted post list into pinned and regular before rendering:

```ts
const pinnedPosts = sortedPosts.filter((p) => p.data.pinned);
const regularPosts = sortedPosts.filter((p) => !p.data.pinned);

const totalPages = Math.ceil(regularPosts.length / postsLimit);
const pagePosts = regularPosts.slice(0, postsLimit);
```

Render pinned posts above the regular list, separated by a visual divider. The pinned section is not paginated — it shows all pinned posts on every page.

### 4. Visual treatment

Keep the same `PostCard` component. Add a minimal "Pinned" label — either:
- A small `📌` or text label above the section (`Pinned` or `Featured`)
- Or a subtle pin icon inline with the post meta line

Recommendation: a small section heading `Pinned` in the same mono/muted style used for dates, sitting above the pinned cards, followed by a divider before the regular list. No changes to `PostCard` itself.

### 5. Pagination pages — `src/pages/posts/[page].astro`

Pinned posts should NOT appear again in paginated pages 2, 3, etc. Apply the same `regularPosts` filter there.

---

## Files to change

| File | Change |
|------|--------|
| `src/content/config.ts` | Add `pinned: z.boolean().default(false)` |
| `src/pages/index.astro` | Split posts, render pinned section + updated pagination |
| `src/pages/posts/[page].astro` | Exclude pinned from paginated list |
| `src/content/posts/introducing-filament-event-sourcing/index.md` | Add `pinned: true` |
| `src/content/posts/claude-md-is-ram-not-disk/index.md` | Add `pinned: true` |

---

## What this does NOT change

- The `/articles` page (if it exists as a separate route) — keep it as a full chronological list
- The `PostCard` component — used as-is
- The category/tag pages — unaffected
- RSS/sitemap — unaffected (pinned is a display-only flag)
