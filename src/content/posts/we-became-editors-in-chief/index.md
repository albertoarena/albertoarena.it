---
title: "We Became Editors-in-Chief, and Nobody Trained Us"
date: "2026-08-01T10:00:00.000Z"
template: "post"
draft: false
slug: "we-became-editors-in-chief"
category: "AI"
tags:
  - "AI"
  - "Developer Tools"
  - "Claude Code"
description: "Agentic development didn't make us prompt engineers. It made reviewing the job, and nobody built tooling yet for the real bottleneck: how long a human can stay sharp."
socialImage: "/images/posts/we-became-editors-in-chief/cover.jpg"
coverAlt: "A hand holding a red pen over a blank spiral notebook page on a wooden table"
---

Most of my working day now looks like this: I write a prompt describing what I want. An agent produces a diff. I read it, and either approve it or ask for a refinement. Repeat, dozens of times, until the feature is done.

Ask whether that makes us "prompt engineers" and you're asking the wrong question. Prompt wording is a thin skill, learnable in an afternoon. What's actually changed, after twenty-seven years of writing code the old way, is what the job does to your attention. Less typing. Much more reviewing, at a volume and pace nothing in my career prepared me for.

## The loop, honestly described

Strip away the branding and agentic development is a review cycle. You describe an outcome. The agent proposes an implementation. You check it against a mental model of what "correct" means for this codebase, this edge case, this architecture, and you either accept it or push back with more context.

That's not a new activity. It's code review, except the author on the other side never gets tired, never pushes back, and produces a plausible-looking diff in seconds whether it's right or not. The volume changes everything. When review is the bottleneck instead of typing, the job's centre of gravity moves with it.

## A different kind of tired

The old way was stressful in bursts. You'd hit a bug, lose an afternoon to it, feel the specific frustration of a stack trace that refuses to make sense. Stressful, but the pace was yours. Typing is slow. Debugging forces pauses. Whether you wanted it or not, there was slack built into the rhythm.

Agentic coding removes that slack. The agent doesn't pace itself to your attention span. It just keeps producing diffs, one after another, faster than you'd ever type them yourself. To review well you need prolonged, focused attention, held at a level that used to only show up during the hard parts. There's no natural lull left for your brain to reset in, because generation never slows down to let you catch up. A whole afternoon of that is a different kind of tired than a whole afternoon spent stuck on one stubborn bug, and after twenty-seven years of the old rhythm, this one still catches me off guard some days.

## "Prompt engineer" is the wrong name for it

The skill that matters here was never prompt wording. It's knowing what correct looks like before you see the diff: why a query needs an index, why a migration is unsafe under concurrent writes, why a "working" abstraction will hurt in six months. That judgment doesn't come from prompting practice. It comes from having built things, broken things, and paid for the mistakes.

The people getting the most out of agentic tools right now aren't the ones with the cleverest prompts. They're the ones who can look at generated code and immediately spot the one line that's subtly wrong, because they've written that exact bug themselves at some point. Prompting is the interface. Engineering judgment is still the job.

## Where this goes in five years

Three things seem likely to me, in no particular order of confidence.

**Review becomes the skill we train for, not the one we tolerate.** Right now most of us learned to review code as a secondary skill, something you did after learning to write it. If specifying and judging becomes the primary loop, reviewing well, fast and without rubber-stamping, has to become something we deliberately get better at, the way we once deliberately got better at algorithms.

**We start designing around reviewer fatigue, not just reviewer speed.** Right now most tooling optimises for how fast an agent can produce a diff. The actual constraint is how long a human can sustain high-attention review before quality drops. I'd expect smaller, more frequent checkpoints, better summaries of what changed and why before you dive into the diff itself, and more deliberate pacing, because burning out the reviewer is now the real bottleneck, not the code generation.

**The gap between good and bad engineers widens, not narrows.** Agentic tools are a multiplier, and multipliers amplify what's already there. An engineer with strong judgment reviews faster and catches more. An engineer without it approves more bugs, faster than before. The floor for "can produce working code" drops. The ceiling for "can be trusted to ship it" doesn't move, or gets more valuable precisely because it's rarer.

## The part I'm less sure about

What worries me isn't the loop itself: it's whether the judgment that makes the loop work survives if fewer people spend years building it the hard way. Review is only as good as the model you're reviewing against, and that model used to be built by writing thousands of lines yourself, badly, and fixing them. If the next generation of engineers reviews before it ever really writes, I don't know yet whether that produces the same instincts faster, or a generation of reviewers who can't tell a plausible diff from a correct one.

So no, I don't think we're becoming prompt engineers. I think we're becoming editors-in-chief of our own code, and editing well is its own craft, one most of us are still learning on the job. Where that leaves the next five years is the part I'm genuinely curious about, not the part I have a tidy answer for.
