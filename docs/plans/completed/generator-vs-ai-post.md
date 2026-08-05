# Article brief: "I built a code generator, then I built the AI version"

Brief for a blog session to write a new post. This is a content + positioning
brief, not a draft; write it in Alberto's voice from the material below.

## The one-line thesis

Alberto built **both** a deterministic Laravel code generator
(`laravel-event-sourcing-generator`, 10k+ installs) **and** its AI successor
(`claude-laravel-event-sourcing`, a Claude Code skill that designs and generates
the same domains through a conversation). The post is the honest answer to "now
that AI can do this, is the generator obsolete?" — told by the one person who
built both sides. Verdict: not obsolete; AI changed *which part of the job* each
tool does.

## Why write this (strategic, keep out of the prose)

- Hits the **Claude Code / AI-assisted-dev content pillar**, which GSC shows is
  generating real, under-served search demand.
- **Differentiated**: almost nobody has shipped both a deterministic generator
  and an AI-skill for the same task, so the comparison is uniquely credible.
- **Double duty**: it is the primary promotion vehicle for the Claude Code skill
  (drives installs) and cross-sells the 10k-download generator. See
  `dev-reputation/growth-strategy.md` Open next steps 11-12.

## Audience and angle

- **Primary audience: the AI-assisted-dev / Claude Code crowd**, secondarily
  Laravel devs. Lead with the AI-vs-deterministic tension, not with event
  sourcing mechanics.
- Tone: first-person, honest, no hype, no "AI changes everything." The value is
  the even-handed verdict from someone with skin on both sides.

## The content spine (make these points)

1. **Setup**: the generator exists (one artisan command scaffolds a whole Spatie
   event-sourced domain: aggregates, events, projectors, reactors). Then AI
   coding agents got good, so Alberto built the Claude Code skill that does the
   same job through a design conversation. Natural question: why keep the
   generator?
2. **Where the generator still wins** — be concrete: reproducible/deterministic
   output, no tokens, no hallucination, runs in CI, works offline, no API key,
   same result every time. Good for known, repetitive scaffolding.
3. **Where the AI skill wins** — designing a *new* domain, exploring bounded-
   context boundaries, handling ambiguity and non-standard shapes, adapting to
   your domain language, teaching while it builds. Good for the thinking part,
   not just the typing part.
4. **The real insight (the quotable core)**: AI didn't kill the code generator;
   it took over the *design* half and left the *deterministic scaffolding* half
   where determinism still matters. They are a spectrum, not a replacement — you
   can even design with the skill and lock in with the generator.
5. Short, concrete illustration of each: a snippet of the generator command +
   its output shape, next to a snippet of the design conversation with the skill.
   Show, don't just assert.

## Guardrails

- **Do not trash the generator** — it is a 10k-download credibility asset; the
  post's power is even-handedness.
- **Do not overclaim the skill** — no "AI replaces developers." The honest,
  measured verdict is the whole point.
- No em dashes (house style); use commas, colons, parentheses.

## Links and CTAs

- Internal links (root-relative, fit the interlink hub): the generator write-up
  (`/posts/domain-using-spatie-event-sourcing/`), the existing AI-skill post
  (`/posts/ai-laravel-event-sourcing/`), and Truss where natural.
- External: both GitHub repos; the skill's **one-command install** once live
  (`/plugin marketplace add albertoarena/claude-laravel-event-sourcing` then
  `/plugin install laravel-spatie-event-sourcing@albertoarena`).
- CTA: try the skill (install line), and try the generator for CI/scaffolding.

## Sequencing / dependency

Ideally publish **after** the skill's one-command install is live (see
`claude-laravel-event-sourcing/.docs/plans/distribution.md`), so the install CTA
works. If the install is not ready, either hold the post or soften the CTA to
"star the repo / watch for the plugin release."

## Working titles (pick/adapt)

- "I built a code generator, then I built the AI version. Here's which I reach for."
- "Does AI kill the code generator? I shipped both."
- "The code generator isn't dead. AI just took the other half of its job."

## After it ships (for the promotion tracker)

Log it in `dev-reputation/docs/articles/` (copy `_template.md`) and run the
standard rollout, but weight it to the **AI/Claude Code channels** (r/ClaudeAI,
Claude Code community, AI-dev X, dev.to `#claude`) over the Laravel ones.
