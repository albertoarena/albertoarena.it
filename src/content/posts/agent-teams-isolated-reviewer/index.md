---
title: "Agent Teams: Why I Don't Let My Reviewer See My Reasoning"
date: "2026-08-18T10:00:00.000Z"
template: "post"
draft: false
slug: "agent-teams-isolated-reviewer"
category: "AI"
tags:
  - "AI"
  - "Claude Code"
  - "Agents"
  - "DevTools"
description: "What actually changes when a second Claude reviews the first Claude's draft, and what happened when I ran that setup on this very post, including the objection it caught that I hadn't thought to raise myself."
---

Most people's first instinct when they hear "agent team" is to picture more of the same agent, in parallel, doing more work per minute. Fair enough, that's real, but it's the boring half of the idea. The half worth stopping for is what you have to *withhold* from a teammate to make the team worth anything at all.

I found this out by accident, doing something almost too mundane to write about: asking one Claude to draft something, and a second Claude to review it.

## Why spawn a second instance at all

Here's the instinct to resist: if I'm already talking to Claude, and Claude can also review its own writing, why spawn a second one? Same model, same weights, same training. Surely it just agrees with itself.

That's true if the second instance can see how the first one got there. It stops being true the moment it can't.

A reviewer that inherits my outline, my reasoning for cutting a paragraph, my "actually this transition is a bit weak but I'll leave it" internal monologue, isn't reviewing my draft. It's rubber-stamping my thought process, because it's holding the same context I used to arrive at it. Agreement under those conditions tells you nothing. The only way to get a real second opinion out of the same underlying model is to make sure it never had the first opinion to begin with.

So the actual team structure looks like this: I write, then hand the artifact, not the reasoning, to a teammate. The teammate's entire world is that one file. Roughly, as pseudocode:

```
Agent({
  name: "reviewer",
  prompt: `You are reviewing a blog post draft for a personal
  tech blog. Read draft.md. Write your critique to review.md.
  Flag every issue with a severity: blocker, should-fix, or nit.
  Do not edit draft.md. Message the author when you're done.`
})
```

No outline. No "here's what I was going for." No hint about which paragraph I was unsure of. If the piece doesn't stand on its own for a reader who wasn't in my head, that's exactly the thing I need to find out, and the only way to find it out is to withhold the very context that would let the reviewer guess it.

## What it actually caught

This post is the accident. I wrote a full draft making exactly this argument, then spawned a reviewer whose only input was the draft file: no outline, no notes on which paragraph I was unsure about, nothing. It came back having caught two things I hadn't put in front of it and hadn't caught myself, rereading my own writing for the tenth time.

One was small: a claim I'd made about token cost (that isolation is more expensive because a fresh context starts cold) turned out to be very likely backwards. A short prompt against one file is plausibly cheaper than continuing a long conversation that drags its full history along on every turn.

The other wasn't small. I'd built this entire argument without engaging the most obvious objection to it: that two instances of the same model aren't actually independent judges, no matter how little context they share.

That objection is real, and it's worth sitting with rather than waving off. Isolating the reviewer removes contamination from my reasoning path: it says nothing about the priors the two instances still carry into the room. Run the same model twice, and it will tend to like the same phrasings, flag the same categories of issue, and miss the same blind spots in the same places, because underneath the isolation it's still one set of weights judging its own output. Structural independence from my reasoning isn't independence as an evaluator, and the first draft of this post argued as if it were.

What survives that objection is smaller than what I started with. It amounts to one judge, plus a second pass that can't borrow the first pass's specific mistakes, because it never saw them in the first place. That's a narrower claim than the one I opened with. It's also the true one.

## Isolation is the mechanism, not a side effect

This is the same lesson as context engineering, just running in the opposite direction. [I've written before](/posts/context-engineering-not-slop/) about how the agent failures I hit most often trace back to bad context: too much of it, the wrong pieces of it, stale pieces of it, pieces that contradict each other. The fix there is to be deliberate about what an agent does see.

A team applies the same discipline to what an agent does *not* see. The reviewer's context is scoped on purpose: that scoping is the whole point of spawning a separate instance instead of continuing the conversation I was already having. If I'd wanted the reviewer to know my reasoning, I didn't need a second agent. I needed a second message in the same thread. The separate agent exists specifically so that door stays shut.

That generalizes beyond writing review. A verification pass on a bug fix loses most of its value if the verifier can see the fixer's confidence: "I'm pretty sure this handles the edge case" starts getting treated as evidence instead of a claim still waiting to be tested. The same happens to a second opinion on an architecture decision that inherits the first agent's assumptions about the constraints. What's actually being protected in both cases is a second party arriving at its conclusion without being able to borrow the first party's path there.

## What it costs you

None of this is free. A teammate with no shared context also has no shared shortcuts. The fresh context itself is rarely the expensive part (a short prompt against one file is often cheaper than dragging a long conversation's full history into another turn); the real cost is duplication, paying again for content the artifact already carries, plus the effort of writing a spawn prompt that has to stand entirely on its own. "Review this like you reviewed the last one" doesn't work here. There is no last one, as far as the teammate is concerned, and there shouldn't be.

That cost is exactly why this isn't the default move for every task. Splitting into a team is worth it when the value of the work comes specifically from two parties not agreeing by default: review, verification, adversarial checks, independent research on the same question approached from different angles. It's wasted overhead when the task just needs more hands doing the same kind of work, where shared context speeds things up instead of contaminating the result.

The pair here is the minimal case. Scale it past two (a panel of reviewers instead of one, several independent agents chasing the same bug from different starting points) and nothing about the principle changes, only the fan-out does: each one still has to reach its conclusion without being able to read another's reasoning to get there.

## The tell

If you can predict what your reviewer is going to say before it says anything, you didn't build a team. You built an echo with extra steps. The only evidence that isolation actually happened is a critique that surprises you, one that catches something you'd have defended if you'd been in the room when the review started.

That's the bar I hold this kind of setup to now. Not "did I get a second pass," but "was that second pass structurally capable of disagreeing with me, and did it?"
