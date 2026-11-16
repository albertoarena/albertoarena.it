---
title: "Passing tests do not make an AI-built app safe"
date: "2026-11-16T13:00:00.000Z"
template: "post"
draft: false
slug: "passing-tests-do-not-make-an-ai-built-app-safe"
category: "AI"
tags:
  - "AI"
  - "Security"
  - "Testing"
  - "Developer Tools"
description: "Researchers found AI-built apps handing private data to visitors who never logged in. Tests that only ask as the owner would not catch that. Here is the test that would."
socialImage: "/images/posts/passing-tests-do-not-make-an-ai-built-app-safe/cover.jpg"
coverAlt: "A black and white photo of a long, dim hotel corridor, with doors along the right side and framed pictures on the left wall"
series:
  slug: "how-to-use-ai"
  order: 10
---

Picture a woman who runs a small chiropractic clinic. One evening she describes the booking app she wants to an AI tool, and an hour later it exists. She signs up, adds an appointment slot, books herself in, and sees her own name on the schedule. It all works. The next day she shares the link with her patients and asks them to try it.

She never asks what a stranger would see on that link, because she has never been the stranger. She made the app, so every page she opens shows her own patients and her own appointments. The app looks finished from the only seat she has ever sat in.

This story is made up, but a recent report on apps built with an AI platform made me think it is not rare. That report is the reason for this post. Researchers found apps that gave private data to people who never logged in. Who was asking when those apps were tested?

## What the researchers found

The report comes from the German security firm Crissy Field, and Handelsblatt [covered it on 2 November](https://www.handelsblatt.com/technik/ki/lovable-experten-finden-datenluecke-bei-beliebter-ki-coding-plattform/100264923.html). The researchers studied apps built with Lovable, a platform that turns a plain-language description into a web app. They looked at roughly 160,000 projects from a public web archive. Many used a database service called Supabase. More than 24,000 sites sent database records to the browser as soon as the page loaded, with no login. The researchers say that alone is not a problem, because some data is meant to be public, such as a menu or a list of events.

Then they made more read-only requests. On about three in ten of those sites they found tables with email addresses. They say this is not a confirmed leak rate, because an email address can also be a public contact or test data. Some cases were clearly serious: a forum with more than 200,000 chat messages open, event and restaurant records that included payment information, and one service provider with more than 1,000 passport records. They took only parts of the data and do not publish how to reach it. They could not tell whether anyone misused it.

I am not writing this to blame a tool or the people who used it. The report itself says that [access control mistakes happen in any app, whether people or AI wrote it](https://www.crissyfield.de/research/lovable-en/). Its advice is that an easy platform does not remove the need for an expert to review who can read what.

## Why the owner saw nothing wrong

Think of a hotel key card. It opens the front door, and it should open only your room. Now imagine a hotel where nobody ever set which rooms each card opens. Guests would not notice, because each guest only tries their own door. The staff would not notice either. Everything works until someone tries a neighbour's door.

An app has the same kind of rule. It says who may read which data: a customer sees their own orders, not everyone's. When that rule is missing, nothing breaks for the owner, because the owner is exactly the person the rule would let in. They log in, see their data, and see it correctly. Nothing on the screen says that a rule is missing.

I think many owners trusted the AI with more than it could take on. That is easy to do when the app looks complete and does everything you asked for. You ask for a booking app and you get a booking app. A rule about who may read what is easy to leave out of the request, because from the owner's seat it is invisible.

## Developers do the same thing

Developers say it too: "my tests pass." Or, newer: "my agent checks everything." In an AI session the agent usually writes the feature, then writes the tests for the feature it just wrote. Those tests log in as a normal user, create a normal record, and read it back, and they pass. They pass because the agent checks from the same seat as the owner. It knows the happy path because it just built it. It has no reason to play the stranger, so that case often goes untested.

A green test run only proves the cases someone thought of. If every test in the suite is written from the owner's seat, the suite can stay green on an app that leaks, just as the owner's screen looked fine.

## How I work

I believe in TDD, and I know it is not fashionable. I often read that it is old-school. I think TDD matters more now. AI can fix a bug in seconds, but [only a test keeps it fixed](https://x.com/alberto_arena/status/2109166619368825317). I do not write every test by hand: [the agent writes them, always first](https://x.com/alberto_arena/status/2103140455911440423). TDD is a rule in my `CLAUDE.md` file, the instructions the agent reads at the start of every session, so the agent cannot skip it.

Then I review the tests before any code exists. At that point the agent has built nothing, and the tests are only a list of promises, so they are cheap to read. I read them and ask who is asking in each one. If every test is a logged-in owner, I stop and add the others. The first test can be the stranger. A guest asks for the data and must be refused. A second user asks for the first user's record and must be refused. Once those tests exist, the rule is written down and the code has to meet it. This is how I trust what an agent wrote, for example in a controller: a test I reviewed says what the code must do.

The rule is not always followed. In one long conversation, [the agent "forgot" the TDD approach](https://x.com/alberto_arena/status/2107490439800443098). The fixes I know are repeating the rules and shortening the conversation. I wrote about long conversations in [The Sound of Silence](/posts/the-sound-of-silence/).

## One example

The tests that ask as a stranger are short. I write mine in Laravel with Pest, but the idea works with any stack, so replace the routes with yours.

```php
test('a guest cannot read invoices', function () {
    $this->getJson('/api/invoices')->assertUnauthorized();
});

test('a user cannot read another user\'s invoice', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();
    $invoice = Invoice::factory()->for($alice)->create();

    $this->actingAs($bob)
        ->getJson("/api/invoices/{$invoice->id}")
        ->assertForbidden();
});
```

The first test asks as nobody. The second asks as Bob, for something that belongs to Alice. If your app talks to the database straight from the browser, the same two questions still apply. Ask them through the same door a stranger would use.

## Before the next feature

- Write the stranger's tests before the feature: a guest asking, and a second user asking for the first user's data.
- Test as a guest and as another user, not only as yourself.
- Read the tests before any code exists, and ask who is asking in each one.
- Keep TDD in the rules file your agent reads, and check now and then that the tests still appear first.
- Never let the agent that wrote the code be the only check on it.
- Before real customer data goes in, have someone with security experience review the access rules. The researchers say the same.

If you have an app online today, you can start without writing any code. Log out, or open a private browser window, and try to load a page or an address that should show private data. Then log in as a second account and ask for the first account's data. If either one works, you have found your first test. Write the test first. Then fix the problem, and the test stops it coming back.
