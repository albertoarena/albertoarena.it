## Checklist: sentence-level clarity pass

Loosely based on ASD-STE100 Simplified Technical English: not full STE (this
is blog prose, metaphors and colloquial English stay), but the same bias
toward one idea per sentence. Many readers (and the author) aren't native
English speakers, so a sentence that's technically grammatical but needs a
second read to parse is a defect. Run this pass on new drafts and on any
existing post before a wording/clarity edit.

Look for, and split or rewrite:

- [ ] **A word repeated in the same sentence/phrase without reason**, e.g.
      "back to back", "whether X... but whether Y". Repetition like this
      reads as a typo, not emphasis.
- [ ] **Circular or self-referential phrasing**, e.g. "it's used up its
      available memory for that conversation" — the conversation using up
      memory *for that conversation* says nothing the first half didn't.
- [ ] **Redundant synonym pairs**, e.g. "builds this in on purpose,
      deliberately throwing..." — pick one word, drop the other.
- [ ] **Stacked negatives**, e.g. "isn't something that page tested, but
      nothing in the newer research contradicts it" — two negated clauses
      in one sentence forces the reader to hold both in mind at once.
      Rewrite each as a direct positive-framed or single-negative sentence.
- [ ] **A contrast ("X, not Y, but Z" / "isn't X, it's Y") bundled with a
      trailing colon clause in one sentence.** Each half of the contrast,
      and the clause that explains it, gets its own sentence.
- [ ] **Elliptical one-word fragments that rely on the reader supplying
      words from the previous sentence**, e.g. "Restarting isn't." Spell
      out what's being claimed instead of trusting the ellipsis to land.
- [ ] **A gerund clause smuggling in a second fact**, e.g. "...lost the
      most ground by the second question, giving a fully correct answer
      only 41% of the time." Two facts, two sentences.
- [ ] **Double use of "whether" (or any word) within one sentence** where
      a direct statement would say the same thing with less parsing.

This is a wording pass, not a fact or claim change — on an already-published
post it does not need an `updating-posts.md` `## Notes` entry (same
exception as typo/formatting fixes), unless the rewrite changes what the
sentence actually asserts.

## What this pass must not touch

Triple-asterisk emphasis (`***like this***`) is deliberate. It renders as bold
italic, and it marks either a term being named or a line meant to land on its
own. It runs across the posts, not just one, so flattening it to plain bold
rewrites the voice of the blog rather than fixing a post.

- [ ] **Leave it exactly as written.** It isn't a typo, and it isn't a stray
      asterisk from a paste. Don't convert it to plain bold, don't drop it, and
      don't add more of it: it's a choice made sentence by sentence, not a
      pattern to apply.
- [ ] **A split keeps the emphasis it found.** If a sentence carrying it is
      broken in two, the emphasis stays on the same words.
