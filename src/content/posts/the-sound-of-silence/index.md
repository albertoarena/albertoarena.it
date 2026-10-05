---
title: "The Sound of Silence: What Your AI Agent Does Not Tell You"
date: "2026-10-05T06:00:00.000Z"
template: "post"
draft: false
slug: "the-sound-of-silence"
category: "AI"
tags:
  - "AI"
  - "Developer Tools"
  - "Claude Code"
description: "Long AI conversations fail quietly. The agent drops part of what you asked and never says so. Here is why, and why a new chat is the fix."
socialImage: "/images/posts/the-sound-of-silence/cover.jpg"
coverAlt: "A dirt path fading into fog through a dense pine forest"
series:
  slug: "how-to-use-ai"
  order: 8
---

I built a small internal tool for myself: a dashboard that tracks my projects and pulls together analytics from my blog and social posts. I run it through Claude, and the rules for how it should behave live in several markdown files (markdown is just structured plain text, the same thing a README is written in). I keep each file small and organised, so it stays easy to maintain.

Most days it works exactly the way I expect. But in a longer session, when I send several prompts one after another about different things, something starts to slip. The agent skips part of what I asked. Sometimes it flatly contradicts a rule I gave it in plain markdown, something as simple as "always report this number, never that one." Other times it answers a question from a few prompts ago instead of the one I just sent.

It never tells you. There's no warning, no "I skipped this part," no "I'm not sure which one you meant." The answer arrives looking complete.

For a while I blamed myself: maybe my prompts were badly worded, maybe I was asking for too much at once. Then I noticed a pattern. If I clear the conversation and start fresh once it has used up around half its available memory, the mistakes mostly stop. Same rules, same project, same me, just a fresh start. The answers get sharper again.

That was enough to make me go looking for whether this is a known, measured thing, or something I was imagining.

## It's not just me

It's measured. Researchers at Microsoft and Salesforce ran large-scale tests comparing how AI models answer a request in one clear message versus the same request spread out over a simulated back-and-forth conversation. Conversations lost 39% in performance on average, and got far less reliable. Their explanation was simple: the models tended to guess early what the person wanted, instead of asking. Then they kept building on that guess instead of reconsidering it, even once it was clearly wrong. [You can read the paper here](https://arxiv.org/abs/2505.06120).

That study is already a year and a half old, and AI models move fast, so I didn't want to take it on faith. I went looking for anything more recent, and the pattern held.

[A study published in March 2026](https://arxiv.org/abs/2603.11281) tested five current models on real patient follow-up questions pulled from an online medical forum. GPT-5 was the strongest model tested, and the strongest models fell the furthest by the second follow-up question. GPT-5 gave a fully correct answer only 41% of the time. Across all five models, wrong answers roughly tripled by the third turn.

[A second benchmark](https://arxiv.org/abs/2607.29196), published this summer, tested over twenty of today's strongest model setups on long conversations in Chinese. Even the best one, GPT-5.5, fully satisfied every requirement only 41% of the time.

Both numbers measure the same strict thing. They don't ask whether the answer was roughly right. They ask whether the model did everything it was asked. By that measure, six times in ten the answer read as finished even though something in it was wrong or missing. Two of the second benchmark's six categories are about the missing kind: does the model still remember a constraint it was given, and does it still hold back an action it was told not to take. That's the sound of silence, measured.

## Three different things, wearing one disguise

"The AI got confused" is usually hiding three separate problems, and they're worth telling apart.

The first is ***simple length***. A longer conversation holds more to keep straight, and accuracy slips even when every part of it is still relevant.

The second is ***noise***: mixing several unrelated topics into one conversation seems to hurt more than just making it longer. That same Chinese-language benchmark builds this in on purpose: it throws unrelated topics into a conversation to make models perform worse, which matches exactly what I was doing without realizing it.

The third is ***commitment***: once a model settles on a reading of what you want, it tends to defend that guess rather than revisit it, even when a later message of yours should have corrected it. This is what explains the agent contradicting a rule it was explicitly given. It isn't forgetting the rule exists. It decided early on what you probably meant, and it's sticking with that decision instead of rereading what you actually asked this time.

My own long sessions were probably getting hit by all three at once: a long conversation, covering several different topics, where an early wrong guess kept being built on for the rest of the chat.

## Why starting over actually works

There's an older, well-known finding behind part of this, shown clearly in [a 2023 study](https://arxiv.org/abs/2307.03172): AI models are better at using information placed near the start or the end of what they're given. Information buried in the middle gets used worse. It's a bit like a long meeting: you remember how it opened and how it wrapped up far better than the part forty minutes in, even if that was the part that mattered.

Anthropic found the same thing back in 2023, testing long documents rather than conversations: instructions placed at the end of a prompt are the ones the model recalls best. [Their guidance](https://www.anthropic.com/news/prompting-long-context) was tested on a 100,000-token context window with documents up to 95,000 tokens, on an older generation of models. That page didn't test whether this holds exactly the same way in today's conversational models. But nothing in the newer research above contradicts it. A rule I wrote once, many prompts ago, ends up sitting in the part of the conversation a model handles worst.

Clearing the conversation and starting fresh doesn't make the agent smarter. It works because the real finding isn't that the end of a prompt is special. It's that the middle is the bad place to be. Both the beginning and the end are read well. A fresh conversation puts my instructions back near the top, which is handled just as well as the end of a long one, with nothing contradicting them yet.

That also means a rule doesn't have to live only at the start. Restating it in the message you're sending right now puts it in a good spot too. A rule given fifty messages ago usually isn't in a good spot.

## What I'd tell myself a year ago

Long conversations with AI aren't a mistake. The real problem is that the failure is silent: nothing marks the moment a rule gets dropped, so waiting to notice it doesn't work. You have to go looking, asking the agent what it did and didn't do, or restating a rule and actually checking the answer against it instead of skimming past.

A few things make that easier. Write the rules down outside the chat instead of only inside it: mine live in those several, organised markdown files, which is exactly why clearing a conversation costs me nothing. If your rules only exist somewhere in the scrollback, a restart throws them away too, which is probably why it's tempting to keep pushing a dying conversation instead of starting over.

Keep one topic per conversation where you can. Restate a rule in the message you're actually sending, not just once at the start. And don't wait for the conversation to fail before resetting it: once it's used up roughly half its available memory, start fresh anyway. One wrong turn makes the next one 1.9 to 6.1 times more likely to be wrong too, depending on the model, so correcting in place is fighting bad odds. Restarting avoids that problem entirely.

None of that fixes the underlying problem. It just means that when it happens, you're not the last one to find out.
