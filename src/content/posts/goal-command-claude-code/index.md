---
title: "Stop Typing, Keep Going"
description: "Claude Code and Codex now have a /goal command that turns your coding agent into an autonomous loop. Here's when it helps and when it doesn't."
date: "2026-05-22T10:00:00.000Z"
template: "post"
draft: false
slug: "goal-command-claude-code"
category: "AI"
tags:
  - "AI"
  - "Claude"
  - "Developer Tools"
  - "Claude Code"
socialImage: "/images/posts/goal-command-claude-code/cover.jpg"
---

![Stop Typing, Keep Going](/images/posts/goal-command-claude-code/cover.jpg)

If you've spent any real time with Claude Code, you've been through this loop. You give it a meaningful task, something like refactoring a service layer or wiring up a new set of endpoints. It works for one turn, produces solid output, and then hands control back to you. So you type "keep going." It does another round. Stops again. You re-prompt. Another round. Another stop. An hour later you've typed "keep going" more times than you've typed actual code, and the irony of manually babysitting your autonomous coding agent starts to sting.

Anthropic shipped a fix for that, and it's five letters long.

## What /goal does

The `/goal` command sets a completion condition for your session. After each turn, a small and fast evaluator model (Haiku by default) checks whether the condition has been met. If not, Claude starts another turn. If yes, the goal clears and you get a summary with time, turns, and tokens spent.

The syntax is dead simple:

```
/goal all tests in test/payments pass and lint is clean
```

That's it. Setting the goal counts as the first turn. You don't need to send a separate prompt.

The key design decision is separation. There are two models involved: one does the coding, and a different one decides whether the coding is finished. The evaluator reads the conversation transcript and makes a binary call: done or not done. If not done, it also returns a short reason that becomes guidance for the next turn. So if Claude thinks it's finished but three tests are still failing, the evaluator catches the gap and sends Claude back to work.

OpenAI shipped the same concept in Codex CLI around the same time, under the same name. Both implementations trace back to the "Ralph loop" pattern that the agentic coding community had been hand-rolling with bash scripts for months. Now it's built in. No custom scripting, no wrapper, no cron.

## Where it shines

The best use cases share a common trait: the end state is verifiable and Claude can prove it within the conversation.

**Test-driven migrations.** "Migrate all v1 API calls to v2 and make sure every test passes." Claude reads the code, changes call sites one by one, runs the suite after each batch, and keeps going until green. This is the sweet spot. The goal condition maps directly to a command exit code. The evaluator has something concrete to check.

**Issue backlog cleanup.** "Close every open TODO in the /legacy folder." Claude works through them systematically. Each one gets resolved, the evaluator counts what's left, and the loop continues until the queue is empty.

**File restructuring.** "Split this 3,000-line file into focused modules, each under 300 lines, with all imports still resolving." Measurable, bounded, verifiable.

**Design doc implementation.** "Implement the acceptance criteria in SPEC.md and run the integration suite." If your spec is well-written, Claude has a checklist to work through and a way to prove completion.

In all these cases you're basically saying: here's the finish line, don't come back until you've crossed it. And it works surprisingly well when the finish line is clear.

## Where it gets tricky

The evaluator only reads the conversation transcript. It doesn't run commands, browse the filesystem, or verify anything independently. This means the quality of the loop is entirely dependent on how well your condition can be proven through Claude's own output.

**Vague goals fail quietly.** "Improve the authentication system" gives Claude no way to know when to stop. It might keep refactoring forever, or it might stop after one change and declare victory. Both outcomes are plausible and neither is useful.

**Long sessions drift.** Claude manages a finite context window. During extended runs it compresses earlier turns into summaries. If your task spans dozens of turns, nuances from the beginning may be lost by the end. A 14-hour session sounds impressive in a blog post, but in practice the quality of the last hour may not match the first. Anthropic recommends including a turn or time limit directly in the condition ("or stop after 20 turns") to bound the loop.

**Token costs add up fast.** Every turn costs main-model tokens plus a small Haiku evaluation. One developer noted that the token use can scale dramatically compared to a supervised session. If you're on a metered plan, a runaway goal can burn through your budget before you finish your coffee.

**Scope creep is real.** Claude might notice a related bug while working on your goal and decide to fix it. That sounds helpful until it touches a file owned by another team or introduces a change you didn't ask for. Always include constraints in your condition: "do not modify files outside /src/payments" is not optional, it's a safety net.

**It doesn't replace judgment.** `/goal` is for execution, not for design decisions. If the task involves ambiguity ("should this be a queue or a synchronous call?"), Claude will pick an answer and keep going. You might not agree with the answer it picked, and by the time you check, there are fifteen files built on top of that assumption.

## How to write a good condition

Anthropic's docs recommend structuring conditions around three elements: a measurable outcome, an explicit verification step, and boundaries around what should not be touched. That's good advice. In practice it means your condition should read like a checklist, not a wish.

A condition like this works:

```
/goal all tests in test/payments pass, lint exits 0, and no file outside src/payments is modified
```

A condition like this doesn't:

```
/goal make the code better
```

The condition can be up to 4,000 characters, so you have room. Use it to be specific. Include the exact commands that should be run, the directories that are in scope, and the files that are off limits.

## /goal vs /loop vs regular prompting

Claude Code now has three ways to keep a session alive without constant prompting.

**Regular prompting** is your default. You send a message, Claude responds, control returns to you. Best for exploratory work, design conversations, and anything where you want to review each step.

**`/loop`** re-runs a prompt on a time interval. It doesn't check a condition. Useful for monitoring or repeated checks ("run the test suite every 10 minutes and report failures"), less useful for convergent tasks.

**`/goal`** runs until a condition holds. The evaluator is what makes it different: completion is decided by a fresh model, not by the one doing the work. Combined with auto mode (which approves tool calls within a turn), you get fully unattended execution.

The simplest way to choose: if the trigger is time, use `/loop`. If the trigger is a verifiable outcome, use `/goal`. If you want to review each step before the next one happens, just keep prompting normally.

## Practical advice

**Always work on a branch.** Before starting a `/goal` session, commit your current state. If Claude goes sideways, you can `git diff` to see what happened and `git checkout` to undo it. This isn't optional.

**Start small.** Your first `/goal` should not be a full codebase migration. Pick something contained: a single module, a single test file, a clearly bounded task. Watch how Claude executes it. Learn what works before you scale up.

**Include a turn limit.** "or stop after 15 turns" is cheap insurance against runaway loops. You can always set a new goal after reviewing progress.

**Review the diff like any PR.** Autonomous work is still code that ships. Don't treat `/goal` output as automatically correct. Read the changes, run the tests yourself, and apply the same review standards you would for any contributor.

**Pair it with CLAUDE.md.** If your project has conventions, patterns, or off-limits areas that aren't obvious from the code, document them in your CLAUDE.md. Claude reads it at the start of every session and will respect those constraints during a `/goal` loop.

## Closing thought

`/goal` is the most significant workflow change in Claude Code since auto mode. It formalises something developers were already doing with duct-tape scripts and "keep going" prompts, and it does it with an evaluator layer that's genuinely clever.

But it's a power tool, not magic. The better your condition, the better the result. The vaguer your condition, the more creative Claude gets with the interpretation, and "creative" is not always what you want from an autonomous agent editing your production code.

Use it for execution when the thinking is done. Keep the thinking for yourself.

## Sources

- [Keep Claude working toward a goal](https://code.claude.com/docs/en/goal) — Official Anthropic documentation for the `/goal` command.
- [Claude Code /goal: A Field Guide with Games](https://medium.com/@jason.croucher/claude-code-goal-a-field-guide-with-games-f6f3b617ce5b) — Jason Croucher's hands-on walkthrough with practical examples and real session logs.
- [Codex /goal: OpenAI's Built-in Ralph Loop](https://ralphable.com/blog/codex-goal-command-ralph-loop-openai-built-in-autonomous-coding-agent-2026) — Deep dive into the Codex CLI implementation and the Ralph loop history.
- [Claude Code /goal: Set a Finish Line, Walk Away](https://findskill.ai/blog/claude-code-goal-command/) — FindSkill.ai's breakdown of the feature with cost and token considerations.
