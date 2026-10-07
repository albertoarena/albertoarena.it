---
target: homepage social/OG image fallback (public/photo.jpg via BaseLayout.astro)
total_score: 2
max_score: 12
na_heuristics: 1,3,5,6,7,9,10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/albertoarena/dev/personal/albertoarena.it/src/layouts/BaseLayout.astro (homepage social/OG image fallback)"
timestamp: 2026-10-07T16-13-40Z
slug: t-astro-homepage-social-og-image-fallback-e32bdb6f
---
Method: dual-agent (A: critique-assessment-a · B: critique-assessment-b)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | n/a | not applicable — static non-interactive share-image asset |
| 2 | Match System / Real World | 1/4 | Real photo of the real author, but an extreme macro crop of eyes/glasses/beard signals nothing about "engineering blog," "Laravel," or the ledger-identity positioning |
| 3 | User Control and Freedom | n/a | not applicable — static non-interactive share-image asset |
| 4 | Consistency and Standards | 0/4 | Directly contradicts the site's own documented cover spec (1200×630, per-post sourcing/cropping discipline) by serving a 240×240 avatar |
| 5 | Error Prevention | n/a | not applicable — static non-interactive share-image asset |
| 6 | Recognition Rather Than Recall | n/a | not applicable — static non-interactive share-image asset |
| 7 | Flexibility and Efficiency | n/a | not applicable — static non-interactive share-image asset |
| 8 | Aesthetic and Minimalist Design | 1/4 | No ruling, no ticks, no ledger vocabulary, no restraint — an uncontrolled platform crop with a caption pill across busy photographic texture |
| 9 | Error Recovery | n/a | not applicable — static non-interactive share-image asset |
| 10 | Help and Documentation | n/a | not applicable — static non-interactive share-image asset |
| **Total** | | **2/12** | **Critical (17%)** |

Only heuristics 2, 4, and 8 genuinely apply to a static, non-interactive share-image asset; the other seven concern system state, navigation, errors, and help, none of which exist on a `<meta>`-tag image. 2/12 = 17%, which falls in the Critical band even before renormalizing for the narrower applicable set.

#### Design Specificity Verdict

**LLM assessment (Assessment A)**: This card is not a design decision, it's an accident of two unrelated fields colliding. `BaseLayout.astro` defaults `image` to `siteConfig.author.photo` (a 240×240px, 28KB square avatar meant for a Person JSON-LD/profile-pic context), and no page in the pipeline (`index.astro` never passes `image` to `Layout`) ever overrides it. The documented social-image spec in `CLAUDE.md` (1200×630, <1MB, JPEG q85) exists and is followed for every post cover, it's just never applied here. The result is indistinguishable from any personal blog that forgot to set `og:image`.

**Deterministic scan (Assessment B)**: `impeccable detect --json` against `BaseLayout.astro`, `Layout.astro`, and `index.astro` returned exit 0, zero findings, in both JSON and plain modes. This is a true negative, not a tool gap: the defect is a content/data problem (a 240×240 headshot assigned as the OG fallback), not a markup, accessibility, or static-analysis-detectable pattern, so it falls outside what this detector class checks. Hard evidence instead: `public/photo.jpg` measures exactly 240×240px / 28,726 bytes (`identify -verbose`), against the documented 1200×630px/<1MB spec that is, and comparison baseline (`the-sound-of-silence/cover.jpg` 1200×630/175,539B, `the-last-man-who-could-read-code/cover.jpg` 1200×630/103,655B, `introducing-truss/cover.jpg` 1200×630/163,264B) confirms every real post cover already meets it. The fallback is the one asset on the whole site not following the site's own documented convention.

**Visual overlays**: not applicable. This is a static image referenced by a `<meta>` tag, not an interactive page with a DOM to instrument, so no browser injection was attempted; this is a declared skip, not a failed step.

#### Overall Impression

The homepage (and every non-post page) shares a social card that nobody actually designed: a 240×240 avatar, shot and sized for a small circular profile picture, gets force-cropped by each platform's own 1.91:1 crop heuristic into an extreme, uncontrolled close-up of eyes, glasses, and beard. It passes the file-size budget and fails every dimension and compositional requirement that matters. The single biggest opportunity: build one dedicated, correctly-sized (1200×630) brand card for this slot, in the site's own ledger/manifest identity, the same discipline already applied to every post cover, so every non-post share stops being a coin flip across platforms.

#### What's Working

1. It's a real, unfabricated photo of the actual author, no stock imagery, consistent with the site's "author photo is a real asset" brand commitment.
2. The surrounding OG/Twitter meta plumbing is otherwise correctly wired (`summary_large_image` card type, `twitter:creator`, canonical URL), the failure is entirely in the asset choice, not the markup.

#### Priority Issues

**[P0] No dedicated social fallback image exists at all**
Why it matters: `BaseLayout.astro` (~line 27) defaults `image` to `siteConfig.author.photo` = `/photo.jpg`, confirmed 240×240px/28KB. `index.astro` never overrides it, so every non-post share (homepage, About, Consulting, Projects) ships this broken card, it's the default, not an edge case.
Fix: create a dedicated `/public/social-default.jpg`, 1200×630, <1MB, JPEG q85, authored for this slot specifically, a typographic ledger-identity card (IBM Plex Sans title + Source Serif subtitle on paper/ink tokens, a tick-mark rail edge or double-rule treatment, no forced portrait) rather than cramming a square portrait into a landscape frame it was never shot for. Reserve oxblood for "sources checked" only, per brand rule, don't borrow it here. Wire it as the new default in `BaseLayout.astro`.
Suggested command: $impeccable polish

**[P1] Author avatar and OG fallback share one config field with opposite aspect-ratio needs**
Why it matters: `siteConfig.author.photo` (`config.ts` line 70) feeds both the Person JSON-LD `image` (square avatar, fine as-is) and the og/twitter image default (needs 1200×630 landscape), one field, two incompatible jobs. This is the actual root cause, not just a missing asset: even after an immediate fix, any future photo swap can silently re-break the social card unless the two uses are split.
Fix: add `siteConfig.defaultSocialImage` (or similar), distinct from `author.photo`; point `BaseLayout.astro`'s `image` default at the new field, leave `author.photo` untouched for structured data.
Suggested command: $impeccable harden

**[P1] Platform crop is fully uncontrolled**
Why it matters: because the source isn't 1.91:1, X/LinkedIn/Slack each apply their own crop heuristic to a 240×240 square squeezed into a 1200×630 slot, the "eyes and glasses" framing in the screenshot is one possible outcome among several, not a designed composition. The card's content is effectively random per platform, the opposite of authored.
Fix: always serve pre-cropped 1200×630 assets for anything used as `og:image`/`twitter:image`, never rely on client-side crop of a mismatched source.
Suggested command: $impeccable polish

**[P2] Caption overlay fights the image it's printed on**
Why it matters: "A blog by Alberto Arena" renders as a pill across a busy face/glasses/bookshelf background with inconsistent contrast. Even setting aside the crop problem, legibility here is accidental, not designed.
Fix: if a future card keeps any title treatment, give it a flat, controlled background area (a paper/ink field per the ledger tokens), not overlaid on photographic texture.
Suggested command: $impeccable typeset

**[P3] Missing `og:image:width`/`height`/`alt`**
Why it matters: `BaseLayout.astro`'s OG block (~lines 100-108) sets `og:image` but never `og:image:width`, `og:image:height`, or `og:image:alt`. Without explicit dimensions, platforms are more likely to auto-crop rather than respect intended framing, compounding the aspect-ratio problem above.
Fix: add the three tags once a correctly-sized fallback asset exists.
Suggested command: $impeccable harden

#### Persona Red Flags

**Jordan (confused first-timer, scrolling a feed)**: no topic signal at all, nothing reads "Laravel," "engineering," "blog." Could be a personal/lifestyle account. No reason to stop scrolling.

**Riley (stress tester, checking renders across platforms)**: the 240×240 source is wrong for every platform's 1.91:1 slot, so the crop seen on X (tight eye/glasses close-up) isn't representative, LinkedIn or Slack could crop to chin-only, forehead-only, or worse. Also: the file passes the size budget (28KB, well under 1MB) while failing the dimension requirement entirely, a size-only check would have missed this.

**Casey (distracted mobile user, glancing at a feed)**: at small thumbnail scale, a macro face crop filling the whole card reads closer to startling/uncanny than professional, worse than no photo at all for a half-second glance.

#### Minor Observations

- `og:image` and `twitter:image` resolve to the identical URL; fine once the source asset is fixed.
- The Person JSON-LD `image` reusing `/photo.jpg` is appropriate for its own purpose (small square profile image), the bug is sharing the field, not the asset's existence.
- `photo.jpg` is well within the content-image size budget (28KB), this is purely a dimensions/composition failure, not a compression one.

#### Questions to Consider

- Should the homepage card carry a face photo at all, or does a typographic ledger card (title + tagline + rule treatment, no portrait) fit "verified engineering ledger" better and sidestep the aspect-ratio problem entirely?
- If a photo stays, should `/photo.jpg` keep double duty as both avatar and share-image source, or does this need two distinctly shot/cropped assets from day one given the opposite aspect ratios?
- Every post cover already carries Unsplash sourcing/attribution overhead, is a single hand-authored, reusable brand card (built once, correctly sized) actually less maintenance than trying to make a portrait survive arbitrary platform crops indefinitely?
