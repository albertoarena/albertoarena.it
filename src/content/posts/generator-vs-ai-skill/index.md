---
title: "I built a Laravel event-sourcing generator, then the AI version"
date: "2026-08-05T10:00:00.000Z"
template: "post"
draft: false
slug: "generator-vs-ai-skill"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Event sourcing"
  - "Spatie"
  - "AI"
  - "Claude"
description: "I built a deterministic Laravel event-sourcing generator, then a Claude Code skill that does the same job through a design conversation. Which one wins? Wrong question."
socialImage: "/images/posts/generator-vs-ai-skill/cover.jpg"
---

![I built a Laravel event-sourcing generator, then the AI version](/images/posts/generator-vs-ai-skill/cover.jpg)

A while back I built a [code generator for event sourcing in Laravel](/posts/laravel-event-sourcing-generator-10k/): run one artisan command against `spatie/laravel-event-sourcing`, get aggregates, events, projectors, and reactors scaffolded out. It's deterministic. Same inputs, same output, every time. It just crossed 10,000 downloads on Packagist.

More recently I built a [Claude Code skill](/posts/ai-laravel-event-sourcing/) that produces the same kind of domain code, except it starts with a conversation instead of a command. So the question people keep sending me is obvious: does the AI skill replace the generator?

No. And the reason is more interesting than the question.

The short version, if you skip everything else: AI didn't kill the code generator. It took over the *design* half of the job and left the deterministic half exactly where determinism still matters.

## What the generator is good at

The generator's whole value proposition is determinism. `composer require albertoarena/laravel-event-sourcing-generator`, then `php artisan make:event-sourcing-domain Order`, and you get exactly the files you'd expect, byte-identical every run. No tokens, no API key, no network dependency, nothing to review for "did it hallucinate a method." It runs the same in CI as it does on my laptop.

That's exactly right when I already know the shape of the domain: I know the aggregate boundary, I know the events, I just need the boilerplate written consistently. What it can't do is help me figure out whether that boundary is correct in the first place. It assumes I already did the hard part.

## What the skill is good at

The [skill](https://github.com/albertoarena/claude-laravel-event-sourcing) is not a code generator wearing an AI costume. Its value sits upstream of the code, in a two-gate workflow:

- **Gate 1, design.** It asks focused questions about the domain and produces an Architecture Decision Record: aggregates, commands, events, projectors, reactors, and the invariants holding them together. Nothing gets written until I approve that ADR.
- **Gate 2, implementation.** Once I approve it, it writes tests first, then generates the full domain, and runs the suite. For that `cancel`-after-`ship` rule, that means a test asserting the aggregate throws before a line of the aggregate itself exists, not after.

The part that actually matters is Gate 1. "Can `cancel` still fire after `ship`?" is a modelling question, and that's the conversation where event sourcing lives or dies. The generator was never going to have that conversation with me. It doesn't ask questions; it executes a decision I've already made.

## The real dividing line

Both tools end up emitting similar-looking PHP, which is why people fixate on the overlap. But codegen is the least interesting thing either one does. The line that actually matters is this:

- **I already know the design → the generator.** Deterministic, fast, no review tax, no dependency on an LLM being available or correct.
- **I'm still figuring out the design → the skill.** It's a modelling partner that leaves a paper trail (the ADR) and a safety net (tests written before the implementation exists).

## Which one I actually reach for

Honestly, mostly the skill these days. Most of the time I sit down to add a new bounded context, the boundary isn't fully settled yet, and paying for a five-minute design conversation before anything gets written is worth more than skipping straight to boilerplate. The ADR forces me to answer the awkward "wait, should that be an event or a side effect?" questions before they turn into a rewrite.

That doesn't mean the generator's properties stopped mattering. It still gets pulled out whenever the reasons I built it in the first place are the reasons that matter: expanding a domain whose shape is already locked in, running in a pipeline where I don't want an LLM in the loop, or anywhere determinism and zero token cost outrank a design conversation I don't need to have again. I just don't hit that situation as often as I used to, now that the skill exists.

## Where I don't use the skill at all

Being upfront about the edges is the point of writing this. The skill is greenfield only. It designs new event-sourced domains; it does not refactor existing CRUD into event sourcing, and it's scoped specifically to `spatie/laravel-event-sourcing` v7, not Laravel's own event system, not CQRS without event sourcing, not other packages. If that's your situation, neither tool here is the answer, and I'd rather say so than sell you a mismatch.

## Try either

If you're modelling a new event-sourced domain and Claude Code is already part of your workflow, the skill installs in two steps: the first points Claude Code at the marketplace (nothing installs yet), the second installs the plugin from it.

```
/plugin marketplace add albertoarena/claude-laravel-event-sourcing
/plugin install laravel-spatie-event-sourcing@albertoarena
```

If you already know the shape of the domain and just want the boilerplate, the generator is a Composer install away:

```bash
composer require albertoarena/laravel-event-sourcing-generator
php artisan make:event-sourcing-domain Order
```

Full write-ups of each, if you want the mechanics: [the generator](/posts/laravel-event-sourcing-generator-10k/), [the skill](/posts/ai-laravel-event-sourcing/), and the [original walkthrough of building a domain with Spatie event sourcing](/posts/domain-using-spatie-event-sourcing/) if you're new to any of this.
