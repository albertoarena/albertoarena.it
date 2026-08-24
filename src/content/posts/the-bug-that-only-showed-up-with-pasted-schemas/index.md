---
title: "The bug that only showed up once strangers could paste a schema"
date: "2026-08-24T10:00:00.000Z"
template: "post"
draft: false
slug: "the-bug-that-only-showed-up-with-pasted-schemas"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "A schema viewer that always read a live database connection was quietly relying on that connection being trustworthy. Here's what broke, silently, the moment the input became a pasted file from a stranger, and the three checks that catch it."
socialImage: "/images/posts/the-bug-that-only-showed-up-with-pasted-schemas/cover.jpg"
coverAlt: "A windowpane shattered by a single impact, cracks radiating outward against a blue sky and trees"
series:
  slug: "truss"
  order: 5
discussion: "albertoarena/laravel-truss"
---

People kept asking the same question about the schema viewer I maintain: "what does this look like on *my* schema?" The demo only ever offered a sample database to look at, so the honest answer was "install the package and point it at yours." That's a fair amount of friction for someone who just wants to see whether the tool is worth their time.

So I added a page that parses a pasted `mysqldump` in the browser and draws it with the same dashboard the package ships. No install, no upload, nothing leaves the tab. That part was the easy sell. The part worth writing about is everything the code had been getting away with, because until that page existed, every schema it had ever drawn came from a database connection the person running it had configured themselves.

A connection string is a small trust decision that's easy to forget you made. You typed it, or an environment variable did, and either way something you controlled put it there. A pasted file has no such history. It could be a colleague's export, a tutorial's sample data, or nine hundred lines of MySQL DDL from someone you've never met. Same parser, same renderer, same code path, wildly different set of things it's now allowed to assume.

## Assumption one: names are just strings

The dashboard builds a diagram definition by writing table and column names straight into it. That's fine when a name came from `information_schema`, because a database enforces its own identifier rules before a name can exist. It stops being fine the moment a name can come from anywhere: nothing stops a pasted file from naming a column something that isn't a database identifier at all, it's a fragment of markup for whatever's rendering the diagram.

Read from a live connection, that string had already been validated by something else before it ever reached this code. Read from a paste, the validation had never happened, and the rendering code had no way to know the difference because it never checked. The fix wasn't clever: every identifier gets reduced to what the diagram format actually accepts before it's written anywhere, consistently, on every reference to that name. But it's worth sitting with what made the bug possible in the first place: correct code, wrong assumption. The string-writing was never wrong. What was wrong was believing every string that reached it had already been through a gate it hadn't actually been through.

## Assumption two: an unhandled case can stay quiet

A schema dump is not one grammar, it's whatever the tool that produced it decided to write, and that varies more than you'd expect: backtick-quoted identifiers or not, a `CREATE INDEX` as its own statement or folded into the table definition, foreign keys added later with `ALTER TABLE` instead of declared inline. A parser that only handles the common shapes will hit a line it doesn't recognize eventually, and the question is what happens next.

The tempting answer is: skip it and move on, the diagram still mostly works. That's the wrong answer for a page whose whole job is showing someone their actual structure. A single dropped constraint doesn't make the diagram look broken. It makes it look *complete and wrong*, which is worse, because nothing about the output tells the reader to doubt it. So every statement now gets one of three outcomes, and all three are visible: parsed and drawn, deliberately skipped and counted, or flagged with the line number that produced it. A summary line reports the second and third categories up front, not buried in a details panel nobody opens. If ten tables came from a real database and the diagram shows nine, silence is the bug. Saying so is the fix.

## Assumption three: an unnamed relationship isn't a real one

Truss has an inference mode elsewhere that guesses relationships from naming conventions, `user_id` probably points at `users` even without a declared foreign key. That's a genuinely useful feature when you opted into it and can eyeball the result against a schema you know. It's a bad default for a page whose output is the first and only thing a stranger sees. A guessed edge that's wrong doesn't read as a guess. It reads as the tool telling you something false about your own database, with no indication it was ever uncertain.

So the paste-parser draws only what's explicitly declared, a `FOREIGN KEY` constraint or nothing. A column named exactly like a foreign key convention, with no constraint behind it, produces no edge at all. That's a narrower feature than the inference mode elsewhere in the same package, on purpose: precision matters more than completeness when the reader has no way to independently check your work.

## The bug that hid behind a passing test

One more, because it's not about untrusted input at all and I'd have missed it without a different kind of check. Reviewing the page before it shipped, every click led back to the project's GitHub repo, no matter what part of the page you clicked. The cause was a missing closing `</a>` tag, several lines up, that had nested the entire rest of the shell inside a single link.

The existing tests for that page matched strings with regular expressions. A regex has no concept of "this tag is still open ten lines later." It saw the opening `<a>`, saw a plausible chunk of markup after it, and passed, the same way it would have passed if that tag had been closed correctly three lines down instead of never. What caught the bug in the end was a structural check, one that actually parses the HTML and confirms every tag that opens also closes, and the self-test that check needed was the same broken markup fed back into it on purpose.

The lesson generalizes past HTML: a test that pattern-matches text is checking that certain substrings exist, not that the thing you shipped has the shape you think it has. Those aren't the same guarantee, and the gap between them is exactly where a test suite stays green while a page silently breaks.

## Structure only stays true, on purpose

None of this changed what the tool promises: structure only, never data. Any `INSERT` statement in a pasted dump gets counted and discarded, not read, and that count is reported so the promise is something you can watch rather than something you have to take on faith. The parsing itself runs entirely in page code, the result reaches the dashboard through an in-memory blob URL, and the only thing written to `sessionStorage` is used to survive a page reload and gets deleted the moment it's read. Nothing is uploaded, because there's nowhere on a server for it to go.

That promise was never the hard part. The hard part was noticing how many other things the code had quietly been trusting, once "your own database connection" stopped being the only way data could arrive.

---

[Truss](https://github.com/albertoarena/laravel-truss) is the Laravel schema viewer I maintain. You can try it on your own schema, no install required, at [trussphp.com/demo/your-schema](https://trussphp.com/demo/your-schema/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=the-bug-that-only-showed-up-with-pasted-schemas). Structure only, never data.
