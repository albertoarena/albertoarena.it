---
title: "I thought I knew what a savepoint was"
date: "2026-09-09T12:00:00.000Z"
template: "post"
draft: false
slug: "i-thought-i-knew-what-a-savepoint-was"
category: "PHP"
tags:
  - "PHP"
  - "Laravel"
  - "Database"
  - "Developer Tools"
description: "Building Cogway's interactive explainers for nested transactions and eager loading forced an exactness that years of using them never did."
socialImage: "/images/posts/i-thought-i-knew-what-a-savepoint-was/cover.jpg"
coverAlt: "A turntable needle resting on a spinning amber vinyl record, motion blur on the grooves"
---

Everyone talks about event sourcing. I went looking for a clear, simple explanation of how it actually works, something with a diagram, and I couldn't find one. Every article I read stopped at the same wall: an aggregate raises an event, a projector reads it, and the diagram behind that sentence was either missing entirely or a static box-and-arrow drawing that never told you what state existed before the event or what existed after it. Each one assumed you already had the idea and just wanted the Laravel syntax for it. I didn't want to read past tense about the mechanism. I wanted to press play on it.

So I built the thing I was looking for. Not a tutorial: a page you drive. A diagram with controls, a timeline you can scrub back and forth, a "break it" preset that shows you the failure mode on purpose, like a naive loop left to rack up fifty-one queries before you switch eager loading on. No account needed, and nothing running on a server behind it. That grew into [Cogway](https://cogway.dev/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=i-thought-i-knew-what-a-savepoint-was&utm_content=intro), twelve of these now, eight Laravel and four core PHP, each one a mechanism you click through instead of read about.

Take the event sourcing page, the one that started all this. Turn on a second projector after events already exist and it starts empty, four events behind, because nothing notices that a newly registered projector is behind. Replay it one at a time and a balance builds in front of you from facts that were sitting on the stream long before that projector existed. Replay from the start and the panel resets it for you first, back to before any of it happened, then rebuilds to the exact same number, because folding the same facts twice can only ever land in the same place. Real code does not get that reset for free: you have to ask for it explicitly, or a replay just folds every event on top of what is already there. That is the diagram I went looking for and never found: not a drawing of the idea, the idea itself, moving.

I expected the hard part to be the writing, or the design: picking the right words, getting the layout to look like something worth clicking on. It was neither. The hard part was building the machines themselves, and the reason why turned into the actual point of the whole project: prose lets you be vague, and a state machine does not.

## What a reducer will not let you get away with

You can write "the job goes back on the queue with a delay" and sound like you know exactly what you're talking about. You don't have to say how long the delay is, how many times it retries, or what happens on the last attempt. The sentence reads fine either way, and most explanations of a mechanism are built out of sentences exactly like it. A reducer will not let you do that. It has to produce one specific next state for one specific input, every time, or it does not run at all, and there is nowhere in a state machine to hide the part you have not thought through yet.

[Nested transactions](https://cogway.dev/explainers/transaction-rollback/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=i-thought-i-knew-what-a-savepoint-was) were one of the two mechanisms I understood least well going in, and building that page is where the gap showed up hardest. The easy sentence is "rolling back an inner transaction rolls back to the savepoint," and it sounds complete because every clause in it is true. Building the reducer meant I had to decide what a savepoint actually is, and my first answer was the same one that sentence quietly assumes: a nesting level, so committing an inner transaction should release whatever was written at that depth. It doesn't. A savepoint is a position in the write log, not a level. An inner commit releases nothing from that log at all, so re-entering a transaction at the same depth sets a second `SAVEPOINT trans2`, further along than the first one ever was. Modelled as a level, my reducer was discarding writes that a real database keeps. You can watch the corrected version on the live page by clicking begin, begin, write, commit, begin, write, rollback, in that order, and see exactly which write survives.

[Eager loading](https://cogway.dev/explainers/n-plus-one/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=i-thought-i-knew-what-a-savepoint-was) was the other one, and the number it produces makes the same point in one line: a naive loop fires a query per row, the counter climbs to 51, and switching on eager loading collapses it to 2. I had used eager loading correctly for years without ever having to state, precisely, why the count moves the way it does. The simulator asks for the precise version.

Even carefully built, that precision is not free. Shortly before launch I checked nine of the twelve pages against real sources for the first time, and six needed a correction. None of those corrections came from reading a page again, every one came from running the code or opening the framework's own source. `npm run verify:php` exists now, so the check is a command I run rather than a memory I trust, not something automatic watching over every change.

## Go try to break one

I built these for other developers who want to understand something better than the article they were reading did, the same person I was when I gave up on finding one and opened an editor instead. If you have used eager loading for years without stating why the count moves the way it does, or rolled back a transaction without knowing what a savepoint actually is, [go and try to break one](https://cogway.dev/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=i-thought-i-knew-what-a-savepoint-was&utm_content=cta). It is a lot harder to stay vague once you are the one holding the controls.
