---
title: "Will Open Source Survive the Agents That Replaced It?"
date: "2026-09-21T10:00:00.000Z"
template: "post"
draft: false
slug: "will-open-source-survive-the-agents-that-replaced-it"
category: "AI"
tags:
  - "Open Source"
  - "AI"
  - "Software Maintenance"
description: "Agents can build in minutes what used to mean installing someone else's package. A debate about whether open source still has a reason to exist once packages are this easy to reinvent."
socialImage: "/images/posts/will-open-source-survive-the-agents-that-replaced-it/cover.jpg"
coverAlt: "A vintage typewriter with paper loaded, next to a modern MacBook, shot from above on a wooden desk"
---

> "Agents change the cost balance between generating and reviewing code. Code generation via AI agents can be automated and becomes cheap so that code input volume increases, but review is still a manual human activity, burdened on the shoulders of few core developers."
>
> Tim Hoffmann, matplotlib maintainer, on [GitHub](https://github.com/matplotlib/matplotlib/pull/31132#issuecomment-3882469629), February 11, 2026

Say you need a small utility for a side project. A few years ago that meant a search, a README, a quick scan of the issues tab to see if anyone had complained about the thing you were about to depend on. Now you just ask an agent, and thirty seconds later you have code that does the job. You never install anything, read a README, or find out who wrote the pattern you're now running in production.

Open source is the ecosystem where strangers write things in public so other strangers don't have to. Whether it still has a reason to exist once the fastest path to working code doesn't run through anyone's repository is the question worth asking.

## The case for the funeral

The bleak version deserves to be taken seriously. Maintaining an open-source package has never paid well. Most of it is unpaid, thankless, and increasingly a target for entitled bug reports from people who never once considered sponsoring the thing they depend on. The one currency maintainers actually got in return was visibility: downloads, stars, a line on a CV, the occasional "this saved me hours" comment that made the whole thing feel worth it.

Take away the downloads and you take away the only reward that was ever reliably there. If an agent can reconstruct the useful 80% of your package from a two-sentence prompt, most people never learn your project exists, let alone star it. Fewer stars mean less motivation to keep going, and less motivation means slower fixes, staler docs, and eventually a repository nobody's watching when it actually breaks. People just stop showing up, one at a time, until nobody's left.

I maintain a small Laravel package called [Truss](https://github.com/albertoarena/laravel-truss), a live ER diagram (ERD) of an app's real database schema, structure only, never data. As of September 21, 2026, it had a little over 24,000 installs on Packagist and 281 stars on GitHub, roughly 85 installs for every person who bothered to star it. That gap didn't come from agents. It was already there before I'd ever pointed one at the code, which says something uncomfortable about how thin the reward was to begin with.

## The case against

Except the agent didn't invent your package out of nothing. It learned the pattern by reading millions of real ones: your README, your test suite, the issue where someone explained exactly why the naive approach breaks, the pull request where a maintainer patiently rejected a bad idea and explained why. Every instant answer an agent gives you is a compressed rerun of work that a person did once, in public, and then gave away.

That's the part the "open source is dying" argument tends to skip. If nobody keeps writing that material in the open, agents don't get smarter, they get stale. They start confidently reproducing yesterday's bugs and last year's best practices, because nobody's left updating the ground truth they were built on. Killing the incentive to publish poisons the well that every agent drinks from. It hurts more than just the maintainers who stop getting thanked for it.

## What actually happens to the boring part

There's also a more immediate irony worth sitting with. A lot of the excitement around "just have the agent build it" comes from teams trying to escape dependency on someone else's project, its roadmap, its maintainer's mood. But the tools doing the building are themselves products, made by companies, with their own roadmaps and their own mortality. Roo Code, a tool plenty of people had built real workflows around, shut down and had its repository archived in May 2026. The team that thought it had escaped depending on a stranger's project ended up depending on a different stranger's project, with the same mortality and none of the years behind it.

Agent-built code also tends to skip the part that made a mature open-source package worth trusting in the first place: years of someone else hitting the edge cases for you, no changelog, no history of "we tried that and reverted it because," no second engineer who ever argued with the author about whether the abstraction was worth it. It runs, until it hits the exact case nobody thought to ask the agent about, and then you're the one debugging it without the years of hard-won experience that would tell you why it broke.

## The part that doesn't show up in a download count

Maybe what's actually happening here isn't death or survival, it's a change of job: the reference an agent's answer is measured against, whether anyone ever downloads it or not. Somebody still has to write the canonical version of a pattern, correctly, in public, for the agent to have learned it from in the first place, and for anyone auditing its output to have something honest to compare it against. That role doesn't come with a star count, or even visible credit, but it's arguably more load-bearing now than it was when people actually clicked "clone."

I don't think that's a comfortable answer, and I'm not sure it's the right one either. It just feels closer to what's actually happening than either "open source is over" or "nothing's really changing."

The question I don't have a tidy answer to is this: **if nobody ever installs your package again because the agent already learned the pattern from it, were you still the one who wrote it?**
