---
title: "My coding agent kept inventing columns"
date: "2026-08-10T10:00:00.000Z"
template: "post"
draft: false
slug: "my-coding-agent-kept-inventing-columns"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
  - "AI"
description: "Laravel Truss 1.8 turns your schema export into grounding context for a coding agent: annotations, focused and compact exports, and an optional read-only MCP server."
socialImage: "/images/posts/my-coding-agent-kept-inventing-columns/cover.jpg"
coverAlt: "A two-way radio handset centred against a moody blue-to-purple gradient backdrop, its reflection faint below"
series:
  slug: "truss"
  order: 4
discussion: "albertoarena/laravel-truss"
---

Ask a coding agent to write a query against a table it hasn't seen this session, and it will guess. Confidently, plausibly, and wrong: a foreign key named `author_id` when the column is actually `created_by`, a `status` treated as a free-text string when it's a `tinyint` enum, a table it's sure exists because a table like it usually does. It isn't lying, it just doesn't know, and nothing forces it to say so.

The usual fix is pasting a schema dump into the chat at the start of a session. That works until the next migration, at which point it's just a different kind of wrong: confidently out of date instead of confidently invented.

There's an obvious third option: let the agent run queries itself, most coding agents can already execute SQL. But that means handing over real database credentials, and a connection that can query can also see rows, not just structure. That's a bigger grant than the problem needs.

[Truss](https://github.com/albertoarena/laravel-truss) has always been a live, zoomable ER diagram of your Laravel app's real database schema, structure only, never a row of data. Version 1.8 points that same live structure at a coding agent instead of a browser tab.

## Give it meaning a type can't carry

A column tells an agent its name and type, not what it means. `status = 1` doesn't say "paid" on its own. Annotate it once and every export carries it:

```php
// config/truss.php
'annotations' => [
    'source' => ['config', 'database'],
    'tables' => [
        'orders' => [
            'note' => 'One row per checkout attempt, not per completed order.',
            'columns' => [
                'status' => 'tinyint: 0 pending, 1 paid, 2 refunded',
            ],
        ],
    ],
],
```

If your database already carries `COMMENT` strings on tables and columns, leave `'database'` in `annotations.source` and Truss reads those directly, no duplicate config to keep in sync. Either way, a comment is part of the `CREATE TABLE` definition, not a row: still structure only. Strip them from any single export with `--no-annotations` when you just want the bare shape.

## Trim it to what the question needs

A forty-table schema is a lot of tokens to spend on a question about one table. `--compact` drops column defaults and non-unique indexes without dropping a single table, column, or foreign key. `--focus=orders --depth=1` narrows the export to one table and its foreign-key neighbourhood, the same idea as the dashboard's focus mode, now available from the command line. And there's a new `llm` format alongside the existing five (DBML, JSON, CSV, Markdown, Mermaid), a dense plaintext export tuned for a token budget rather than for a human reading a data dictionary:

```bash
php artisan truss:export --format=llm --focus=orders --depth=1 --compact
```

That's what the export produces. Calling it is just as direct, in code or over HTTP.

Building the same thing in code goes through a new fluent, immutable `Truss` facade instead of the command:

```php
Truss::snapshot()->focus('orders', depth: 1)->compact()->toDbml();
```

And a gated `GET {prefix}/export/{format}` route serves the identical output to any HTTP client, behind the same `viewTruss` gate as the dashboard. Command, facade, route, dashboard download: one pipeline underneath all four, so they can never quietly disagree with each other.

## Ask it live, instead of pasting a snapshot

The part I actually wanted, though, wasn't a better export. It was not exporting anything at all.

Truss 1.8 adds an optional server for MCP, the Model Context Protocol that Claude Code, Claude Desktop, and Cursor use to reach outside tools. Built on `laravel/mcp`, it talks to a coding agent directly over local stdio:

```bash
composer require laravel/mcp
php artisan mcp:start truss
```

Point one at it and the agent gets five tools, `list_tables`, `describe_table`, `get_schema`, `focus_table`, and `get_structural_review`, plus a `truss://schema` resource, all reading the live schema on demand. Every tool advertises MCP's `readOnlyHint`, so a client can present them as read-only instead of prompting for write approval on a call that was never going to write anything. No row data, ever, and the same exclusion and managed-connection safeguards as the rest of Truss apply here too, opt-in and off by default behind `truss.mcp.enabled`.

I pointed it at a real project I've worked on for a while, in Claude Desktop, and the difference was immediate: instead of me pasting a schema dump at the start of the conversation, or the agent asking me to run a query to check a column name, it just called `describe_table` before it wrote anything, the same check that would have caught the guessed `author_id` from the start of this post. No staleness, because there's nothing to go stale, it's reading the same live introspection the diagram uses.

## Try it

- [Live demo](https://trussphp.com/demo/), running against a fictional schema
- AI context guide: [trussphp.com/guides/ai-context](https://trussphp.com/guides/ai-context/)
- MCP server guide: [trussphp.com/guides/mcp-server](https://trussphp.com/guides/mcp-server/)
- Full changelog: [CHANGELOG.md on GitHub](https://github.com/albertoarena/laravel-truss/blob/main/CHANGELOG.md)

Update with `composer update albertoarena/laravel-truss`, and if you want the MCP server too, `composer require laravel/mcp` on top.

## What's next

More `truss:doctor` rules and CI-native output formats are next on the [roadmap](https://trussphp.com/roadmap/), followed by reading Eloquent relationships for semantic edge labels instead of raw foreign keys, and navigation aids for schemas with a hundred tables or more. If a tool the agent needs isn't there yet, or an annotation source you'd want isn't supported, [open a discussion](https://github.com/albertoarena/laravel-truss/discussions).
