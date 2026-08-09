---
title: "CLAUDE.md Is RAM, Skills Are Not Disk: The Four-Tier Memory Model for Claude Code"
date: "2026-07-27T10:00:00.000Z"
template: "post"
draft: false
slug: "claude-md-skills-are-not-disk"
category: "AI"
tags:
  - "AI"
  - "Claude"
  - "Claude Code"
  - "Laravel"
  - "DevTools"
description: "Skills look like the disk tier of the CLAUDE.md memory model. They are not. Here is the four-tier model that actually fits: RAM, path-scoped rules, skills, and disk."
socialImage: "/images/posts/claude-md-skills-are-not-disk/cover.jpg"
coverAlt: "CLAUDE.md Is RAM, Skills Are Not Disk: The Four-Tier Memory Model for Claude Code"
---

Claude Code loads `CLAUDE.md` in full at the start of every session and keeps it resident the whole time, so every line in it is a line you pay for on every turn, whether the task in front of you needs it or not. [CLAUDE.md Is RAM, Not Disk](/posts/claude-md-is-ram-not-disk/) split that into two tiers to deal with it: `CLAUDE.md` holds only what Claude needs every time, stack, commands, invariants; everything else moves to `docs/`, which loads only when something points Claude there. Working memory stays small and constantly paid for. Long-term memory stays cheap because it's optional.

I wasn't using custom skills when I wrote that post. Once I started, the obvious move was to file them under disk too: they're detail Claude doesn't need every turn, so surely they belong wherever the rest of the on-demand material lives. That reasoning is wrong, and it took checking how skills actually behave in context to see why. A skill is not a document Claude opens when curious. It's closer to a program that gets launched, and treating it like disk is how invariants end up sitting behind a trigger that might not fire.

Here's the model with two more tiers than it had before: `CLAUDE.md` is RAM, path-scoped rules are demand-paged RAM, skills are installed programs, and `docs/` is disk. Each tier answers the same question differently: when does this load, and what happens to it after. Get that question right for a given piece of instruction and the tier picks itself.

*Checked against Claude Code v2.1.212 on July 27, 2026. The listing and compaction budgets below are the kind of number that moves; verify them against the current docs before leaning on the exact figures.*

## What the two-tier model couldn't see

The original test was: does Claude need this every turn, or only sometimes? That question sorts `CLAUDE.md` from `docs/` correctly, but it quietly assumes there are only two ways for something to load: resident from the start, or resident only once Claude decides to open a file. Path-scoped rules and skills both load conditionally, and neither one is "Claude decides to open a file."

A rule loads because a file path matched a glob. That's deterministic, the same way session start is deterministic, just scoped instead of constant. A skill loads because Claude matched a task description to a name in a list. That's probabilistic: it matches text, so it usually fires and sometimes does not. Collapsing those two into "sometimes" and filing both next to `docs/` erases the one distinction that actually matters: whether the content is guaranteed to show up when you need it, or merely likely to.

## Tier 1: RAM, unchanged

`CLAUDE.md` still works exactly the way the first post described it: loaded in full at session start, resident every turn after, re-read from disk and re-injected after `/compact`. Adding three more tiers doesn't change what belongs here, stack, commands, the handful of invariants that must never break. It's still the only tier with no "when does this load" question to answer. The answer is always.

## Tier 2: demand-paged RAM, and a correction to the first post

The nested `CLAUDE.md` trick from the original post still works, but there's a cleaner mechanism for the same job. If you copied that trick into your own project, this is the point where I'd tell you to migrate it. `.claude/rules/*.md` files with a `paths:` glob in their frontmatter load into context the same way a nested `CLAUDE.md` does, when Claude reads a file that matches. The docs say a nested `CLAUDE.md` is not re-injected after `/compact` and reloads the next time Claude touches that subdirectory. They don't say the same for rules, and my own testing suggests it behaves the same way.

Leave off `paths:` and none of this applies. A rule file without it loads at launch with the same priority as `.claude/CLAUDE.md` itself, so `.claude/rules/testing.md` with no frontmatter is tier 1 wearing a different folder, not tier 2. The mechanism doesn't decide the tier. The loading behavior does.

What a scoped rule adds over the nested `CLAUDE.md` it replaces: the glob cuts across the directory tree instead of being pinned to one folder, so "every `*.php` file under `app/Domains`, but not the tests next door" is one line, instead of a rule you cannot express. Every rule file also lives in one folder instead of being scattered one per directory, so reviewing what conditional context exists in a project is a single `ls`, not a find across the tree. Same loading behavior as before, better shape:

```markdown
---
paths:
  - "app/Domains/**/*.php"
---

# Domain layer rules
```

## Tier 3: installed programs

A skill's name and description sit in a listing Claude can see from the start of the session, and that listing has its own budget: roughly 1% of the context window. When it overflows, Claude Code shortens descriptions starting with the skills you invoke least, so the ones you use constantly keep their full text and a skill you just added competes for space with everything else you've built. None of that costs much, which is the entire pitch: a project can carry thirty skills for a fraction of what thirty paragraphs in `CLAUDE.md` would cost, as long as most of them don't fire in most sessions.

The moment one does fire, that pitch stops applying. The full `SKILL.md` body enters context and stays resident for the rest of the session, at the same per-turn cost as anything in `CLAUDE.md`. Compaction treats it better than you'd expect but worse than the root file: the first 5,000 tokens of each invoked skill survive `/compact`, shared across a 25,000 token combined budget, filled starting from whichever skill fired most recently. Invoke enough skills in one long session and the ones you called early get dropped entirely, quietly, with no warning that they're gone.

Two things make a skill something other than either RAM or disk. It can bundle scripts that run without their code ever entering context, only the output does, which nothing in `CLAUDE.md` or `docs/` can do. And you can turn off its automatic trigger with `disable-model-invocation: true`, so it only runs when you type `/name`, trading the "maybe it fires" problem for "you have to remember to ask." That flag does more than disable auto-firing: it pulls the name and description out of the listing entirely, not just out of the trigger, so a skill set this way is the one case that costs nothing at all until you invoke it. That second point cuts both ways: a skill can also grant itself tool access through `allowed-tools`, which makes a committed project skill something you review the way you'd review a settings file, not something you skim the way you'd skim a doc. Skills accept a `paths:` glob too, the same format as rules, but it only narrows when Claude considers firing one automatically, so a scoped skill is filtered, not guaranteed.

Skills are not disk, because disk is passive. A skill is an installed program with an entry in a lookup table, dormant until something calls it, and then it runs. That's also why the failure mode is specific. Putting a procedure behind a skill trigger is fine, because the cost of it not firing once is that Claude does the steps manually instead of running the script. Putting an invariant behind a skill trigger is not fine, because the cost of it not firing once is that the rule silently didn't apply, and a fuzzy description match is a bad place to gamble something that must always hold.

## Tier 4: disk, unchanged

`docs/` still works exactly the way the first post described it. `DESIGN.md`, `PLAN.md`, `DECISIONS.md`, long prose that humans read too, loaded only when something points to it and only because Claude decided to follow the pointer. It's still the weakest guarantee of the four tiers, and that's correct: disk was always supposed to be the tier you fall back to for material that doesn't need to be certain, only available.

One trap is worth closing here, since it's the most common way people think they're on disk when they aren't. `@docs/DESIGN.md` inside a `CLAUDE.md` is not a pointer, it's an import: the file is expanded and loaded into context at launch, same as everything else in the root file. A plain prose reference, `docs/DESIGN.md`, no `@`, is what actually stays on disk until Claude follows it. The first post used prose pointers throughout, which was the right call, more by luck than by design.

## The four tiers side by side

| Tier | Mechanism | Loaded when | Resident cost | Survives `/compact` |
|---|---|---|---|---|
| 1. RAM | Root `CLAUDE.md` | Session start, in full | Every turn | Yes, re-read from disk and re-injected |
| 2. Demand-paged RAM | `.claude/rules/*.md` with `paths:` | Claude reads a file matching the glob | Every turn after that, for the rest of the session | No, lost until Claude reads a matching file again (inferred, not documented) |
| 3. Installed programs | Skill in `.claude/skills/` | Name and description always listed unless `disable-model-invocation`; body loads on trigger | Resident for the rest of the session once triggered | First 5,000 tokens per skill, 25,000 combined, most recent first |
| 4. Disk | `docs/*.md` referenced by path (not `@` imported) | Only if Claude decides to read it | Every turn after Claude reads it | Whatever survives the summary |

Read top to bottom and it's also a certainty gradient. Tier 1 is guaranteed. Tier 2 is guaranteed for the files it's scoped to. Tier 3 is probable, or certain only if you invoke it yourself. Tier 4 is optional. Deciding where a piece of instruction belongs is really deciding how much certainty it needs.

## Applied to a Laravel and event sourcing project

The starter repo from the first post had three tiers: root `CLAUDE.md`, `docs/`, and a nested `CLAUDE.md` inside `app/Domains`. It now has all four:

```
claude-code-laravel-starter/
├── CLAUDE.md                    # tier 1: stack, commands, invariants
├── README.md
├── .claude/
│   ├── rules/
│   │   └── domain.md            # tier 2: paths: ["app/Domains/**/*.php"]
│   └── skills/
│       └── README.md            # tier 3: how to install a project skill
├── docs/
│   ├── DESIGN.md                # tier 4: domain model, aggregates, events
│   ├── PLAN.md                  # tier 4: phased, plan-first implementation
│   └── DECISIONS.md             # tier 4: lightweight ADR log
└── app/
    └── Domains/                  # rules replace the nested CLAUDE.md that used to live here
```

`domain.md` keeps the rule that used to live in the nested file: no framework imports in the domain layer, aggregates only record events, events are immutable and past tense. What changed is where it lives: one file in a folder you can review alongside every other conditional rule in the project, instead of a `CLAUDE.md` you have to remember exists three directories down. `.claude/skills/` doesn't ship a fake example skill; it documents how to install the real one, my [Laravel event sourcing skill](https://github.com/albertoarena/claude-laravel-event-sourcing), which designs and generates the aggregate, events, and projector for a new bounded context in conversation.

## Four rules to take away

If Claude needs it every turn, it goes in `CLAUDE.md`. If it only matters inside files that match a pattern, it goes in a rule, not a nested `CLAUDE.md`. If it's a procedure with steps, a script, or a template, it goes in a skill, and anything that shouldn't fire on its own gets `disable-model-invocation: true`. If it's long enough that a human should read it too and Claude only needs it sometimes, it goes on disk.

The two-tier version of this held up fine for a while. It just couldn't tell you where to put the thing that runs.
