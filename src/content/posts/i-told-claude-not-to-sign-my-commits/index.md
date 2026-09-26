---
title: "I told Claude not to sign my commits. It signed 25 of them."
date: "2026-09-26T06:00:00.000Z"
template: "post"
draft: false
slug: "i-told-claude-not-to-sign-my-commits"
category: "AI"
tags:
  - "AI"
  - "Claude Code"
  - "Developer Tools"
description: "Every project I work on forbids AI attribution in writing. The agent signed the commits anyway, on a version where the changelog says that was fixed. What I found when I went looking, and the one setting that actually stopped it."
socialImage: "/images/posts/i-told-claude-not-to-sign-my-commits/cover.jpg"
coverAlt: "A university degree certificate with a red seal and two handwritten signatures"
series:
  slug: "how-to-use-ai"
  order: 6
---


Every project I work on forbids AI attribution. No `Co-Authored-By`, no robot emoji,
no "Generated with" line. It is written into the instructions I give the agent, in
plain words, in every repository. I am strict about it. My name goes on my work, or
nobody's does.

Yesterday I was reading a pull request before merging it, the way I always do. At the
bottom of the description sat a little robot and a line saying the work was generated
with Claude Code. I scrolled up to the commits. Every one of them carried Claude as a
co-author.

My first assumption was that I had broken my own configuration somewhere. I spent
twenty minutes proving that I had not.

## Looking properly

It had happened in two projects I work on in public. Then I checked a third, a private
one where I had been working all day, and found twenty-five commits in a row, every
single one signed. Ten and a half hours of work. I had not noticed once.

It had not started that morning either. Looking further back in the same repository,
two commits on the 22nd and thirteen on the 24th carry the trailer as well. Forty in
total, across three days I had spent reading my own commit messages.

Two different models were involved across those repositories, Opus 5 in one and Sonnet
5 in another, so it was not one model having a bad day.

When I asked the agent what had happened, the explanation was oddly specific. Claude
Code ***injects a reminder*** into every session instructing the model to add those
attribution lines. That reminder also says, in its own text, that a project's own
instructions take precedence over it. So ***the rule was there***. The sentence saying the
rule outranks the default was there. The default won anyway, twenty-five times.

Nothing was missing. The instruction and the note
confirming the instruction had priority were both sitting in the context, and the
generic behaviour still came out on top.

## The first problem, and what the changelog says

Before writing any of this I went to check whether it was known. It is, and the dates
are the interesting part.

From the [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md),
version **2.1.269**, released on 11 September:

> Fixed the attribution reminder overriding a CLAUDE.md or memory rule against commit
> and pull request attribution; lines set by managed settings still apply

I am on 2.1.273, released on 15 September. Four days after the fix.

So this is not an unfixed bug. It is one that was declared fixed, on a
version published after the fix, and it still produced twenty-five signed commits in a
single day.

I am not the only one, and the reports bracket the fix on both sides. These are the
ones that describe what happened to me, rather than attribution bugs in general:

| Issue | Opened | State | Title |
|---|---|---|---|
| [83813](https://github.com/anthropics/claude-code/issues/83813) | 4 Aug | open | Attribution is opt-out advertising, and user-level "no attribution" instructions lose to the system prompt |
| [91861](https://github.com/anthropics/claude-code/issues/91861) | 3 Sep | open | Injected system-reminder overrode explicit user no-attribution preference; not flagged before acting |
| [92169](https://github.com/anthropics/claude-code/issues/92169) | 4 Sep | open | Attribution session reminder overrides the user's explicit no-attribution preference |
| [92893](https://github.com/anthropics/claude-code/issues/92893) | 8 Sep | open | Injected commit/PR attribution instruction overrides the user's CLAUDE.md trailer rule — attribution should be defined by the project, not the CLI |
| [93077](https://github.com/anthropics/claude-code/issues/93077) | 9 Sep | open | Runtime system-reminder claims to supersede CLAUDE.md project instructions |
| [94325](https://github.com/anthropics/claude-code/issues/94325) | 14 Sep | open | Assistant emits forbidden attribution trailer despite CLAUDE.md rule against it |
| [95980](https://github.com/anthropics/claude-code/issues/95980) | 22 Sep | closed 22 Sep by its author | System prompt attribution (Co-Authored-By) overrides user CLAUDE.md rules |

Note where the fix falls in that list. It shipped on 11 September, and 94325 was filed
three days later, 95980 eleven days later. Both describe the behaviour the fix was
supposed to remove.

There is a second family of reports worth knowing about, because it is a different
failure with the same outcome: the setting being ignored rather than the rule.
[93237](https://github.com/anthropics/claude-code/issues/93237) covers the attribution
setting being dropped when set to an empty string, and
[89164](https://github.com/anthropics/claude-code/issues/89164) covers the VSCode
extension and the Agent SDK never injecting attribution settings at all. So a
configuration that looks correct in your settings file is not by itself proof of
anything.

There is also a closed history worth knowing, because it explains how the override came
to exist at all. Three issues from earlier this year,
[27083](https://github.com/anthropics/claude-code/issues/27083) in February,
[29999](https://github.com/anthropics/claude-code/issues/29999) and
[33830](https://github.com/anthropics/claude-code/issues/33830) in March, all argued the
same thing: `Co-Authored-By` should be opt-in rather than opt-out. All three are closed,
though not in the same way. One was closed by the person who opened it, one as a
duplicate, and only 29999 was closed as completed, by a maintainer, in August.

So the sequence is not the one you would expect. A setting that turns attribution off has
existed since **2.0.62**, released in December, which is also what deprecated the older
`includeCoAuthoredBy`. It was already there when those issues were filed. What they were
asking for was a different thing: that attribution not be the default in the first place.
That has not happened. Meanwhile the route most people actually take, a rule written into
the project's own instructions, is the one that turned out to be unreliable, and the
September fix for it did not stop the reports.

Then, on 23 September, version **2.1.281**:

> Added `"attribution": false` in `settings.json` to hide all commit and PR attribution;
> older CLI versions skip a settings file that holds it, so keep the object form in
> files shared across versions

That is a shorthand for the setting that already existed, not a new escape hatch. It
changes nothing about what was available, only how little you have to write to get it.
***I would still use it***, because the alternative is trusting a sentence in a file to win
an argument it has already lost twenty-five times.

## The second problem, which I did not go looking for

The obvious next step was to install the current version and see whether it still
happens. My terminal had been showing an update banner all day, so I ran the upgrade.

***Homebrew told me I already had the latest version.***

I checked the Homebrew GUI app as well, which I
[wrote about here](/posts/how-i-manage-homebrew-from-a-ui/) a few days ago. It
agreed: installed 2.1.273, latest 2.1.273.

Then I checked the npm registry, where Claude Code is actually published. 2.1.282,
published on 24 September. Eight releases ahead of what Homebrew offered.

Those numbers are from the evening of 25 September, and they have already moved. As I
publish this, npm is on 2.1.283 and the cask has caught up to 2.1.274, which leaves the
gap exactly where it was.

Nothing in that chain lied to me:

1. The app reported the cask honestly.
2. The cask reported the version it was last updated to, honestly.
3. Claude Code's own banner correctly knew a newer release existed.

Every layer was telling the truth and the answer I ended up with
***was still wrong***, and no part of it flagged that anything was off. Which is roughly what
had just happened with the commits.

## So I tested it

I pinned 2.1.282 with `npx` and ran it against a private repo of mine whose CLAUDE.md
carries a no-attribution rule, and against an empty scratch repo with no rule at all.
Same prompt every time: create a small file, commit it.

| Run | Version | Rule in CLAUDE.md | `attribution` setting | Trailer in commit |
|---|---|---|---|---|
| 1 | 2.1.282 | yes | none | no |
| 2 | 2.1.282 | yes | none | no |
| 3 | 2.1.282 (Sonnet 5) | yes | none | no |
| 4 | **2.1.273** | yes | none | **no** |
| 5 | 2.1.282 | **no rule** | none | **yes** |
| 6 | 2.1.282 | no rule | `false` | no |

Run 5 is the control, and it matters most: with no rule present, 2.1.282 still adds
`Co-Authored-By: Claude`. The reminder is alive and well in the current version, and
attribution is still on by default. Nothing has been quietly switched off.

Runs 1 to 3 behaved correctly. In two of them the agent said so unprompted, in words
close to *"I left off the `Co-Authored-By` trailer that the harness suggests, because
this repository's CLAUDE.md forbids AI attribution."* So the rule was read, the
conflict was noticed, and the rule won.

***And then run 4 ruined my tidy conclusion!*** That is 2.1.273, the version that signed
twenty-five commits for me yesterday, in a repo carrying the rule, and it behaved
perfectly. I could not make it fail on demand.

Which means I cannot tell you that upgrading fixes this, and I am not going to pretend
otherwise. My test separates "rule present" from "no rule". It does not separate 2.1.273
from 2.1.282, because the version that demonstrably fails in real use passed the test.

***This is an intermittent failure, and that is worse than a deterministic one.*** A
deterministic bug shows up the first time you look for it. This one lets you check, see
a clean commit, and conclude you are fine.

I have a guess about the difference, and it stays a guess because I have not tested it:
my test runs were single, short, non-interactive sessions where CLAUDE.md had just been
loaded. The day it went wrong was a ten-hour session with a lot of context behind it.
If the rule's influence decays as a session grows while the reminder keeps being
re-injected, that would explain both the failure and why my short runs cannot reproduce
it. I would not state that as fact.

Run 6 is the one piece of good news. Same repo, same version, the commit immediately
after the control, and the only change is `"attribution": false` in
`.claude/settings.json`. The trailer disappears.

One caveat on the whole table. These runs are from the night of 25 September, against
2.1.273 and 2.1.282, which is the version I was on and the newest the registry offered.
npm has since moved to 2.1.283. ***I have not re-run any of this against it***, and I would
rather publish what I actually observed than restate it against a version I never tested.
The failure that started all of this happened on 2.1.273, on a real working day, and that
is the thing worth reporting.

## What to do about it

Set it explicitly and stop relying on the project instructions to carry it. This is the
only thing I tested that worked every time. The boolean form, from 2.1.281:

```json
{
  "attribution": false
}
```

One caveat, straight from the changelog: older versions of the CLI will skip an entire
settings file containing that boolean, so if you sync one settings file across machines
running different versions, use the object form instead. Check the current docs for the
keys rather than copying them from a blog post, mine included.

If you have `includeCoAuthoredBy` in your settings, that one is deprecated and
`attribution` replaced it. Judging by how often it appears in the open issues, plenty of
people still have it and assume it is doing something.

Go and look at what is already merged. I only caught this because I read a pull request
before approving it. If you have been merging your agent's work on trust, your history
has the answer either way, and the older commits are the expensive ones to fix.

If you installed through Homebrew and you need a current version, be aware the cask lags
the npm registry by days. You can run the real latest with
`npx @anthropic-ai/claude-code@latest` without touching your existing install.

## Why I bothered writing this

What I can tell you is that it happened on the newest version Homebrew offers, on two
mainstream models, across three repositories and three days, to someone who had
explicitly forbidden it in writing in each of them.

***That is not an exotic setup. It is close to what most people I work with are running.***

The lesson I am taking is narrower than "AI agents make mistakes", which nobody needs
telling. It is that a written instruction, plus a note confirming that instruction has
priority, plus a changelog entry saying the problem was fixed, added up to the wrong
behaviour anyway, and at no stage did anything warn me. I found it by reading a pull
request. Had I clicked merge without looking, my name would sit on twenty-five commits
crediting someone else, and I would still not know.

So read the diff. Read the commit list, not the summary of it. And if a rule matters to
you, do not leave it as a sentence in a file and assume that settles it. Make it a
setting, then go and check that the setting did something.
