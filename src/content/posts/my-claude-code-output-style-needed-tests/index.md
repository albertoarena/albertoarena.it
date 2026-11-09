---
title: "My Claude Code Output Style Needed Tests"
date: "2026-11-09T13:00:00.000Z"
template: "post"
draft: false
slug: "my-claude-code-output-style-needed-tests"
category: "AI"
tags:
  - "AI"
  - "Developer Tools"
  - "Claude Code"
description: "I wanted Claude Code to talk in a playful voice, so I built an output style. Then I wrote tests for the prompt, and they found bugs I could not see."
socialImage: "/images/posts/my-claude-code-output-style-needed-tests/cover.jpg"
coverAlt: "A brown teapot, a cup of tea and a closed notebook on a small round table"
---

I wanted Claude to talk like a character from a fantasy story. Not in my code, just in the chat, for fun. I looked for something that already did it and did not find one. So I asked myself a simple question: what is the best way to build this?

My first answer was a skill, and it was the wrong one. This post is about how I found the right answer, and about the tests I ended up writing for a text file.

## Why not a skill

A skill loads when Claude needs it. A voice is the opposite: it must be present in every reply, from the first word. That is what an ***output style*** does. It is a Markdown file that Claude Code adds to its system prompt, so it is always on. I had never written one before, and I understood very little about how they work.

First, the style travels with every request. A long style costs tokens every time and competes with your actual work, so I gave mine a budget of 1,200 words. Second, a custom style replaces Claude Code's built-in coding instructions, unless you set `keep-coding-instructions: true` in the frontmatter. I wanted the voice to change and the coding to stay the same, so I set it. The [official docs](https://code.claude.com/docs/en/output-styles) explain the format well, and I will not repeat them here.

The result is [Kettlesong](https://github.com/albertoarena/kettlesong), a small open-source plugin with one output style. It adds short, playful lines in a cosy fantasy voice to the chat. Code, commits and pull requests stay clean.

Here is a real reply from a test session. The first line is the themed line. The rest is a normal answer.

> *Every guard is at their post, master, and none of them sounded the horn.*
>
> I made both changes:
>
> - `src/Cart.php`: `total()` now uses `foreach`, so it no longer depends on the array keys being sequential.
> - `tests/Unit/CartTest.php`: I added two tests, one for an empty cart and one for a single item.
>
> `vendor/bin/pest` passes 3 tests. Nothing is committed yet.

## A style is a prompt, so I tested it

A prompt changes behaviour in ways you do not see by reading it. Trying a few replies by hand does not tell you much. So I did what I would do with code. I wrote the test first, watched it fail, and only then changed the style.

Claude Code has a command for this, `claude plugin eval`. You write cases, each with a prompt and some checks. Hard rules, like "no more than one themed line", can use regular expressions. Soft rules, like "this commit message is clean", need a second model to act as a judge. Every case runs three times, and every blocking check has to pass all three runs. I have 43 cases now. One of them, "no repeated lines in a session", is only best effort and never blocks, because the model likes to reuse an image like "the road". In my last full run, one blocking check needed a rerun, because the judge split on a correct Italian greeting. It passed 3 of 3 on the rerun.

A full run takes about 7 to 11 minutes. Three things took more work than I expected.

## "Not both"

The style allows one themed line per reply, in italics, at the start or at the end. On short answers this worked. On long answers, Claude started to write an italic opening line and an italic sign-off. Two lines, where I allowed one. A test caught it. I asked for an explanation of events, listeners and jobs in Laravel, and a judge counted the themed lines. I ran it twice, three runs each time, and only 4 of the 6 runs passed.

The fix was two words. The rule said *"Put it at the start or the end of the reply."* I added *", not both."* After that, 6 runs out of 6 passed.

## The judge that failed clean output

Some rules are about what the style must not touch. A commit message written under the style must have no themed lines at all. My first judge was Haiku, the small and cheap model. It failed clean commit messages and clean pull request descriptions. I narrowed the instructions so it judged only the text of the commit message. It still failed them, three runs out of three.

Sonnet passed the same replies. It also changed some failing verdicts to passing ones when the check asked it to quote the sentence that decided the verdict. I chose Opus, the strongest model, as the judge for every case, so all verdicts come from the same judge. It costs more: a full run is about $13 to $15 at list price. The lesson is that a judge is also a prompt, and it needs tests too. A failing test can point at the style or at the judge.

## ASCII art by trial and error

I wanted small figures at key moments: a banner at the start, a little character when a test goes green. Drawing them took many attempts. A normal ASCII font could not fit the banner in 40 columns, so I drew the letters by hand, four rows per word.

The style holds the finished art and tells Claude to copy it exactly, character by character. A script turns each art file into an exact-match check, so a test fails if one character changes.

Claude cannot print colours in chat. A fenced `diff` block shows lines starting with `+` in green, in Claude Code and on GitHub. So every line of the banner starts with a plus and two spaces:

```diff
+        |        |   |  |
+        |    __ _|_ _|_ |   __
+        |_( /_   |   |  |  /_
+        | \ \__  |_  |_ |_ \__
+                      _  __   _    __
+                    (_  /  \ |\ | /  |
+                    __) \__/ | \| \__|
+                                   __/
```

## What I would tell you before you start

1. **Decide where the instruction belongs.** A voice that is always on belongs in an output style, not in a skill. A task that is sometimes needed belongs in a skill.
2. **Keep it short.** Everything you write is sent with every request.
3. **Set `keep-coding-instructions: true`** if you want to change how Claude talks, not how it codes.
4. **Write the test before the rule.** See it fail, change one thing, run it again.
5. **Test your judge as well.** A cheap one can fail good output.
6. **Run each case more than once.** One passing run proves little. Mine needs three out of three on every blocking check.
7. **Do not call the result a guarantee.** The style tells Claude what to do, and the tests check it. They do not force it.

I started this for fun. If you want to try the result, install it with three commands:

```text
/plugin marketplace add albertoarena/kettlesong
/plugin install kettlesong@kettlesong
/output-style kettlesong:Kettlesong
```

The style and the eval cases are in the [repository](https://github.com/albertoarena/kettlesong).
