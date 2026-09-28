---
title: "The Effort Was the Filter"
date: "2026-10-03T10:00:00.000Z"
template: "post"
draft: false
slug: "the-effort-was-the-filter"
category: "AI"
tags:
  - "AI"
  - "Developer Tools"
  - "Open Source"
description: "AI didn't make building cheaper. It removed the question of whether building was worth it, and the question is the one part of the job that never got faster."
socialImage: "/images/posts/the-effort-was-the-filter/cover.jpg"
coverAlt: "A hand holding a circular camera lens filter up against a city skyline"
series:
  slug: "how-to-use-ai"
  order: 7
---

Before AI could write most of the code for you, an idea cost something to find out about. You'd sketch it, spend a weekend on the core, another on the edge cases, a third making it survive a second run without leaving something broken behind it. Three weekends in, you had a question you couldn't avoid any longer: does this deserve a fourth?

Most ideas didn't survive that question. Not because they were bad, but because the cost of finding out kept asking it of you, at every stage where walking away was still cheap. The effort was never only a cost. It was doing work you didn't notice it was doing. It was the filter.

## Nothing replaced the asking

AI didn't make that filter cheaper. It removed it. The idea that used to need three weekends before you knew whether it deserved a fourth now gets built before the weekend is over. Deciding whether it deserves to exist is the one part of the old process that never got faster, and it used to ride along for free, bundled into the cost of finding out.

I have a small pile of evidence of this on my own machine. In June I built [deskhand](https://github.com/albertoarena/deskhand), a CLI tool, over three days, came back a week later to finish the docs, and shipped it. It has a CI pipeline, a full test suite, and it works. It also has zero stars, zero forks, and as far as I know, zero users. I don't say that as a complaint. It's what building without asking looks like when the work itself is solid.

deskhand's lack of users isn't the problem I'm describing. The problem is that I never once asked, before or during, whether it should exist. Reception was never the test. I just haven't been running one lately.

## Where the time actually went

Building it didn't cost me three free days. The week didn't get lighter, it moved: into thinking about what to build next, reading through a plan an agent had produced before I let it touch anything, working out what a generated explanation actually meant before I trusted it enough to write into a README in my own words. None of that is writing code, and none of it shows up in a diff. The work didn't shrink, it moved to the part nobody counts, which is why a week spent building can still feel like it used every hour in it.

## What a download count can't see

The temptation is to call it the test, "did anyone use it," and that's wrong: a quiet package someone thought hard about is fine, download count or not. A package built because building stopped costing anything is different, and a download count can't tell the two apart, because it's counting the wrong moment. The failure isn't how few people installed it. It's that nobody, including me, asked the question when asking still mattered.

I ship packages, and I post about them most days. I also run a system that tells me exactly how far each one reaches. None of that caused this on its own. Wanting to be seen isn't new, but it's what supplies the demand once the cost of meeting it drops to nothing. Take away the cost and keep the reason, and this is what you get: reasonably good work, shipped, because shipping is what you do, with the only question that used to matter left unasked.

## The number worth keeping

METR ran a [randomised trial in early 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/): sixteen experienced open-source developers, 246 tasks on their own mature codebases. With AI assistance, they were 19% slower. Beforehand, they'd predicted they would be 24% faster. Afterwards, they believed they had been 20% faster. Wrong in both directions, by roughly the same margin, about their own work, while it was happening and after it was over.

The 19% isn't what to remember from this. It's one trial, on one group of developers, at one moment in AI tooling, and I wouldn't bet on it still holding today. The gap is what's worth keeping: those developers couldn't accurately judge their own speed, in either direction, in the moment or in hindsight. That's the same blindness I'm describing here, just measured instead of felt. The judgment you'd need to know whether forty minutes of typing was worth it is the same judgment you'd need to know whether an idea was worth three weekends, and it was never reliable running on its own. It needed the cost to be real, so it had something to push against.

## What I actually think

We need real personal time back, time that isn't building, and I don't mean that as a line about wellness.

Free time isn't the reward for finishing something. It's where the asking happens. You can't decide whether an idea deserves to be built while you're in the middle of building it, any more than those sixteen developers could judge their own speed mid-task. A weekend spent shipping is a weekend with no room left to decide anything.

The tool I mentioned works. I'm glad it exists. I would still like to have asked, before I built it, whether it should, and the honest answer for why I didn't is that nothing made me.
