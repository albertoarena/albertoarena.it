# Plan: Privacy Policy Link + Credits Page

**Status**: Completed — implemented via `Footer.astro` (the sidebar was later removed in the blog restyle; the Privacy Policy/Credits links live in the footer instead of `Copyright.astro`, same outcome)
**Date**: 2026-05-20  
**Scope**: Make the Privacy Policy discoverable via the sidebar, review its GA4 content, and create a site-wide Credits page for third-party attributions.

---

## Goals

- Privacy Policy page (`/pages/privacy-policy`) linked from a visible, appropriate location (sidebar bottom)
- Privacy Policy content reviewed and corrected for GA4 accuracy
- New Credits page (`/pages/credits`) listing all site-wide third-party tools and image attributions
- Both pages linked from the same sidebar spot (the copyright area), keeping main nav clean

---

## Decisions

### Privacy Policy link placement
**Sidebar copyright area** — legal links conventionally live near the copyright notice, not in primary navigation. The `Copyright.astro` component is the right host. This avoids adding a non-content page to `siteConfig.menu`.

### Credits page scope
**Global only** — one page listing site-wide attributions (frameworks, services, images). No per-post components for now; inline caption attribution in post markdown is sufficient for individual images.

### Privacy Policy review
Minor correction only: the cookie table uses `_ga_XXXXXXXXXX` as a placeholder. Update to the actual GA4 property suffix `_ga_PJGZWDSK4K`. Update last-updated date.

---

## Implementation

### 1. Update `Copyright.astro`

Add Privacy Policy and Credits links inline with the copyright text.

**File**: `/src/components/Sidebar/Copyright.astro`

```astro
---
import { siteConfig } from '@/utils/config';
---

<p class="text-xs text-gray">
  {siteConfig.copyright}
  &nbsp;·&nbsp;
  <a href="/pages/privacy-policy" class="hover:underline">Privacy Policy</a>
  &nbsp;·&nbsp;
  <a href="/pages/credits" class="hover:underline">Credits</a>
</p>
```

### 2. Fix Privacy Policy content

**File**: `/src/content/pages/privacy-policy/index.md`

- Replace `_ga_XXXXXXXXXX` → `_ga_PJGZWDSK4K` in the cookies table
- Update "Last updated: April 2026" → "Last updated: May 2026"

### 3. Create Credits page

**New file**: `/src/content/pages/credits/index.md`

Routed automatically via the existing `/src/pages/pages/[...slug].astro` dynamic route — no new routing code needed.

Content sections:
- **Framework**: Astro
- **Styling**: Tailwind CSS, @tailwindcss/typography
- **Analytics**: Google Analytics 4 via Google Tag Manager
- **Comments**: Disqus
- **Photography**: Unsplash — some post cover images sourced from Unsplash; each image is credited inline in the post with the photographer's name and a link. The Credits page should acknowledge Unsplash as the image platform and list known attributions (e.g. Nick Russill for the envaudit post cover).

---

## Files

| Action | File |
|--------|------|
| Edit | `/src/components/Sidebar/Copyright.astro` |
| Edit | `/src/content/pages/privacy-policy/index.md` |
| Create | `/src/content/pages/credits/index.md` |

No routing changes, no config changes, no new components.

---

## Verification

1. `npm run dev`
2. Sidebar bottom shows: `© All rights reserved. · Privacy Policy · Credits`
3. Both links navigate correctly to their pages
4. Privacy Policy cookie table shows `_ga_PJGZWDSK4K` (not `_ga_XXXXXXXXXX`)
5. Credits page renders with all attribution sections
