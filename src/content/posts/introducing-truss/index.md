---
title: "There's no artisan schema:show, so I built one"
date: "2026-07-23T10:00:00.000Z"
template: "post"
draft: false
slug: "introducing-truss"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "A live, zoomable ER diagram of your Laravel app's actual database schema, safe to run in production because it only ever reads structure, never rows."
socialImage: "/images/posts/introducing-truss/cover.jpg"
---

![A steel truss lattice shot from below against a bright sky, bolted joints forming a grid](/images/posts/introducing-truss/cover.jpg)

You join a project. Forty tables, half of them undocumented, and a `posts` table that somehow relates to three other tables you've never heard of. Where do you start?

`php artisan db` gets you an interactive shell, and from there you're back to whatever dialect your database speaks: `.schema` on SQLite, `DESCRIBE` on MySQL, `\d` on Postgres. Laravel's own `db:show` and `db:table` commands are a step up, an overview of your tables or one table's columns, indexes, and foreign keys, printed straight to the terminal. But they're still one table at a time, in text. Nothing shows you the shape of the thing: which tables actually connect, and how, across the whole schema. So you end up either opening a DB client through an SSH tunnel, or drawing the diagram yourself on a whiteboard from memory, which is exactly as reliable as it sounds.

And that's the easy case, when you have shell access at all. On staging or production, where you actually need this the most because that's where the real schema drifted from the migrations, you often don't have a shell. Some organisations block SSH outright for compliance, which is exactly the situation I [wrote about replacing with AWS Systems Manager](/posts/beyond-the-bastion-aws-ssm-laravel-artisan/) for running Artisan commands. Even with a Run Command session in hand, that gets you a shell again, not a diagram.

So I built [Truss](https://github.com/albertoarena/laravel-truss).

## What it does

Truss is a live database structure viewer for Laravel. It scans your actual schema, not your migration files, and renders it as a scrollable, zoomable ER diagram right inside your app.

- **Live ER diagram**, rendered with Mermaid, of every table and how it connects.
- **Focus mode**: click a table to isolate it and its foreign-key neighbours, centred and highlighted, so you're not staring at forty tables to understand one.
- **Filter by table name**, and toggle native column types against Laravel-style labels.
- **Map-style pan and zoom**, with auto-fit.
- **Structure only, always.** Truss reads tables, columns, keys, and indexes. It never queries a single row, which is the whole point of being able to run it somewhere that matters.
- **Self-contained**: Mermaid and fonts are vendored and served from the package, so it works offline and under a strict CSP. No CDN, nothing phoning home.
- **Cached and automatic**: the snapshot rebuilds after migrations, so the diagram never goes stale.
- **Export the whole diagram** as PNG or SVG, exactly as it's currently filtered and focused, so it drops straight into a design doc or a PR description instead of a screenshot. Per-table exports as JSON or CSV are also available from each table's menu.

Install it, visit `/truss`, and you get the diagram. No config, no separate service to run.

```bash
composer require albertoarena/laravel-truss
```

By default it's only enabled locally. To use it on staging or production you explicitly enable it and gate access behind a `viewTruss` authorization gate, so "safe to run in prod" doesn't mean "wide open in prod".

## From the command line, too

`db:show` and `db:table` get you close, but they're still one table at a time, in text. `php artisan truss:show` prints that same cached, exclusion-filtered snapshot the diagram uses, as a table: one row per database table, with its column count and foreign-key count, the whole schema at once instead of one piece of it.

```bash
php artisan truss:show   # the whole schema as a table, in your terminal
php artisan truss:open   # or jump straight to the diagram
```

`php artisan truss:open` opens the dashboard in your default browser, honouring the route prefix and app URL. It prints the URL regardless, so it still works over a forwarded port on a headless host with no browser for it to open.

Both commands live under a `truss:` namespace rather than `schema:`. A package squatting Laravel's own `schema:` namespace is asking for a collision if the framework ever ships a `schema:show` of its own, which is the joke in this post's title.

## Trying it without installing anything

If you want to poke at it before adding it to a project, there's a [live demo](https://albertoarena.github.io/laravel-truss/demo/) running against a fictional schema, right in your browser. Pan, zoom, filter, focus a table, no install required.

## How it's held up

I've dropped Truss into a few of my own Laravel projects since building it, including ones I hadn't touched in a while, and it's the fastest I've re-oriented myself in a schema I half-remembered. Clicking through foreign keys in focus mode beats reconstructing the relationships from migration file names, every time.

## Get started

The [documentation](https://albertoarena.github.io/laravel-truss) covers installation, the quick start, and authorization for non-local environments in more detail. It requires PHP 8.3+ and Laravel 12+.

Feedback welcome, as always.
