---
title: "Event sourcing with a little help from AI"
date: "2026-04-22T10:00:00.000Z"
template: "post"
draft: false
slug: "ai-laravel-event-sourcing"
category: "Laravel"
tags:
  - "PHP"
  - "Event sourcing"
  - "Spatie"
  - "Laravel"
  - "AI"
  - "Claude"
description: "A Claude Code skill that designs and generates event-sourced Laravel domains, one conversation at a time."
---

A while back I published a [Laravel package to generate event-sourcing domains using Spatie's library](https://github.com/albertoarena/laravel-event-sourcing-generator/). You describe your model, run one artisan command, and get aggregates, events, projectors and all the accompanying boilerplate. It crossed 8,000 downloads on Packagist, which was a nice surprise.

The package works well for straightforward cases. Feed it a migration, get a domain. But event sourcing stops being straightforward pretty quickly. Real domains have invariants, side effects, read models, and decisions that a CLI flag can't capture. The generator could scaffold the files; it couldn't help you think through the design.

That's the gap I wanted to close with the new version.

👉 [claude-laravel-event-sourcing on GitHub](https://github.com/albertoarena/claude-laravel-event-sourcing)

## What it is

This isn't a Composer package — it's a **Claude Code skill**. You install it into your project's `.claude/skills/` directory and trigger it from Claude Code. Instead of wrapping an artisan command in AI, I redesigned the whole workflow around a conversation.

The skill works in two gates.

**Gate 1 — Design.** Claude asks you five focused questions about your domain: what the feature does, what state transitions are involved, what triggers commands, whether you need read models, and what side effects matter. From your answers it produces an Architecture Decision Record — a short document listing the aggregates, commands, events, projectors, and reactors it plans to build, plus anything explicitly out of scope. It then stops and waits. Nothing gets generated until you say you're happy with the design.

**Gate 2 — Implementation.** Once you approve the ADR, Claude generates the full domain in a deliberate order: directory structure, then tests first (TDD), then commands and handlers, then the aggregate root, then events, projectors with migrations, reactors, and finally registration in the config. It runs the tests and reports the result.

If it hits an ambiguity during implementation that the ADR didn't cover, it pauses and asks rather than making a silent assumption.

## Why this matters

The artisan-based generator was useful precisely because it was mechanical. It did exactly what you told it. But the hard part of event sourcing isn't writing the aggregate class — it's deciding what the aggregate *is*, which events cross a boundary, and where a projector ends and a reactor begins.

The new skill treats those decisions as a conversation rather than a parameter. You still make the calls; Claude just makes sure you've made them before writing the code.

It's also strict about scope. It won't help you refactor an existing CRUD app into event sourcing, and it won't work with anything other than `spatie/laravel-event-sourcing` v7. Keeping it narrow keeps the output reliable.

## Installation

```bash
mkdir -p .claude/skills
git clone https://github.com/albertoarena/claude-laravel-event-sourcing.git /tmp/claude-les
cp -r /tmp/claude-les/skill/laravel-spatie-event-sourcing .claude/skills/
rm -rf /tmp/claude-les
```

For a global install available across all your projects:

```bash
cd ~/.claude/skills
git clone https://github.com/albertoarena/claude-laravel-event-sourcing.git
```

Requirements: Laravel 10+, PHP 8.2+, Spatie event sourcing v7, and Pest or PHPUnit.

A verification script checks your setup before the first run, so you won't get halfway through a generation and discover a missing migration.

## What gets generated

After approval, the skill produces a complete domain under `app/Domain/<Context>/`:

```
app/Domain/<Context>/
├── Aggregates/
├── Commands/
├── CommandHandlers/
├── Events/
├── Projectors/
├── Reactors/
└── ReadModels/

tests/Feature/<Context>/
database/migrations/
```

Everything compiles, the tests run green, and the domain is registered in your config. The original generator gave you a skeleton to fill in. This gives you something closer to a working first draft.

## Closing thought

I'm still a fan of the artisan command for simple cases — it's fast and predictable. But if you're starting a new domain and you're not completely sure where the boundaries sit, having a design conversation before the code appears is worth the extra five minutes.

The skill is at v0.1.0. If you try it and run into gaps, issues are open on GitHub.
