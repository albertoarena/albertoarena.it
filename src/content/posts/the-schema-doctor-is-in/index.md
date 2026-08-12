---
title: "The schema doctor is in"
date: "2026-07-31T10:00:00.000Z"
template: "post"
draft: false
slug: "the-schema-doctor-is-in"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Laravel Truss 1.5 adds truss:doctor: a deterministic, structure-only review of your database schema, thirteen rules deep, that can fail your CI build."
socialImage: "/images/posts/the-schema-doctor-is-in/cover.jpg"
coverAlt: "A stethoscope resting on a notebook next to a laptop keyboard, in black and white"
series:
  slug: "truss"
  order: 2
discussion: "albertoarena/laravel-truss"
---

A migration that adds a `user_id` column with no supporting index passes review every time. It looks fine. Laravel doesn't complain, the migration runs clean, CI is green. Then a few months later someone's staring at a JOIN that touches two hundred rows and takes eight seconds, and nobody remembers why.

That's the class of problem [Truss](https://github.com/albertoarena/laravel-truss) 1.5 is built to catch before it ships: the schema doctor.

I wrote about [Truss](/posts/introducing-truss/) here in July, a live, zoomable ER diagram of your Laravel app's actual database schema. It's picked up more traction than I expected since then: it's closing in on 300 installs on Packagist and past 70 stars on GitHub, almost entirely word of mouth in the Laravel community. That traction is exactly what pushed the next feature: a diagram is great for seeing your schema, but it doesn't tell you when something in it is wrong. `truss:doctor` does.

## What it catches

Run it and it flags problems that are visible from structure alone:

- Tables with no primary key
- Foreign keys with no supporting index
- Duplicate or redundant indexes
- Foreign keys whose type doesn't match the key they reference
- Money-looking columns stored as `float`
- Pivots without a unique key, unindexed `deleted_at`, and more

Thirteen rules in total, across integrity, index, and type categories, each with a stable code (like `TRUSS-IDX-001`) so you can look it up, silence it, or change its severity.

Rules are engine-aware where it matters: an unindexed foreign key is an **error** on PostgreSQL and SQLite, but only **info** on MySQL and MariaDB, since those auto-index foreign keys.

## In the terminal and CI

```bash
php artisan truss:doctor
php artisan truss:doctor --preset=strict --fail-on=warning
php artisan truss:doctor --format=json
```

It exits non-zero once a finding hits your fail level, so a migration that introduces a problem fails the build. No AI, no queries, no row data: deterministic and structure-only, safe to run in a commit hook or a CI pipeline against a database you don't fully trust.

## In the dashboard

The same findings surface in the dashboard as a new Health panel, the heart icon in the toolbar. Tables with a problem are flagged right on the diagram, the offending column is marked inline, and lower-confidence (heuristic) findings are labelled as such. Same engine, same findings, two front ends depending on whether you're at a terminal or in the browser.

## Try it

The [live demo](https://trussphp.com/demo/) has it running against a fictional schema. Open the Health panel and you'll see a handful of foreign keys flagged for a missing index.

- Live demo: [trussphp.com/demo](https://trussphp.com/demo/)
- Guide, with every rule code: [trussphp.com/guides/schema-doctor](https://trussphp.com/guides/schema-doctor/)
- Release notes: [v1.5.0 on GitHub](https://github.com/albertoarena/laravel-truss/releases/tag/v1.5.0)

Update with `composer update albertoarena/laravel-truss`, then run `php artisan truss:doctor` and see what's already in there.

## What's next

This is phase one: the engine and the thirteen rules. Suppression files, more rules, and CI formatters are on the [roadmap](https://trussphp.com/roadmap/). If a rule feels too noisy, too quiet, or there's a check you'd want that isn't there yet, the [discussion thread](https://github.com/albertoarena/laravel-truss/discussions/18) is open. I'd love to hear what you run it against.
