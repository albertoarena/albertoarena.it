---
paths:
  - "src/data/trussSeries.ts"
  - "src/content/posts/**"
---

## Checklist: adding a Truss post to the series

`src/data/trussSeries.ts` is the single source of truth for the Truss blog
series: `{ slug, title, titleIt }`, oldest first. Everything else derives from
it — don't edit the consumers directly:

- **`TrussPromo.astro`** (homepage + `/projects/`) renders it as the "Truss
  series" list under GitHub/Docs/Read more, "Read more" pointing at the last
  entry's slug.
- **`TrussSeriesNav.astro`**, wired into `PostLayout.astro`, renders a "Truss
  series — Part N of M" block at the end of the post body, but only on posts
  whose canonical slug appears in `trussSeries` — everything else (most posts
  on this blog) gets nothing, no per-post opt-in needed.
- Both look up `hasItalian` from the content collection at build time (does an
  `it.md` with `translationOf: <slug>` exist?), so an "IT" badge appears
  automatically once a translation exists — nothing to flip on.

### Adding a new post to the series

- [ ] Append `{ slug, title, titleIt }` to `trussSeries` in
      `src/data/trussSeries.ts` — new post goes last, order is publish order
- [ ] Keep `title`/`titleIt` short (matches the other entries, not the full
      post title if it's long) — the lists are vertical specifically so they
      can grow, but each row is still one line
- [ ] Nothing to touch in `TrussPromo.astro`, `TrussSeriesNav.astro`, or
      `PostLayout.astro` — they all key off this one array
- [ ] Still follow `adding-posts.md` for the `llms.txt` entry — that's a
      separate, unrelated index

### Translating a series post to Italian

- [ ] Write `it.md` (not `index.it.md`) alongside `index.md` in the post's
      directory — filename doesn't affect routing (Astro content collections
      key on frontmatter `lang`/`translationOf`, not filename), but `it.md`
      is the established convention (see `laravel-netsons-deploy/it.md`)
- [ ] Frontmatter: no `slug` field (Italian posts route via `translationOf`,
      not slug); set `lang: it` and `translationOf: <english-slug>`; copy
      `date`, `template`, `category`, `tags` verbatim; translate `title` and
      `description`
- [ ] Set `socialImage` too, copied verbatim from the English post — without
      it, `PostLayout` falls back to the author photo as the OG image, which
      is a gap in the one prior precedent, not something to repeat
- [ ] Cross-links between series posts inside the translated body should point
      at the sibling's `it/` URL (e.g. `/posts/the-schema-doctor-is-in/it/`),
      not the English one — links to posts outside the series (not yet
      translated) stay pointed at the English URL
- [ ] Add `titleIt` for this post to `trussSeries` in `src/data/trussSeries.ts`
      if not already present — this is what turns on the "IT" badge in both
      `TrussPromo` and `TrussSeriesNav` for every other post in the series
