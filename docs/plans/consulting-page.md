# Plan: Consulting / Consulenza page

**Status:** Implemented (not yet committed/deployed)
**Date:** 2026-07-14
**Scope:** A new bilingual page pitching freelance/consulting services, with a
LinkedIn call-to-action instead of a contact form. Added to main nav.

---

## Goals

- New page at `/pages/consulting/` (EN) and `/pages/consulting/it/` (IT)
- Brief services pitch, similar tone to the About page's "what I bring" list
- A clear "Message me on LinkedIn" call-to-action in place of a contact form
- Added to the header/mobile nav between "About me" and "Subscribe"
- No server-side code, no new secrets, no spam surface

---

## Decisions

| Question | Decision |
|----------|----------|
| Contact method | LinkedIn link/CTA, not a real PHP form or third-party form service — considered a PHP form (`contact.php` + PHPMailer/SMTP auth via GitHub secrets) but dropped it: no spam, no SMTP setup, no secrets to manage, and LinkedIn is already the existing point of contact on the About page |
| Content source | Adapted from the About page's bio/"what I bring" bullets, tightened into a consulting pitch — not sourced from a LinkedIn export |
| Nav placement | Added to `siteConfig.menu`, between About me and Subscribe |
| Bilingual pattern | Same sibling-file pattern as posts (`index.md` + `it.md`, `lang`/`translationOf` frontmatter), reusing `LanguageToggle` |

---

## Content structure

### Frontmatter schema changes

`src/content/config.ts` — extend `pagesCollection` with the same two optional
fields already used by posts:

```typescript
lang: z.enum(['en', 'it']).default('en'),
translationOf: z.string().optional(),
```

Non-breaking: existing pages (`about`, `credits`, `privacy-policy`) don't set
these fields and keep defaulting to `en` with no translation.

### Content files

```
src/content/pages/consulting/
├── index.md   # English (canonical)
└── it.md      # Italian, lang: it, translationOf: consulting
```

Outline for both (final copy written during implementation, not in this plan):

1. Short intro pitch (1-2 paragraphs) — freelance availability, backend/Laravel
   + AI-integration focus, adapted from the About page bio
2. Services list — bullet list similar to About's "What I bring to a project",
   reframed as offerings (e.g. Laravel architecture & audits, Shopify/headless
   commerce builds, LLM integration into existing products, API design)
3. "How I work" — brief note on remote/freelance availability (already exists
   in About: "Available remotely. Open to freelance projects...")
4. Closing CTA — "Message me on LinkedIn" button/link, using the existing
   `siteConfig.author.contacts.linkedin` username (already used on the About
   page, just as a raw hardcoded URL in the markdown prose there — this page
   can build the URL from config instead)

No new images required; page stays text-only, consistent with the site's
minimal aesthetic.

---

## Routing

Current `src/pages/pages/[...slug].astro` is a single catch-all file with no
language variant. Following the same fix already applied to posts (see
`docs/plans/completed/multilingual-posts.md` — Astro's dev server conflicts
between a `[slug]` file and a `[slug]` directory sharing a name):

- Move `src/pages/pages/[...slug].astro` → `src/pages/pages/[...slug]/index.astro`
  - Filter `getCollection('pages')` to `lang === 'en'` (default) entries only
  - For each page, look up its Italian sibling by `translationOf` match and
    pass `englishUrl`/`italianUrl` to `Layout` so `LanguageToggle` renders —
    only `consulting` will have one; `about`/`credits`/`privacy-policy` won't
- New `src/pages/pages/[...slug]/it.astro`
  - Mirrors `src/pages/posts/[slug]/it.astro`: iterates Italian pages,
    generates `/pages/consulting/it/`
- `Layout.astro` already accepts `lang`/`hreflangEn`/`hreflangIt` (used today
  by `PostLayout`) — reuse as-is, no changes needed there
- `LanguageToggle` component reused as-is (already generic, not posts-specific)

### Nav

`src/utils/config.ts` — add to `menu`:

```js
{ label: 'Consulting', path: '/pages/consulting/' },
```

positioned between `About me` and `Subscribe`. English label only, same as
the rest of the nav (per the multilingual-posts decision: UI chrome stays
English regardless of page language).

---

## Testing / verification

- `npm run dev` / `npm run build` — confirm both language pages render, nav
  link works, `LanguageToggle` shows only on the consulting page, no
  regressions on `about`/`credits`/`privacy-policy`
- Confirm the LinkedIn CTA link opens the correct profile URL in a new tab
  (matching the `rel="noopener noreferrer"` behaviour already applied
  sitewide to external links via the `rehype-external-links` markdown plugin)
- Confirm `/pages/consulting/` and `/pages/consulting/it/` appear in the
  generated sitemap (no filter changes needed — the sitemap only excludes
  category/tag/pagination routes)

---

## Out of scope

- Any server-side contact form (`contact.php`, PHPMailer/SMTP auth, GitHub
  secrets for mail credentials) — considered and dropped in favour of the
  LinkedIn CTA; see Decisions above
- LinkedIn API integration or auto-pulled profile content
- Changes to `about`, `credits`, or `privacy-policy` pages
