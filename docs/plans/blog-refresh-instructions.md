# Blog Layout Refresh — Instructions for Claude Code

Context: `albertoarena.it` is a personal developer blog built with Astro + Tailwind. It is intentionally minimal, has no commercial goal, and targets two audiences: fellow developers and recruiters/hiring managers (the owner is actively job hunting). The goal is a **refresh, not a rebrand**. Keep the name, the domain, the minimal philosophy, and the existing architecture. Do not introduce heavy dependencies, animation libraries, or a CSS framework swap.

Stack constraints:
- Astro components (`.astro`), Tailwind utility classes, TypeScript.
- Dark mode is already wired (`darkMode: 'class'`). Every change must support light + dark.
- Design tokens already exist in `tailwind.config.mjs`: `primary` (hsl 220 100% 68%), `secondary` (hsl 31 92% 62%), `dark`, `dark-cloud`, `dark-paper`, `white-cloud`, `gray`. Reuse these tokens. Do not hardcode hex values.
- Work in small, reviewable commits. Plan first, then implement. Follow existing code style (no em dashes in copy, direct prose, no marketing language).

Current relevant files (verify before editing, paths may have shifted):
- `src/components/Layout.astro` — sidebar + main content shell
- `src/layouts/BaseLayout.astro` — html head, meta, fonts
- `src/components/Sidebar/Sidebar.astro` — author card + nav + social
- `src/components/PostCard.astro` — individual post in the list
- `src/pages/index.astro` — homepage, renders intro + PostCard list
- `src/utils/config.ts` — site config (title, subtitle, menu, author)
- `tailwind.config.mjs` — tokens, typography plugin config

Each task below is independent. Implement them as separate commits. Ask for the owner's confirmation on any task marked **[decision]** before writing code.

---

## Task 1 — Sharpen the homepage intro (highest priority) ✓ DONE

**Implemented.** Decisions made during implementation:

- Line 1: "Senior software engineer focused on Laravel and event sourcing." — kept short to avoid line wrapping; DDD is implied for the audience.
- Line 2: "I build and maintain open-source developer tooling, including the [Laravel Event Sourcing Generator](https://github.com/albertoarena/laravel-event-sourcing-generator) (10k+ downloads)." — "Laravel Event Sourcing Generator" links to the GitHub repo, opens in a new tab.
- Line 1 styled `text-xl font-semibold text-dark dark:text-white`; line 2 in `text-gray`.
- Sidebar bio (`siteConfig.author.bio`) kept as original "Senior Software Engineer" — the homepage hero carries the positioning detail.

---

## Task 2 — Improve post-list typography and rhythm ✓ DONE

**Implemented.** Metadata row in `PostCard.astro` uses `font-mono text-sm text-gray` (custom token, no raw Tailwind gray shades). Vertical spacing unchanged (`space-y-10` still correct). Left-border hover accent preserved.

---

## Task 3 — Add reading time to posts ✓ DONE

**Implemented.** `reading-time` was already in `package.json` — imported directly, no remark plugin needed. Reading time computed from `post.body` and displayed in:
- `PostCard.astro` metadata row, after category, separated by `/`. Format: "3 min read".
- `PostLayout.astro` header metadata row, same format and styling.

---

## Task 4 — Make category tags a navigation feature ✓ DONE

**Implemented.** Category pages (`src/pages/category/[category].astro`) and post-page links (`PostLayout.astro`) were already in place. Only change needed: `PostCard.astro` restructured to move the metadata row outside the wrapping `<a>` tag (fixing an invalid nested-anchor issue), with the category rendered as `<a href="/category/...">`.

**Decision:** categories in the sidebar not wanted — clickable labels only.

---

## Task 5 — Introduce a monospace accent face ✓ DONE

**Implemented.** Added `fontFamily.mono` to `tailwind.config.mjs` using a system-safe stack (no web font dependency):
```js
mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
```
Applied `font-mono` to post metadata rows in `PostCard.astro` and `PostLayout.astro`. Body and headings unchanged.

---

## Task 6 — Audit dark mode and accent usage ✓ DONE

**Implemented.**
- `PostCard.astro`: standardized to `text-gray` custom token (was `text-gray-500 dark:text-gray-400`).
- `PostLayout.astro`: metadata row standardized to `font-mono text-gray`.
- `src/pages/category/[category].astro`: post count line changed from `text-gray-600 dark:text-gray-400` to `text-gray`.
- Focus-visible rings were already implemented in `src/styles/global.css:157-160` — verified new interactive elements (category links in PostCard, hero link) inherit correctly.
- **Decision:** `secondary` (orange) stays as hover-only — no new uses added.

---

## Explicitly out of scope (do not do)

- No rebrand: keep the name, domain, logo concept, and "Alberto the engineer" identity.
- No hero image, no animated background, no gradient banners.
- No newsletter signup, no popups, no "subscribe" CTAs (this is not a commercial blog).
- No CSS framework change, no component library, no new heavy JS dependencies.
- No marketing copy or adjective-heavy taglines.

## Working method

1. Read the current file before editing it; the paths above may have drifted.
2. Propose a short plan per task and wait for approval on **[decision]** items.
3. One task = one commit, with a clear message.
4. Run `npm run build` after each task to confirm no breakage.
5. Preserve the owner's copy style: direct prose, no em dashes, no marketing language, brevity.
