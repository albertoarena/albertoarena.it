---
title: "What I learned at LaravelDay 2026"
date: "2026-11-19T16:45:00.000Z"
template: "post"
draft: false
slug: "what-i-learned-at-laravelday-2026"
category: "Laravel"
tags:
  - "Laravel"
  - "PHP"
  - "Community"
description: "I spent a day at LaravelDay 2026 in Verona. Here is what I learned from the talks, why I think going to conferences is worth it, and why PHP is still alive."
socialImage: "/images/posts/what-i-learned-at-laravelday-2026/cover.jpg"
coverAlt: "An empty conference stage with LaravelDay and GrUSP banners and a wooden lectern, next to a screen showing a lunch break slide and rows of empty chairs"
---

## Arriving in Verona

I work 100% remote. Most days, the people I talk to about Laravel are names on a screen. I love working remotely, and I've been doing it since April 2015, but sometimes I miss real interaction.

So I decided to go to LaravelDay 2026 in person. It was held on Wednesday 18/11 in Verona. [GrUSP](https://www.linkedin.com/company/grusp/) organised it, and all the talks were in Italian.

It was a long journey from Sicily, and I had to change my flight for external reasons and take one early on the morning of the conference, but I was happy to be there.

## What I learned

### Write it, find it, check it

[Roberto Gallea](https://www.linkedin.com/in/robertogallea/) gave a nice talk about making a Laravel app readable for AI. He made a good comparison, saying that many Laravel applications are "telepathic": basically, a human developer needs to know how they are written, and if onboarding is challenging for a new colleague, it is even harder for an AI agent.

One suggestion of his:

| Rule | Explanation |
| --- | --- |
| **Write it.** | The rules are written down, not guessed. |
| **Find it.** | The rules are easy to find. |
| **Check it.** | The code can be checked against them. |

I want to review some of my older projects and see if they are readable for AI.

### A year of hexagonal architecture

[Daniele Barbaro](https://www.linkedin.com/in/barbarodaniele/) described a year with **hexagonal architecture**, and he was honest about what did not work. The good part of the work is now an [open-source package](https://github.com/plin-code/laravel-clean-architecture). He shared everything from the talk on [one page](https://laravelday.plincode.tech/): slides, example repo, the prompt he gave the agent, and his article [A year of hexagonal architecture in Laravel](https://medium.com/@daniele.barbaro/a-year-of-hexagonal-architecture-in-laravel-what-worked-what-didnt-and-what-i-shipped-542257415d8a).

Hexagonal architecture keeps the business logic in the middle and connects the framework, the database and other outside services to it through interfaces.

I had already walked part of this road through DDD, for example in my package [albertoarena/laravel-event-sourcing-generator](https://github.com/albertoarena/laravel-event-sourcing-generator). But my way was different from what Daniele suggested, because in my domain-driven approach I keep everything about a domain in the same folder: actions, events, models, projectors, reactors and so on.

He suggested a different folder structure, with three layers:

```
app/
├── Domain/
│     └── ...
├── Application/
│     └── ...
└── Infrastructure/
      └── ...
```

I want to try his package [plin-code/laravel-clean-architecture](https://github.com/plin-code/laravel-clean-architecture) in a project of mine:

```bash
composer require plin-code/laravel-clean-architecture
php artisan clean-arch:install --migrate-app   # moves existing code: use a fresh or test project
composer dump-autoload
```

### Open source from one developer's need

[Andrea Pollastri](https://www.linkedin.com/in/andrea-pollastri/) began [Cipi](https://github.com/cipi-sh/cipi) in 2018 as a tool for his own deploys. Today it is open source, with over 1,100 stars on GitHub.

His talk encouraged me. I told him so the same evening, over a beer. I have been working a lot on [Laravel Truss](https://github.com/albertoarena/laravel-truss), an ER diagram (ERD) tool for Laravel, and sometimes I wondered if the effort was worth it. Andrea's talk was an inspiration for any open-source contributor: do not be ashamed to publish, accept good criticism and comments, ignore haters, and go ahead.

I love this line of his:

> A public vulnerability is nothing to be ashamed of. **It's the process working.**

By chance, during the conference week Truss passed 80,000 installs, so that was a nice personal reward for my perseverance.

His talk is one more reason to keep investing in open source.

### The rest of the day

- [Filippo Donadoni](https://www.linkedin.com/in/filippo-donadoni-a9089447/) showed that a `DB_URL` in `.env` can make tests run on staging. What I liked is the process he used to find a subtle bug, which he reported as an issue and which was later fixed in Laravel.
- [Alberto Peripolli](https://www.linkedin.com/in/albertoperipolli/) presented Laravel Database MCP 1.0, which lets an AI read a database in read-only mode, without raw SQL. I [shared it on X](https://x.com/alberto_arena/status/2123019962558173329) and LinkedIn, and it got good interest.
- [Giacomo Fabbian](https://www.linkedin.com/in/giacomo-fabbian/) moved from one branch per client to one codebase, with a flag per tenant on each new feature. His talk highlighted how hard it can be to maintain an application used by several clients. Food for thought.
- [Leonardo Rossi](https://www.linkedin.com/in/leorossi82/) went through Pulse, Nightwatch and OpenTelemetry for observability. Wow, there's a lot I can improve with telemetry!

## Why being there matters

I was already in touch with many people online, but a network is built when you spend some time chatting.

I met in person people I knew only online: Roberto Gallea, Alberto Peripolli, Giulio Pecorella, Erik and Jenno. I also talked with most of the speakers.

Giulio Pecorella told me he reads my articles, and he wrote a kind LinkedIn comment about them. That was a welcome recognition for my little contribution to the Laravel community.

## "PHP is dead", said a room full of PHP developers

[Giulio Pecorella](https://www.linkedin.com/in/giulio-pecorella-7b6b6060/) gave a very funny lightning talk with the proof that PHP is dead. He gave it to a room of PHP developers.

I believe that PHP is vibrant and alive, and I curate [phplives.dev](https://phplives.dev/) where I share real things people shipped with PHP in the last 6 months.

The closing panel asked a question that stayed with me: with AI around, should you contribute to a project, copy it, or write your own? One [line from it](https://x.com/alberto_arena/status/2123087685057196536): "Opening a PR takes seconds, reviewing it doesn't."

## What to do with this

- Check `phpunit.xml` in your apps. If `.env` sets `DB_URL`, tests can run against that database. New Laravel apps have had `<env name="DB_URL" value=""/>` since 26/02/2026, older ones do not. See [laravel/framework #58985](https://github.com/laravel/framework/issues/58985).
- Look at [Cipi](https://github.com/cipi-sh/cipi) if you want to own your deploys.
- Look at [Laravel Database MCP](https://github.com/datomatic/laravel-database-mcp).
- Try [Laravel Clean Architecture](https://github.com/plin-code/laravel-clean-architecture) on a test project. Daniele asks for feedback, especially about what did not work.
- Go to a conference near you. LaravelDay is one, and PHP conferences exist in many countries.

Thank you to GrUSP and to all the speakers. It was nice to meet everyone, and I look forward to being at LaravelDay again next year!
