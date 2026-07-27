---
paths:
  - "src/content/posts/**"
---

## Checklist: adding a new post

`/public/llms.txt` is a hand-maintained index and does not update itself. Every
new post must also be added there:

- [ ] Skip this while `draft: true` — add the entry only once the post is published
- [ ] Add one line under `## Posts`, at the top of the list (newest first, matching `date`)
- [ ] Format: `- [Title](https://albertoarena.it/posts/<slug>/): <description>`
- [ ] Reuse the post's existing `description` frontmatter field verbatim — don't write new copy
- [ ] Only index the canonical English post — skip `it.md` translation companions
- [ ] If the post is Laravel/PHP-relevant, consider submitting it to Laravel
      News / LaraChat — real referral traffic and backlinks have come from
      this in the past. Space submissions out rather than back-to-back.
