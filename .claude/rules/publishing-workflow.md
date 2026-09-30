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
- [ ] **That direct-to-master allowance is for markdown-only changes**
      (post frontmatter/body, page content). A change that touches anything
      else — `.astro` components, `.ts`/`.js`, config, `package.json` — needs
      a branch and a PR even for something small like a version bump or a
      visual fix, no direct push. Confirmed 2026-09-30 alongside the
      pinned-post swap (`content/posts/*/index.md` only, so that one shipped
      direct).
- [ ] **Whenever a post's PR is merged (pushed to master), re-check its `date`
      frontmatter against the actual day of the merge, and fix it if the PR
      sat longer or shorter than planned.** A date set when the branch was
      opened goes stale the moment the merge lands on a different day, and
      the site has no future- or past-date filter (`index.astro`,
      `rss.xml.js` only check `draft`), so a stale date silently pins the
      post out of chronological order — above everything published since, if
      the date is still in the future — until real time catches up. Fixing
      it is a direct-to-master edit, not something that needs its own PR, and
      it does not get a `## Notes` entry (see `updating-posts.md`): it
      doesn't change what the post claims. Caught on The Effort Was the
      Filter (2026-09-29): PR #52 merged 28/09, but the post kept its
      originally-scheduled `2026-10-03` and stayed pinned above every post
      published in between until fixed.

**Why:** The user flagged this after a same-day post shipped straight to
master and immediately became a live "Latest" homepage feature before they'd
had a chance to catch a date-collision bug (two posts sharing the same
`10:00:00.000Z` timestamp, so the older one kept winning the feature slot on
a stable sort) — a PR gives a review point before new content goes live,
without slowing down small approved fixes.
