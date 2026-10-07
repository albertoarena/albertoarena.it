# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily working developers (Laravel/PHP, Shopify/headless commerce, and
increasingly AI-assisted engineering) who find posts via search, LinkedIn,
dev.to/Medium cross-posts, or the OSS packages (Truss, Cogway) themselves.
A secondary audience is recruiters, prospective clients, and consulting
leads evaluating Alberto Arena's credibility before reaching out via the
About or Consulting pages.

## Product Purpose

A personal blog and technical-reputation base for Alberto Arena, a Senior
Software Engineer based in Sicily. It exists to build and compound
technical credibility in the Laravel / AI-assisted-engineering space,
which in turn feeds consulting and employment opportunities and promotes
his own open-source tools (Truss, Cogway). Success is reputation growth
(reach, citations, inbound leads) and continued publishing quality, not
raw traffic for its own sake.

## Positioning

Verified rigor plus shipped proof: every quoted or attributed claim in a
post is independently sourced (not inferred or fabricated), the writing is
deliberately scrubbed of AI-generated-prose tells (no em dashes, no
unsourced quotes, no AI attribution), and the technical claims are backed
by real, shipped open-source packages (Truss, Cogway) rather than
theoretical takes. A neighboring Laravel/AI blog could match the topics
but not this combination of sourcing discipline and working proof.

## Operating Context

Astro 5 static site, content as Markdown with YAML frontmatter in content
collections (posts, pages). Posts belong to series (e.g. the how-to-use-ai
series, the event-sourcing series) and some ship alongside dense printable
cheat sheets. Cover images and third-party images carry attribution
requirements (`credits/index.md`). Publishing a new post or anything
visual-identity-level goes through a branch + PR; smaller fixes (visual
tweaks, version bumps, docs) can go direct to `master`, which deploys to
production within ~5 minutes via a cron pull. Posts get cross-posted to
dev.to/Medium and promoted on LinkedIn; the author personally drives
cross-posting and social UI, Claude drafts the copy. Newsletter capture
(MailerLite) and a cheat-sheet lead magnet exist as secondary conversion
paths alongside the Consulting page CTA.

## Capabilities and Constraints

- Single-column layout, no sidebar (see CLAUDE.md `## Layout`); nav is
  Articles / Projects / About me plus a theme toggle.
- Two owned OSS products get promoted from this site: Truss (live ERD
  viewer for Laravel, "Structure only, never data.") and Cogway
  (interactive explainers for Laravel/PHP mechanisms). Truss sits one tier
  above Cogway in promotional weight (promo box + series + a brand mark);
  Cogway gets a lone icon.
- `llms.txt` / `ai.txt` are hand-maintained, not generated; every new post
  or durable reference page needs a manual entry.
- Dark mode and reading-mode (native reader eligibility + in-site toggle)
  are supported; accessibility test suite exists
  (`test:accessibility`, `test:accessibility-components`).
- Consent-gated analytics (GTM deferred until consent); no CSP currently
  configured (scoping plan exists but is not a current blocker).
- Nothing on the site may fabricate testimonials, benchmarks, pricing, or
  case studies; every attributed claim must be independently verifiable.

## Brand Commitments

- Name/voice: Alberto Arena, Senior Software Engineer, first-person
  technical voice.
- Author photo and bio are real assets (`/photo.jpg`, About page).
- Durable, already-documented writing rules govern every post and must be
  treated as binding, not re-litigated per surface: no em dashes
  (`.claude/rules/` + CLAUDE.md), no AI attribution in commits/PRs, the
  quote-sourcing standard (every quoted/attributed claim needs a verified
  external link), the sentence-level clarity pass
  (`.claude/rules/sentence-clarity.md`), and the publishing checklist
  (`.claude/rules/publishing-checklist.md`).
- Truss gets a fixed brand line on pitch surfaces (promo box, project
  card, meta description, llms.txt): "Structure only, never data." —
  published post bodies are not retrofitted with it.
- Triple-asterisk emphasis (`***like this***`) in long technical posts is
  a deliberate scanning aid, not a formatting accident; never flatten or
  remove it.

## Evidence on Hand

- Real, shipped work only: Truss (trussphp.com, Packagist package
  `albertoarena/laravel-truss`) and Cogway (cogway.dev), both with
  verifiable version/release history.
- Author's professional history is factual and sourced from the About
  page (SafariOffice for Accommodations, For Good Measure, Midleton
  Distillery Collection, Fonti e Radici) rather than invented client
  roster language.
- No testimonials, press mentions, or case-study numbers currently exist
  on the site; future work must not invent any to fill that gap.

## Product Principles

1. Every public claim is verifiable, not just plausible: sourcing
   discipline is the product, not a style preference.
2. Writing reads as a specific person, not generated prose: mechanical
   rules (no em dashes, clarity pass) exist to catch AI tells, but the
   bar is "sounds like Alberto," not just "passes the checklist."
3. Promotion is proportionate to ownership and maturity: Truss (flagship,
   most mature) outranks Cogway (newer) in visual/promotional weight; the
   blog itself never inflates either beyond what's actually shipped.
4. Production changes are real production changes: there's no staging
   environment, so anything that goes to `master` is live within
   minutes, and new posts always go through review (branch + PR), not
   direct push.
5. Confidentiality boundaries are absolute: infra details (IPs, hosting
   account identifiers, credentials) never land in tracked files, even in
   planning docs, because the repo is public.

## Accessibility & Inclusion

Dedicated accessibility test suites exist (`test:accessibility`,
`test:accessibility-components`) and are run as part of the standard test
pass. No further product-specific accessibility requirement beyond
general web accessibility has been established; treat axe-core-clean as
the working bar until a stronger requirement is confirmed.
