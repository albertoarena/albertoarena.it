## Checklist: before opening a PR for a new post

Run through this right before pushing a new post branch. Each item links to
the rule file with the detail; this is the flat list to actually check off.

- [ ] **Frontmatter matches its siblings.** If the post belongs to a series
      or a recognisable group (e.g. Truss), compare `category`, `tags`, and
      any series frontmatter against the other posts in that group — don't
      let a fresh draft default to something generic that the rest of the
      group doesn't use.
- [ ] **Series wiring, if applicable.** See `truss-series.md` — the
      `series` frontmatter block and the `src/data/trussSeries.ts` entry
      are two separate places that both need the new post, and the nav
      won't render right if only one is done.
- [ ] **`llms.txt` entry.** See `adding-posts.md` — one line under
      `## Posts`, newest first, reusing the `description` frontmatter
      verbatim. Only once the post is no longer `draft: true`.
- [ ] **Cover image.** Sized/compressed per the Images section of
      `CLAUDE.md`, `coverAlt` actually describes the chosen image (not a
      leftover from an earlier candidate), and a row added to
      `src/content/pages/credits/index.md` under Photography.
- [ ] **Body doesn't duplicate the cover.** `PostLayout` auto-renders the
      frontmatter `cover`/`socialImage` at the top of every post — grep the
      body for the same image path to make sure it isn't also embedded
      there as a leading `![...]` or `<figure>`.
- [ ] **No em dashes** anywhere in the post (body, description, title).
      Signals AI-written content; replace with commas, colons, or
      parentheses.
- [ ] **Every temporal claim is checked against real history, not
      estimated.** Any specific duration or date ("for two years", "since
      2019", "for months") about a project, package, or codebase must be
      verified against its actual history (`git log --reverse` for the
      first commit, a changelog, a release date) before publishing, not
      inferred from how long the work has felt like or how it reads. Caught
      on the paste-parser post (2026-08-24): claimed Truss's schema viewer
      had been trusting live connections "for two years" when the package's
      first commit was 2026-07-22, about a month earlier. Fixed same-day,
      pre-cross-post, by dropping the duration rather than correcting the
      number, since the sentence didn't need one.
- [ ] **Slug matches the current title**, not an earlier draft title. If
      the title changes at any point before merging, re-check the `slug`
      frontmatter (and, if it's a series post, the `slug` in
      `src/data/trussSeries.ts`) against the *final* title, not whatever it
      was when the post was first drafted. Caught on the paste-parser post
      (2026-08-24): the title changed from "What a trusted connection was
      doing for you" to "The bug that only showed up once strangers could
      paste a schema" mid-review, but the slug (and the content/image
      directory names, `credits/index.md` link, `llms.txt` link, and a
      `utm_campaign` value baked into the post's own closing CTA) stayed on
      the old title and only got caught after merge, requiring a 301
      redirect (`public/.htaccess`) to fix live. If the slug is already
      merged and live when a title changes, add the redirect immediately,
      don't wait — the URL may already be cached or crawled.
- [ ] **Date doesn't collide** with another post's `date` (down to the
      timestamp). A stable sort on a shared timestamp lets an older post
      keep winning the homepage "Latest" slot over the new one — grep
      other posts' `date` frontmatter for the same day before picking a
      time.
- [ ] **PR, not a direct push.** See `publishing-workflow.md` — branch,
      commit, push, open a PR, wait for explicit go-ahead before merging.
