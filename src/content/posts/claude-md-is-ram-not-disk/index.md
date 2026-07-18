---
title: "CLAUDE.md Is RAM, Not Disk: A Memory Model for Claude Code Projects"
date: "2026-06-28T12:00:00.000Z"
template: "post"
draft: false
slug: "claude-md-is-ram-not-disk"
category: "AI"
tags:
  - "AI"
  - "Claude"
  - "Laravel"
  - "DevTools"
description: "Why a growing CLAUDE.md makes Claude Code worse, and a simple RAM/disk model for structuring your docs instead, plus a Laravel starter repo you can copy."
socialImage: "/images/posts/claude-md-is-ram-not-disk/cover.jpg"
pinned: true
---

![CLAUDE.md Is RAM, Not Disk: A Memory Model for Claude Code Projects](/images/posts/claude-md-is-ram-not-disk/cover.jpg)

Most Claude Code projects I see have one giant `CLAUDE.md` that keeps growing until it is three hundred lines long, and somewhere around line two hundred the assistant starts getting worse instead of better. That is not bad luck. That file is loaded into context at the start of the session and stays resident there, so every line you add is a line Claude carries in front of it on every turn that follows — context it reads past before it gets to your actual task. The fix is not a longer file. It is treating `CLAUDE.md` like RAM and the rest of your docs like disk.

Here is the whole idea in one sentence: `CLAUDE.md` is working memory, loaded constantly and paid for constantly, so it stays small; the `docs/` folder is long-term memory, loaded only when something points to it. Once that distinction clicks, every other decision about where a piece of information should live answers itself.

## Why the big file hurts

Claude Code reads `CLAUDE.md` automatically at the start of every session and keeps it in context the whole time. That is exactly what you want for the handful of things Claude needs on every task: your stack, your commands, the rules that must always hold. It is exactly what you do not want for the things Claude needs once a week. A long domain description or a full architecture writeup sitting in `CLAUDE.md` does not make Claude smarter. It crowds the context with detail that is irrelevant to the task in front of it, and it costs you tokens on every turn whether you use it or not.

The test I use is simple. Does Claude need this every time, or only sometimes? Every time goes in `CLAUDE.md`. Sometimes goes in `docs/`, with a one-line pointer from `CLAUDE.md` so Claude knows where to look when it actually needs it.

## What belongs in RAM

`CLAUDE.md` should be short enough that you can read it in under a minute. Mine for a Laravel project holds five things:

- A two or three sentence overview of what the project is.
- The stack with versions pinned. "Laravel" is not enough. "Laravel 11, PHP 8.3, Pest 3" is.
- The exact commands: test, lint, static analysis, dev server. Claude should never guess these.
- The conventions that must hold on every change. For me that is TDD with Pest first, KISS, event sourcing through Spatie where it earns its place, domain logic kept free of framework code, and `envaudit` validating `.env` in CI.
- Pointers out. One line each: architecture is in `docs/DESIGN.md`, current work is in `docs/PLAN.md`, decisions are in `docs/DECISIONS.md`.

That last group is the trick. `CLAUDE.md` does not contain the architecture. It contains the address of the architecture. Claude loads the detail on demand when a task needs it, and the rest of the time that detail is not burning context.

## What belongs on disk

The `docs/` folder is where the long material lives, and because it loads on demand it can be as long as it needs to be. Three files cover most projects:

`DESIGN.md` is the architecture and domain model. Bounded contexts, aggregates, the events each one records, the invariants they protect. This is your thinking written down once so Claude does not reinvent it every session, and so that when it asks "where does this logic belong" the answer is derivable from the file.

`PLAN.md` is the phased, plan-first breakdown of the work. Small phases, each finishable and verifiable, checked off as they land, with a short done log at the bottom so progress survives between sessions.

`DECISIONS.md` is a lightweight decision log. One short entry per significant choice: context, decision, trade-off. This is the file that stops you and Claude relitigating the same question three sessions later.

Add more only when a real need shows up. A `TESTING.md` when your test strategy is genuinely non-obvious. A separate `DOMAIN.md` when the glossary outgrows `DESIGN.md`. Not before. Empty scaffolding is just more for Claude to read.

## The trick most setups miss: nested files

Claude Code does not only read the root `CLAUDE.md`. It also reads a `CLAUDE.md` in the directory it happens to be working in, layered on top of the root one. That means rules which only matter inside one folder can live in that folder instead of bloating the root file.

In a Laravel project with a real domain layer, I put a `CLAUDE.md` inside `app/Domains` that says: no framework imports here, aggregates extend Spatie's `AggregateRoot` and only record events, events are immutable and past-tense, and every change starts with a Pest test. None of that needs to be in the root file, because it is irrelevant when Claude is editing a controller or a Blade view. It loads exactly when Claude steps into the domain layer, and not before.

## The starter

I put all of this into a small template repo you can copy straight into a project: [claude-code-laravel-starter](https://github.com/albertoarena/claude-code-laravel-starter). It is the structure above, with every file as a fillable template rather than lorem ipsum, the Laravel and event sourcing conventions already baked in, and a nested domain-layer `CLAUDE.md` so the pattern is concrete.

```
claude-code-laravel-starter/
├── CLAUDE.md              # the lean anchor, auto-loaded every session
├── README.md
├── docs/
│   ├── DESIGN.md         # domain model, aggregates, events
│   ├── PLAN.md           # phased, plan-first implementation
│   └── DECISIONS.md      # lightweight ADR log
└── app/
    └── Domains/
        └── CLAUDE.md     # rules for the domain layer only
```

Copy it onto a fresh Laravel app, fill in your real stack and commands, replace the example domain with yours, and keep the root file tight.

## Three rules to take away

If Claude needs it every time, it goes in `CLAUDE.md`. If only sometimes, it goes in `docs/`. Start with three files and add more only when something real demands it. And when a folder gets its own rules, give it its own `CLAUDE.md` instead of stretching the root one.

Start small, keep working memory tight, and let the disk hold the rest.
