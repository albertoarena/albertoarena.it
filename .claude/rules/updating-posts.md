---
paths:
  - "src/content/posts/**"
---

## Checklist: updating a previously published post

When a change to an already-published post is substantive (a correction, a
followed-up idea, new data, a superseded recommendation), don't just edit the
body silently. Log it:

- [ ] Add or reuse a `## Notes` section at the very bottom of the post, after
      the closing section
- [ ] One line per update: `On <Month Day, Year>, <what changed>.` Link out if
      there's a relevant post or resource
- [ ] Append new entries at the end, oldest first, so the section reads as a
      timeline
- [ ] Skip this for typo fixes, formatting, or anything that doesn't change
      what the post claims
- [ ] If the update is significant enough that a reader partway through the
      post should know before continuing, also add a short blockquote note
      near the top (after the cover image), not just the bottom `## Notes`
      entry

See `create-a-domain-with-spatie-event-sourcing/index.md` and
`claude-md-is-ram-not-disk/index.md` for the pattern in practice.
