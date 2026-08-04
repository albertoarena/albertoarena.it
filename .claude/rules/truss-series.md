---
paths:
  - "src/pages/index.astro"
  - "src/content/posts/**"
---

## Checklist: adding a Truss post to the homepage series

The homepage Truss promo box (`src/pages/index.astro`) lists the Truss blog
post series below the GitHub/Docs/Read more links, as a vertical `<ol>` driven
by the inline `trussSeries` array. It does not update itself from the content
collection.

- [ ] Append `{ title, slug }` to `trussSeries` in `src/pages/index.astro`, in
      publish order (oldest first) — new post goes last
- [ ] Don't touch the "Read more" link separately — its `href` is derived from
      `trussSeries[trussSeries.length - 1].slug`, so appending the new post
      already makes it point there
- [ ] Keep `title` short (matches the other entries' length, not the full post
      title if it's long) — the list is vertical specifically so it can grow,
      but each row is still one line
- [ ] Still follow `adding-posts.md` for the `llms.txt` entry — that's a
      separate, unrelated index
