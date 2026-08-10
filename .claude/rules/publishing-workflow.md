---
paths:
  - "src/content/posts/**"
---

## Checklist: publishing a new post

Publishing a new post (a new `src/content/posts/<slug>/` directory going
from nonexistent or `draft: true` to live at `draft: false`) needs a PR,
not a direct push to master:

- [ ] Branch, commit, push, open a PR — even though prior Truss/AI posts in
      this repo's history were committed straight to master, that's no
      longer the process going forward
- [ ] Wait for the user's explicit go-ahead before merging
- [ ] Direct commits to master are still fine for everything else the user
      approves in the moment: visual fixes, typo corrections, component
      tweaks, version bumps, promo box updates, and edits to already-published
      posts (see `updating-posts.md`) — this restriction is specifically about
      the act of publishing new content

**Why:** The user flagged this after a same-day post shipped straight to
master and immediately became a live "Latest" homepage feature before they'd
had a chance to catch a date-collision bug (two posts sharing the same
`10:00:00.000Z` timestamp, so the older one kept winning the feature slot on
a stable sort) — a PR gives a review point before new content goes live,
without slowing down small approved fixes.
