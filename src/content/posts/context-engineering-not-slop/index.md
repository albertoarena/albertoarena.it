---
title: "Context Engineering: The Discipline That Keeps AI From Writing Slop"
date: "2026-08-17T10:00:00.000Z"
template: "post"
draft: false
slug: "context-engineering-not-slop"
category: "AI"
tags:
  - "AI"
  - "Claude Code"
  - "Code Quality"
  - "DevTools"
description: "AI slop isn't usually a bad model, it's bad context. Here's the discipline that prevents it, the failure modes behind it, and three checks you can actually run to enforce it."
socialImage: "/images/posts/context-engineering-not-slop/cover.jpg"
coverAlt: "Top-down flat lay of an architectural blueprint, ruler, pens, and an orange set square on a wooden desk"
series:
  slug: "how-to-use-ai"
  order: 4
---

> "The art of providing all the context for the task to be plausibly solvable by the LLM."
>
> Tobi Lütke, Shopify CEO, on [X](https://x.com/tobi/status/1935533422589399127), June 19, 2025

That's the definition Tobi Lütke gave the term "context engineering" when he decided he liked it better than "prompt engineering." I think it's the right definition, and I think most people complaining about AI slop are one inference away from noticing why.

A vibecoder who fires a prompt at an agent with no project context isn't getting a worse model than the one I use. They're getting the same model doing its honest best with nothing to ground it: no rules file, no memory of yesterday's decisions, no pointer to the component that already solves this. So it invents something plausible. Inconsistent naming, a reinvented helper that already exists three files over, an architecture assumption that was wrong two refactors ago. That's not the model being bad. That's the model being under-informed, confidently.

Anthropic, LangChain, and the team behind Manus have all converged on the same finding from production agents: most agent failures are context failures, not model failures. Bad context in, sloppy software out.

## The four ways context goes wrong

The clearest breakdown of *how* context fails comes from Drew Breunig's [How Long Contexts Fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html): poisoning, distraction, confusion, and clash. What follows is my own relabeling of those four, translated into what each one actually looks like in a codebase rather than restated in Breunig's original terms:

| Failure mode | What it looks like |
|---|---|
| **Burst** | Everything gets dumped into context upfront, so the one relevant fact is buried under forty irrelevant ones and the agent weighs them about equally |
| **Poisoning** | One wrong or hallucinated detail early in a session (a method that doesn't exist, a convention that was never real) gets treated as fact for the rest of it |
| **Noise** | The context is technically all relevant, just too much of it, so the signal-to-text ratio collapses and the agent can't tell what actually matters right now |
| **Conflict** | The system prompt says one thing, the project's rules file says another, and the agent has to guess which one wins, silently, every time |

None of these are model problems. They're all things a human decided, or failed to decide, about what the agent sees and when. Which means they're fixable the same way any other engineering problem is fixable: on purpose, not by accident.

## What it looks like when it's done on purpose

I'd rather show this than diagram it, so here's the actual `CLAUDE.md` from [Truss](https://github.com/albertoarena/laravel-truss), a Laravel package I maintain. It's [52 lines long](https://github.com/albertoarena/laravel-truss/blob/main/CLAUDE.md), it states the stack, the commands, and a short list of invariants that must never break, like "no data exposed, ever, only structure," and then it stops:

```markdown
## Pointers

- Architecture and domain model: `docs/DESIGN.md`
- Phased build plan: `docs/INSTRUCTIONS.md`
- Decision log: `docs/DECISIONS.md`
- Path-scoped rules (auto-load when matching files are touched): `.claude/rules/`

This file should stay short enough to read in under a minute. If you're
about to add detail, it probably belongs in `docs/` instead, with a
pointer added here.
```

Everything that isn't needed on every single turn lives one hop away instead of sitting resident in context by default. That's not a documentation choice, it's a context budget: the file names its own constraint and holds itself to it. Those `.claude/rules/` files are real, not a placeholder: `introspection.md` scopes to `src/Introspection/**`, `frontend.md` to `resources/js`, `resources/css`, and `resources/views`, `release.md` to `CHANGELOG.md`, each one loading only when Claude actually touches a matching path, not resident by default the way `CLAUDE.md` itself is. I've written up the fuller mechanics of how that split works, RAM versus demand-paged rules versus skills versus disk, in [CLAUDE.md Is RAM, Skills Are Not Disk](/posts/claude-md-skills-are-not-disk/), if you want the reasoning behind the shape rather than just the result.

The point here isn't "copy this file." It's that the file is small enough to *audit*. Compare that to the ordinary case: a three-hundred-line `CLAUDE.md` nobody's re-read in months isn't context engineering, it's context archaeology, and the agent is the one doing the digging, badly, every session.

## Three checks, not a checklist

A checklist gets skimmed once and forgotten. What actually holds a team to this is something mechanical enough to enforce, so here are three checks, in ascending effort, none of which require trusting anyone's discipline going forward.

**A line budget.** Truss's `CLAUDE.md` states its own limit in prose, "short enough to read in under a minute", but doesn't enforce it, and reading time isn't something CI can check directly. Line count is the closest cheap proxy, so here's what that could look like as a CI step (120 is my own suggested threshold, not a number Truss enforces today):

```yaml
- name: Keep CLAUDE.md readable in under a minute
  run: |
    LINES=$(wc -l < CLAUDE.md)
    if [ "$LINES" -gt 120 ]; then
      echo "CLAUDE.md is $LINES lines, over the 120-line budget. Move detail to docs/."
      exit 1
    fi
```

Cheap, mechanical, and it's enforcing a rule the file already claims for itself.

**A drift check.** This is the one I trust most, because it's the same idea Truss already applies to database schemas. A committed export file, checked against the live schema, build fails if they've drifted apart:

```
php artisan truss:export --output=schema.dbml --check
```

It compares the freshly generated export against whatever's already committed at that path and exits non-zero if they don't match byte for byte, the same mechanism as `git diff --exit-code` for a generated file, just schema-aware. Context files rot the exact same way, except what's usually committed is nothing: no file that gets checked against the thing it describes. Does every path `CLAUDE.md` points to still exist? Was `docs/DESIGN.md` last touched *before* the architecture it describes changed? A pre-commit hook or CI step that resolves every referenced path and flags anything missing or stale catches the failure mode that actually bites: an agent working confidently off documentation that quietly stopped being true.

**Golden-task regression checks.** A small, fixed set of representative prompts, "add a new artisan command," "explain the authorization gate", run periodically against whatever the current context bundle produces, with the expected shape of the answer written down somewhere. This one doesn't fully automate. But even a manual pass before a release catches the case the other two checks can't: a change to a rules file that's individually reasonable but breaks something two files away, silently, because nobody asked the agent to actually do the task before shipping the instruction change.

None of these are exotic. They're linting, drift detection, and regression testing, the same three things you'd already reach for if the artifact in question were code instead of prose. That's the actual point: it is code, in every way that matters except syntax highlighting.

## The discipline is the whole difference

The vibecoder fires prompts into a context vacuum and ships whatever comes back, because "prompting" is the only lever they know is there. The engineer treats context, the rules file, the memory, the docs it points to, as a first-class artifact: versioned, reviewed, budgeted, checked for drift, same as anything else that ships. Same model, same tool, wildly different output, and the difference was never the prompt.

If you're looking at a vibe-coded app that feels inconsistent, half-finished, confidently wrong about how your own codebase works, don't ask what model built it. Ask what it was allowed to see.
