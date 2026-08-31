---
title: "Three ways to build a Laravel ERD, and what each one costs"
date: "2026-08-31T10:00:00.000Z"
template: "post"
draft: false
slug: "three-ways-to-build-a-laravel-erd"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Laravel ERD is one name for three different machines: migrations replayed, models reflected, or the live database read. What each source buys you, and what it can never show."
socialImage: "/images/posts/three-ways-to-build-a-laravel-erd/cover.jpg"
coverAlt: "Railway tracks converging at a switch, seen directly from above"
---

A developer put together a roundup of five Laravel schema packages a few weeks back, Truss among them, and the graphic that went with it labelled every single one "Laravel ERD." That's also the literal name of two other packages in the list. He wasn't being careless: it's the only word the category has. And that's the whole problem, captured in one image. The name describes what comes out of these tools, an ER diagram (ERD), and says nothing about where it came from.

"Laravel ERD" is one label sitting over three genuinely different machines. Pick a package under that name and you're not comparing icon sets or export formats, you're choosing a source of truth, and that choice decides what the resulting ERD can and can't ever show you.

## Three sources

There are exactly three places a Laravel ERD tool can go looking for your schema:

- **Your migrations.** Replay them into a throwaway database and read back what came out.
- **Your models.** Reflect over your Eloquent classes and their relation methods.
- **Your database.** Introspect the live connection directly.

Everything else, three packages or thirty, is one of these three with different packaging. So it's worth going through each in turn: how it works, what it buys you, and what it can never show you no matter how well it's built.

## Migrations: what you meant to build

A migrations-based tool spins up a disposable database, usually SQLite in memory, runs your migrations against it fresh, and reads the resulting schema back out. Relations mostly come from parsing the model files separately, since a migration file doesn't declare `hasMany`.

What that buys you is real: no live database needed, works straight off a clean checkout, and it's honest about intent. This is what the team decided to build.

What it costs is the same fact seen from the other side. It draws what you meant, not what's actually there. Anything applied by hand, by another service, or by a migration that predates this tool's own rules is invisible to it. The replay also has to succeed on the substitute engine: a MySQL fulltext index has nowhere to go in SQLite, so a migration built around one simply fails to replay. And a database Laravel didn't create in the first place, an inherited legacy schema, produces nothing at all.

## Models: what Eloquent believes

A models-based tool works the other direction. It finds every Eloquent model and reads its relation methods, in some implementations by actually instantiating each model and calling its own public methods to see which ones hand back a relation, discarding whatever errors along the way.

That buys something a foreign key structurally cannot express: polymorphic relations. A `morphTo` or `morphMany` has no column that a database constraint could ever encode, so a models-based diagram is the only one of the three that can draw them at all. It also draws relations in applications that never added a single database constraint, which turns out to be a lot of them.

The cost is in what it leaves out and what it trusts. Only tables that have a model attached show up, so pivot tables and legacy tables with no Eloquent class sit outside the picture entirely. Reflecting over model classes means, in some implementations, executing your application code to find out what it does. And what comes back is what Eloquent believes about your data, which isn't always what the database is actually willing to enforce.

One package doing this well has over 300,000 installs. It solves a real problem, polymorphic relations most of all, that a database-only tool like Truss doesn't solve at all.

## The database: what's actually there

The third source doesn't touch your code. It connects to the live database and reads the schema straight out of it: tables, columns, foreign keys, all of it.

What that buys you is the property the other two can't offer at any price: it cannot drift from what's actually deployed, because it *is* what's deployed. It sees tables no model was ever written for. It works on a schema Laravel didn't create, inherited, third-party, whatever happens to be connected.

That's not a claim I'm making from the mechanism alone. It's been run, installed, booted and drawn something in [20 Laravel applications, 861 tables between them](https://trussphp.com/reference/tested-applications/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=three-ways-to-build-a-laravel-erd), which is closer to measured than reasoned.

The cost is the one this whole article exists to say out loud, because it's Truss's own. If your schema has no foreign keys, you get very few edges. A diagram built this way can only draw the relationships your database actually knows about.

## Where that weakness lives, and why it's honest

Somebody said it plainly in a GitHub issue, and it's worth quoting exactly rather than smoothing it over: "without the model relations, it is not really useful to me." They're right. A schema with no declared foreign keys, and there are plenty of those, produces a Truss diagram with almost no lines in it.

The honest answer isn't a defence. A diagram with no edges is a finding about the schema, not a failure of the viewer. If your tables aren't wired together at the database level, that's worth knowing regardless of which tool tells you. `truss:doctor`, the structural check built into Truss, names the foreign keys that look missing rather than pretending the diagram's silence is the whole story, and the rule behind that check went through a real calibration pass against real schemas, tightened from 69 findings down to 14, because a tool that tells you your database is wrong needs to hold itself to that standard first.

Reading Eloquent relations as a second source of edges, drawn distinctly from the ones the database actually enforces, is on the roadmap. No date on it yet. But it's the honest fix for an honest limitation, not a walked-back promise.

## Three sources, side by side

| Source | Reads | Shows uniquely | Never shows |
|---|---|---|---|
| Migrations | Migration files, replayed into a throwaway database | Intent: what the team meant to build, no live database needed | Anything applied outside the migrations: hand edits, other services, a schema it didn't create |
| Models | Eloquent classes and their relation methods | Polymorphic relations, and relations with no database constraint at all | Tables with no model, and anything the database enforces that Eloquent doesn't declare |
| Database | The live connection, directly | What's actually deployed, tables no model knows about | Relationships that exist only in application code, never as a constraint |

## Pick the question, not the package

These three tools aren't really competing for the same job, whatever the shared name suggests. "What did we mean to build?" is a question for your migrations. "What does Eloquent think the shape of the data is?" is a question for your models. "What's actually sitting in production right now?" is a question only the database itself can answer.

A Laravel ERD, whichever one you reach for, is only as good as knowing which of those three questions you're actually asking. Pick the tool that matches the question, and know which one you picked.

Structure only, never data.
