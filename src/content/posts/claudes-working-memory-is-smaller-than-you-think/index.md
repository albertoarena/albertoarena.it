---
title: "Claude's Working Memory Is Smaller Than You Think"
date: "2026-07-10T12:00:00.000Z"
template: "post"
draft: false
slug: "claudes-working-memory-is-smaller-than-you-think"
category: "AI"
tags:
  - "AI"
  - "Claude"
  - "Prompting"
description: "Anthropic's J-space research shows Claude's internal reasoning workspace is small. Here's what that changes about how I sequence prompts when building a feature."
socialImage: "/images/posts/claudes-working-memory-is-smaller-than-you-think/cover.jpg"
---

![Claude's Working Memory Is Smaller Than You Think](/images/posts/claudes-working-memory-is-smaller-than-you-think/cover.jpg)

What Anthropic's J-space research means for how you should prompt.

Anthropic recently published [research on a mechanism they call the J-space](https://www.anthropic.com/research/global-workspace), a small internal workspace Claude appears to use when working through multi-step reasoning. Not for fluent recall or basic grammar, that skips it. It shows up for genuine reasoning: working out a hidden answer step by step, planning ahead, catching something nobody flagged.

One example from the paper: prompt Claude with "The number of legs on the animal that spins webs is," and a "spider" pattern lights up in the J-space right before it answers "8." Swap that internal pattern for "ant" mid-generation, and the answer changes to "6." The workspace is doing real work in the reasoning chain, not just reflecting a decision made elsewhere.

The interesting part, for my purposes, is the size. In Anthropic's own words, the J-space "holds only a few dozen concepts at a time, and accounts for less than a tenth of the overall activity in Claude's internal processing." It also evolves token by token as Claude generates, not as a fixed budget that persists across a whole conversation.

I read it as an engineer, not a researcher. My question was practical: does this change how I should write prompts when I'm building a feature? The paper itself makes no prompting recommendations, and what I'm about to describe is an analogy borrowed from a mechanism that operates inside a single generation step, not a documented claim about prompt length or conversation size. But the parallel held up when I tried applying it, so here's what I do.

Short answer: yes, and the fix isn't more detail, it's sequencing.

## The habit I had to unlearn

My first instinct when asking for a feature is to write everything I know in one go. Something like:

> Add login logging to my Laravel app, use events, store IP and user agent, add a dashboard to view logs, make it TDD, and don't break my existing auth.

That's six separate decisions crammed into one turn: event architecture, schema design, UI, testing strategy, backward compatibility, plus whatever my existing auth code looks like. The problem isn't the prompt's length, it's that six unrelated tradeoffs are asked for at once instead of one at a time. If the workspace really is that limited, this is the prompting equivalent of asking someone to solve five problems in their head simultaneously. Something gets diluted.

## Staging the same feature instead

Take a real example: logging every login attempt (success and failure) for security auditing, in a Laravel app that already uses [Spatie event sourcing](https://spatie.be/docs/laravel-event-sourcing/v7/introduction) elsewhere.

**Step 1, the architecture question alone.** No code yet.

> I want to log every login attempt in a Laravel app that already uses Spatie event sourcing for other domains. Where should this logic live: a listener on the built-in `Illuminate\Auth\Events\Login` and `Failed` events, or a proper event-sourced aggregate? Walk through the tradeoff before recommending.

One decision, one reasoning chain. It mirrors the spider example in spirit: settle what a later step depends on before asking for that later step.

**Step 2, build on the settled answer.**

> Given the listener approach, what should the log entry schema look like? I care about querying by IP range and by user later.

No need to restate the whole feature. The previous decision is already settled, so this prompt only asks for one more layer of reasoning.

**Step 3, constraints stated once, positively.**

TDD is non-negotiable for me, so I state it once, at the point it's relevant, rather than repeating it as a hedge in every message:

> Now write the failing tests first for the listener and the log model, Pest style.

Anthropic's researchers also found something worth noting here: telling the model what *not* to think about doesn't fully suppress the concept, it just weakens it. A positive instruction lands cleaner than a negative one.

**Step 4, skip the ceremony for boilerplate.**

Not everything needs staging. Generating the migration file or the model skeleton is closer to fluent recall than real reasoning, so I ask for that directly, in one shot. I save the careful, one-question-at-a-time approach for the steps that involve an actual tradeoff: architecture, edge cases (do you log an attempted email for a non-existent user, or is that a privacy problem), anything two reasonable engineers might disagree on.

<img src="/images/posts/claudes-working-memory-is-smaller-than-you-think/diagram.webp" alt="One prompt with six decisions at once versus a staged sequence of one decision per turn" class="mx-auto block dark:invert max-w-full" />

## A short checklist

- Is this step a real decision, or recall and boilerplate? Stage only the former.
- Am I asking one question, or secretly five?
- Am I building on a settled answer, or restating context I already gave?
- Is my instruction phrased as "do X" or "don't do Y"? Prefer "do X."

## One caveat

This is a practice based on evidence about how the mechanism seems to behave, not a proven prompting technique. Anthropic is careful to frame the J-space findings in terms of access to information, not a claim about consciousness or experience. I'm applying the same caution here: staged prompting lines up with what they found, it isn't a guarantee.

If you want to dig into the research itself, it's worth reading in full: [anthropic.com/research/global-workspace](https://www.anthropic.com/research/global-workspace). Either way, the practice holds up on its own: fewer decisions per prompt gets me answers I trust more, mechanism or not.
