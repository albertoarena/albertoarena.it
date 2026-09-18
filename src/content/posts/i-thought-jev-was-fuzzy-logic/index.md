---
title: "I thought Jev was fuzzy logic. I was wrong."
date: "2026-09-19T10:00:00.000Z"
template: "post"
draft: false
slug: "i-thought-jev-was-fuzzy-logic"
category: "AI"
tags:
  - "AI"
  - "Laravel"
  - "PHP"
  - "Developer Tools"
description: "Jev looks like fuzzy logic at first glance. It isn't. It's a calibrated model, now callable from Laravel's AI SDK, and here's how to use one."
socialImage: "/images/posts/i-thought-jev-was-fuzzy-logic/cover.jpg"
coverAlt: "Close-up of a fingerprint smudge on a laptop's brushed-metal palm rest, below the Alt Gr and Strg keys"
---

When I first read about Jev, on [Freek's blog](https://freek.dev/3194-detecting-spam-and-auto-replies-with-jev-and-the-laravel-ai-sdk) and on X, I thought: fuzzy logic. I built an app with fuzzy logic more than ten years ago, for a client whose sites kept getting hacked. It fingerprinted each page, checked it regularly, and when the live page drifted from that fingerprint, analysed the new content and assigned a probability that it was malicious. Above a threshold, it fired an alert: email, SMS, and a dashboard that started blinking red for that site.

Jev isn't fuzzy logic. It's a different idea, and worth ten minutes before you wire it into a Laravel app.

## What is Jev

Fuzzy logic lets you reason in degrees instead of true or false. You write the rules and the weights by hand: "if traffic is unusual and content changed overnight, hacked is likely." Every number in that rule is your own guess, dressed up as logic.

Jev is a trained model. You send it a state and a typed question, and it returns a probability. No rules to write, no weights to tune.

The word that matters is calibrated. Of everything Jev calls 80% likely, about 80 in 100 should actually be true, over enough cases. That's a promise worth checking against your own data before you trust a threshold to it. Fuzzy logic never promised that. A rule scoring something "0.8 hacked" is a guess in fuzzy clothing, not a measured probability.

## Why Jev

A calibrated number is one you can act on. You pick the cutoff based on what a wrong answer costs you: 0.9 for something expensive to get wrong, 0.5 for something a human reviews anyway. That decision is yours, not the model's.

TypeSafe AI released Jev on 15 September. Two days later, [Laravel's AI SDK added support for it](https://github.com/laravel/ai/pull/1010), merged into the `1.x` branch as a `Classification` API.

## Example

Say you're triaging support tickets: is this one urgent, and which team should get it?

```php
use Laravel\Ai\Classification;
use Laravel\Ai\Classification\Boolean;
use Laravel\Ai\Classification\Choice;

$result = Classification::of($ticket->body)
    ->question('urgent', new Boolean('Does this need an immediate response?'))
    ->question('team', new Choice('Which team should handle it?', [
        'billing' => 'Payments and refunds',
        'technical' => 'Bugs and outages',
    ]))
    ->classify();

$result['urgent']->isTrue(threshold: 0.8); // true
$result['team']->choice;                   // 'technical'
```

`isTrue()` takes a threshold argument, not a fixed 0.5. That's where the decision above actually lands in code.

Testing doesn't need a live call. Fake the gateway and assert on what you asked:

```php
Classification::fake();

Classification::of($ticket->body)
    ->question('urgent', new Boolean('Does this need an immediate response?'))
    ->classify();

Classification::assertClassified(fn ($prompt) => $prompt->asks('urgent'));
```

## What's next

Jev itself is still early: no tagged Laravel AI release yet, and the model is behind a waitlist. The `Classification` API works today against the fake gateway, so the integration can be built and tested before a key ever arrives.

## Read more

- [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), TypeSafe AI's own announcement: latency, pricing, and how the published benchmark numbers were produced
- [Detecting spam and auto-replies with Jev and the Laravel AI SDK](https://freek.dev/3194-detecting-spam-and-auto-replies-with-jev-and-the-laravel-ai-sdk), Freek Van der Herten wiring Jev into a real Laravel app
- [Jev: The Language Model That Won't Talk](https://anthonymaio.substack.com/p/jev-the-language-model-that-wont), Anthony Maio's closer look at the benchmark, including where Jev falls behind
