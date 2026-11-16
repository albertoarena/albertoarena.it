---
title: "Who Are Your Tests Logged In As?"
date: "2026-11-17T08:30:00.000Z"
template: "post"
draft: true
slug: "who-are-your-tests-logged-in-as"
category: "AI"
tags:
  - "AI"
  - "Security"
  - "Testing"
  - "Developer Tools"
description: "Researchers found AI-built apps handing private data to visitors who never logged in. Tests that only ask as the owner would not catch that. Here is the test that would."
---

Imagine you build an app for your small business. You sign up, add a customer, upload a contract, and open the dashboard. Everything works. The contract is there, the customer is there, and the page loads fast.

You never asked one question: what does a stranger see?

## What the researchers found

On 2 November 2026, the German daily Handelsblatt [reported](https://www.handelsblatt.com/technik/ki/lovable-experten-finden-datenluecke-bei-beliebter-ki-coding-plattform/100264923.html) on research by the security firm Crissy Field. The researchers looked at apps built with Lovable, a platform that turns a plain-language description into a web app. Their own [research page](https://www.crissyfield.de/research/lovable-en/) has the details.

They analysed 159,041 projects, taken from the open web archive Common Crawl, between December 2025 and September 2026. Of these, 34,545 used the Supabase database service. Then 24,664 websites sent database records to the browser as soon as the page loaded, with no login.

That number alone is not a problem, and the researchers say so. Some of that data is meant to be public, such as a menu or a list of events.

The researchers then made more read-only requests. On 7,403 of the sites, they found tables that held email addresses. They say clearly that this is not a confirmed leak rate, because an email address can also be a public contact address or test data.

Some cases were serious. One forum exposed more than 200,000 chat messages. Several event organizers and restaurants exposed ticket and food sales records that included payment information. One service provider exposed more than 1,000 records with passport numbers.

They took only parts of the data. They do not publish how to reach it. They also say they could not tell whether anyone misused it.

The report itself says that [access control mistakes happen in any app, whether people or AI wrote it](https://www.crissyfield.de/research/lovable-en/). I am not writing this to blame a tool, or the people who used it.

## Why the owner saw nothing wrong

I have a guess about why this happens. It is only my guess, not the researchers'.

Picture the owner of one of those apps. They log in, see their own data, and see it correctly. The app works, as far as they can tell.

A missing access rule never shows up this way, because the owner is exactly the person the rule lets in. You only find the gap when you ask as someone else. A visitor with no account. A second user, asking for the first user's data.

My guess is that many owners believed the AI had taken care of this part. It is an easy thing to believe when everything on the screen works.

## Developers do the same thing

This is not only a problem for people who do not write code. Developers say it too: "my tests pass." Or, newer: "my agent checks everything."

Think about what usually happens in an AI session. The agent writes the feature. Then it writes the tests for the feature it just wrote. Those tests log in as a normal user, create a normal record, and read it back. They pass.

They pass because the agent checks from the same seat as the owner. It knows the happy path, because it just built it. It has no reason to play the stranger.

Passing tests tell you the app does what you thought of. They cannot tell you about the cases you did not think of.

## How I work

I believe in TDD, and I know it is not fashionable. I often read that it is old-school. I think the opposite is true: in the age of AI agents, it matters more.

Here is how it works in practice. I do not write every test by hand. The agent writes the tests, and it always writes them first. TDD is a rule in my `CLAUDE.md` file, the instructions the agent reads at the start of every session.

Then I review the tests before any code exists. This is the step that matters most to me.

At that point, the agent has built nothing yet, and the tests are only a list of promises. I can read them and ask: who is asking in each one? If every test is a logged-in owner, I stop and add the others.

The first test can be the stranger. A guest asks for the data and must be refused. A second user asks for the first user's record and must be refused. Once those tests exist, the rule is written down. The code has to meet it, and the agent cannot skip it.

This is also why I trust what an agent wrote, for example in a controller. I do not trust it because the agent is careful. I trust it because a test I reviewed says what the code must do.

## One example

Here is what the stranger's test looks like. I am using Laravel and Pest because that is what I use, but the idea works with any stack. Replace the routes with yours.

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

The first test asks as nobody. The second asks as Bob, for something that belongs to Alice. Both are short. Both are the questions the owner in our story never asked.

If your app talks to the database straight from the browser, the same two questions still apply. Ask them through the same door a stranger would use.

## Before the next feature

- Write the stranger's test before the feature: a guest asking, and a second user asking for the first user's data.
- Test as a guest and as another user, not only as yourself.
- Read the tests before any code exists, and ask who is asking in each one.
- Keep TDD in the rules file your agent reads, and check now and then that the tests still appear first.
- Never let the agent that wrote the code be the only check on it.
- Before real customer data goes in, have someone with security experience review the access rules. The researchers say the same.
