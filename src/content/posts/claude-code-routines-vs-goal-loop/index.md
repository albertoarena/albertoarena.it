---
title: "Claude Code Routines: A Third Way Beyond /goal and /loop"
description: "Anthropic added routines to Claude Code: cloud-hosted automations triggered by a schedule, an API call, or a GitHub event. How they differ from /goal and /loop, and when to reach for each."
date: "2026-07-19T10:00:00.000Z"
template: "post"
draft: false
slug: "claude-code-routines-vs-goal-loop"
category: "AI"
tags:
  - "AI"
  - "Claude"
  - "Developer Tools"
  - "Claude Code"
socialImage: "/images/posts/claude-code-routines-vs-goal-loop/cover.jpg"
---

![Claude Code Routines: A Third Way Beyond /goal and /loop](/images/posts/claude-code-routines-vs-goal-loop/cover.jpg)

A few months ago, Claude Code shipped [`/goal`](/posts/goal-command-claude-code/), a way to stop typing "keep going" every turn and let Claude work until a condition was actually met. That solved a real problem: staying in the loop with an open session so you didn't have to babysit it turn by turn. It didn't solve a different problem, the one where you want Claude to do something and you're not even at your laptop.

That gap just closed. Anthropic added routines: saved configurations that run on Anthropic's own cloud infrastructure, triggered by a schedule, an API call, or a GitHub event, with no open session and no machine required. It's currently in research preview, so behavior and limits may still shift, but the shape of the feature is clear enough to be worth understanding now.

## What a routine actually is

A routine bundles three things: a prompt, one or more GitHub repositories, and a set of connectors (Slack, Linear, and other MCP integrations). Package it once, attach a trigger, and it runs on its own from then on, cloning the repository fresh each time and executing as a full, unattended Claude Code session.

There's no permission-mode picker and no approval prompts during a run. Whatever the environment and connectors allow, Claude can do without asking. That's the point (nobody's there to answer the prompt) but it also means the blast radius of a routine is defined entirely by what you scope it to, not by anything you can intervene on mid-run.

## Creating one

The fastest way in is `/schedule` (alias `/routines`), run inside any CLI session:

```
/schedule daily PR review at 9am
```

```
/schedule in 2 weeks, open a cleanup PR that removes the feature flag
```

Claude asks follow-up questions about the repository, the prompt, and the cadence, then saves the routine to your claude.ai account. `/schedule` only sets up schedule triggers though: API and GitHub triggers need the web form at claude.ai/code/routines, where you can also review or edit anything the CLI created. `/schedule list`, `/schedule update`, and `/schedule run` manage existing routines from the terminal.

## Three ways to trigger one

**Scheduled.** A recurring cadence (hourly, nightly, weekly) or a single run at a specific future time. The minimum interval is one hour, so this isn't a replacement for tight polling, it's for the kind of check that genuinely only needs to happen once a day or once a week.

**API.** Each routine gets its own endpoint and bearer token. POST to it and a new session starts, optionally carrying a `text` field with run-specific context, an alert body, a failing log line, whatever the caller wants to hand off. That text arrives wrapped in a block that labels it as untrusted data, so a routine's prompt has to explicitly opt in to acting on it. It's a deliberate guard: anyone holding a leaked token can send text, but they can't use it to redirect the routine into doing something the saved prompt never asked for.

**GitHub events.** Pull request and release events, with filters on author, title, branch, labels, draft state, and merge state. A routine can watch for `pull_request.opened` on a specific base branch and run your team's own review checklist before a human ever looks at the diff.

A single routine can combine more than one trigger. A PR-review routine might run nightly as a backstop, fire from a deploy script, and also react to every new pull request.

## Routines vs /goal vs /loop

The three now cover genuinely different problems, not three flavors of the same one:

- **`/loop`** re-runs a prompt on an interval, inside a session you have open, on your own machine. No completion check, just repetition. Good for polling a build or babysitting a PR while you're around.
- **`/goal`** keeps a session working, on your machine, until a separate evaluator model confirms a condition holds. Good for a bounded task you kicked off and want finished properly before you look again.
- **Routines** run on Anthropic's infrastructure, with no session and no machine required, triggered by time, an API call, or a GitHub event. Good for anything that should happen whether or not you're at your desk.

The practical filter: if the automation needs to survive you closing your laptop, it has to be a routine. Neither `/loop` nor `/goal` does, both stop the moment the session ends.

## Where routines shine

**Backlog maintenance.** A schedule trigger set to `0 22 * * *` (nightly at 10pm) reads issues opened since the last run, applies labels, assigns owners by code area, and posts a summary to a `#triage` Slack channel before the team's day starts.

**Alert triage.** A monitoring tool posts to the routine's API endpoint when an error threshold trips. The routine investigates the payload, correlates it with recent commits, and opens a draft PR with a proposed fix, so on-call reviews a diff instead of starting from a blank terminal.

**Bespoke code review.** A GitHub trigger fires on every `pull_request.opened`, applies your team's own checklist, and leaves inline comments for the mechanical stuff so human reviewers can focus on design.

**Cross-repo porting.** A GitHub trigger on merged PRs in one SDK repository ports the same change to a parallel SDK in another language, keeping two libraries in step without someone re-implementing each change by hand.

## Where it gets tricky

**Everything a routine does carries your identity.** Commits and pull requests use your GitHub account. Slack messages and Linear tickets use your linked accounts. There's no separate "bot" identity to fall back on, so a routine with too many connectors attached can do a surprising amount in your name.

**No approval gate means the environment is the only safety net.** Network access, environment variables, and which connectors are included are configured once, up front, and apply to every run after that. Scope them to exactly what the routine needs, not to whatever happens to already be connected to your account.

**Green doesn't mean the task succeeded.** A green status means the session started and exited without an infrastructure error, nothing more. Whether Claude actually did what the prompt asked is a separate question you still have to check by reading the run.

**Branch pushes are restricted by default.** Claude can only push to `claude/`-prefixed branches unless you explicitly allow unrestricted pushes for a repository. It's a sensible default, but worth knowing before a routine's first PR shows up on an unexpected branch name.

**This is a research preview.** The API surface ships under a dated beta header, and Anthropic has already said behavior, limits, and field shapes may change. Don't build anything load-bearing on top of it just yet.

**Runs share your regular usage quota, plus a separate daily cap.** Routine runs draw down the same subscription usage as an interactive session, on top of an account-wide daily limit on how many routine runs can start. Set up several nightly routines and it's easy to assume each gets its own budget. It doesn't, so check your remaining runs at claude.ai/code/routines before you find out the hard way.

## Practical advice

Start with a schedule trigger before reaching for API or GitHub triggers. It's the easiest to reason about and the easiest to pause if something looks wrong.

Strip the connector list down to what the routine actually touches. Every connector you leave attached is something Claude can use without asking, on every run, indefinitely.

Treat routine output the same way you'd treat a CI pipeline: review the diff, don't trust the status light. A run that "completed successfully" and a run that "did the right thing" are not the same claim.

If a routine acts on external input (an alert body, a webhook payload), write the prompt to reference that payload explicitly. Otherwise it just sits there as inert context and the routine won't act on it at all, which is the safe failure mode, but worth knowing in advance rather than discovering it during an incident.

## Closing thought

`/goal` solved the problem of staying in a session without re-prompting it. Routines solve the problem of not needing a session at all. Pick the one that matches the problem you actually have, and for the first time, none of them requires bending one tool to do a different job.

## Sources

- [Automate work with routines](https://code.claude.com/docs/en/routines): official Anthropic documentation for routines, covering creation, triggers, connectors, and limits.
- [Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks): official documentation for `/loop` and session-scoped scheduled tasks, including the comparison against routines and Desktop scheduled tasks.
- [Keep Claude working toward a goal](https://code.claude.com/docs/en/goal): official documentation for the `/goal` command.
- [Claude Code /goal vs /loop: Stop Typing, Keep Going](/posts/goal-command-claude-code/): the earlier post this one builds on.
