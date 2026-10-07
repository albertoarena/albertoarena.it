---
version: 1
slug: "site"
primary_target: "site"
related_targets: []
---

## Direction contract

THESIS: The blog reads as a verified engineering ledger, not a generic tech
blog and not a dashboard sidebar. It refuses both category defaults seen in
this round: zero-design text-dump minimalism (the site as it stands) and the
rounded-card SaaS-docs look (the reference site compared against). Structure
is proven on the page, not decorated.

OWN-WORLD: Existing tokens stay as they are (ink / ink-2 / muted / rule /
paper / surface, IBM Plex Sans + IBM Plex Mono + Source Serif 4). One new
reserved ink, a deep oxblood (~#8a3a3a), used only for the "Sources checked"
stamp and FROM/TO routing marks, never for ordinary links or decoration.
Rail and footer carry no filled background (tried and rejected earlier in
this process for reading as a dated dashboard sidebar); instead a thin
tick-mark edge, like a ledger page's index tabs. Double rules
(`border-bottom: 3px double`) mark mastheads and section closes, extending
the site's existing single hairline rule rather than replacing it. GitHub,
X and LinkedIn render as plain mono text links in the rail and footer, not
a new icon set (the project's existing no-icon-set rule stands; the Truss
mark stays its one documented exception).

STORY: A visitor trusts the structure, ruled rows, ledger index numbers,
before reading a word. The stamp is not a blanket "Verified" badge on every
post (rejected after review: an unconditional trust badge is exactly the
kind of unverifiable claim the site's own anti-fabrication rule forbids).
Instead it reads "Sources checked" and renders only when a post's
frontmatter carries `sourcesVerified: true`, set deliberately by whoever
does the quote-sourcing-standard pass on that post. No field, or false,
means no stamp; most posts (reflection, not sourced claims) correctly show
none. Nothing is stamped retroactively: existing posts show no mark until
explicitly re-reviewed and flagged. The homepage's two lanes (Building:
Truss + Cogway; Writing: the post feed), from the already-confirmed Layout C
structure, both run in ledger rhythm. Post pages gain FROM/TO routing
instead of generic prev/next; the existing right-rail TOC keeps its
position and inherits the ledger rule treatment. A post that belongs to a
series carries a second block in the right aside, below the TOC behind a
double rule: the same ledger index-row treatment already used for Truss's
"How it got here" list, current entry bolded in accent. A post with an
Italian translation keeps its EN / IT switch exactly where it is today,
inline in the meta row beside date and read time, not relocated into the
rail (the rail's own EN/IT switch is a separate, pre-existing mechanism for
whole translated pages, such as /pages/consulting/, untouched by this
direction).

FIRST VIEWPORT: Rail (tick-edge, double-rule masthead, no fill, nav groups,
then GitHub / X / LinkedIn as text links above the location/availability
line) | hero (copy unchanged) | two-lane Building/Writing grid below it |
Truss promo box with its existing numbered "How it got here" list now
row-ruled with a ledger index column. No change to type sizes or the Truss
promo's existing content, only its rule treatment (the stamp is a
post-level mark, not shown on the Truss promo box itself, which is a
project, not a sourced article). Every post page keeps its footer (socials,
RSS, YouTube, Privacy Policy, Credits) and its floating reading-mode toggle;
neither was optional chrome, both were simply missing from the first round
of mockups and are now covered.

FORM: Chosen candidate 3 of 7 self-derived grounded directions (ledger /
manifest), assigned by the structured direction round rather than picked
freehand. It won against the dealt Swiss International Grid challenger on
audience identification (the ledger world's "shipped" / "verified"
vocabulary is literally this site's own language; Swiss Grid is generic
precision with no product-specific tie) while Swiss Grid held product
clarity as a competitive alternate, still available if this direction
doesn't hold up in build. Seed key 307eb51a.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying
its provenance.

## Open implementation decisions

- `sourcesVerified: true` (boolean) is a new content-collection frontmatter
  field on posts, checked manually, never inferred from link count or any
  other heuristic. Needs a line added to
  `.claude/rules/publishing-checklist.md` once built: do the sourcing pass,
  then set the field.
- Reading mode is a structural constraint, not just a visual toggle: the
  real implementation must keep the existing `<aside>` boundary around the
  endnote/tags/author-bio/newsletter/discuss block intact (Readability's
  `_clean` call depends on it to exclude that chrome from reader view), and
  must re-run the project's reader-eligibility test after any PostLayout
  change.
- `/writing`, `/series`, and `/cheatsheets` (including the Spatie event
  sourcing cheat sheet's own bespoke layout) still need their own alignment
  pass to the ledger identity once implementation starts. No mockup was
  requested for these; flagged here so the work isn't forgotten, not
  because it's out of scope.
- Sequencing not yet decided: one branch for everything, layout then
  identity, identity then layout, or homepage first as a slice. Pending the
  user's answer.
