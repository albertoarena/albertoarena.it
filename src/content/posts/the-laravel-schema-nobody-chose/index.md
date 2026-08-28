---
title: "The Laravel schema nobody chose"
date: "2026-08-28T10:00:00.000Z"
template: "post"
draft: false
slug: "the-laravel-schema-nobody-chose"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Database"
  - "Open Source"
description: "A structural census of fifteen real Laravel codebases: what their schemas look like, how connected they are, and how much of it was never really a choice."
socialImage: "/images/posts/the-laravel-schema-nobody-chose/cover.jpg"
coverAlt: "Rows of labelled wooden drawers in an old library card catalog, seen at an angle"
---

Fifteen real Laravel applications, every one of them a codebase you can go and read. 811 tables. One pinned MySQL 8.0 database, migrations only, no seed data. Every application installed from a clean clone and migrated before a single table was read.

This is not a review of those fifteen projects. It is a census: a look at what a Laravel schema actually looks like once an application has shipped and grown past the tutorial stage. A handful of real issues turned up during the read, and each one is going to the project that owns it, privately, before anything about it is written here. What is left, once those are set aside, is more interesting anyway. These projects share conventions they never discussed, because the framework or the ecosystem around it chose first.

Two different reads sit behind this piece, and they cover different sets, so I keep them apart throughout. The relationship counts cover all fifteen applications. The structural checks are slower, and some of these applications could not run the tooling at the time, so they cover a smaller set: twelve databases and 482 tables, of which seven are real applications and five are bare Laravel baselines kept as a control. Wherever a number appears below, it says which of the two it came from.

## A table nobody wrote on purpose

Six tables across four of these projects have no primary key at all. In Bagisto there are three of them, `password_resets`, `admin_password_resets` and `customer_password_resets`. Firefly III and Koel have one each under the first of those names. Twill has one under its own prefix. All six carry the same shape:

```sql
email        varchar(255) NOT NULL,
token        varchar(255) NOT NULL,
created_at   timestamp NULL,
KEY (email)  -- and nothing declared PRIMARY
```

That shape is not a mistake any of these four projects made. It is Laravel's own old scaffold, the one every project generated for years by default. Laravel has since replaced it: a current Laravel 13 install ships a table named `password_reset_tokens`, with the email column as an actual primary key.

Twill is the clearest evidence of what happened here. At some point it renamed its copy to `twill_password_resets`, its own name in its own migration, and kept the old keyless design anyway. Nobody sat down and decided a password reset table should have no primary key. A framework generator made that call years ago, and it has been carried forward ever since by projects that had no reason to look at it again.

Read this one carefully: it says something about how Laravel scaffolding propagates, not about carelessness in any of the four projects that still carry it.

## How connected is a real schema, actually

The strongest finding in this census did not come from the structural rules at all. It came from a much simpler question, asked of all fifteen applications: of all the tables in a schema, how many actually sit in at least one foreign key relationship with another table?

| App | Tables | Foreign keys | Tables in a relationship |
|---|---:|---:|---:|
| [Bagisto](https://github.com/bagisto/bagisto) | 146 | 185 | 87% |
| [Monica](https://github.com/monicahq/monica) | 100 | 138 | 86% |
| [Lunar](https://github.com/lunarphp/lunar) | 75 | 82 | 85% |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | 81 | 114 | 79% |
| [Koel](https://github.com/koel/koel) | 40 | 42 | 75% |
| [Pterodactyl](https://github.com/pterodactyl/panel) | 35 | 35 | 74% |
| [InvoiceShelf](https://github.com/InvoiceShelf/InvoiceShelf) | 49 | 79 | 69% |
| [Lychee](https://github.com/LycheeOrg/Lychee) | 52 | 55 | 67% |
| [Azuriom](https://github.com/Azuriom/Azuriom) | 28 | 22 | 64% |
| [Twill](https://github.com/area17/twill) | 24 | 4 | 33% |
| [Cachet](https://github.com/cachethq/cachet) | 32 | 3 | 16% |
| [BookStack](https://github.com/BookStackApp/BookStack) | 41 | 4 | 12% |
| [Snipe-IT](https://github.com/snipe/snipe-it) | 58 | 1 | 3% |
| [October CMS](https://github.com/octobercms/october) | 41 | 0 | 0% |

[Statamic](https://github.com/statamic/cms) is the fifteenth and is not in this table, for a reason that gets its own section below.

Look at the bottom of that list. Snipe-IT is a mature asset manager with 58 tables held together by exactly one foreign key. October CMS has 41 tables and none at all: its core modules carry 35 relation declarations in plain PHP, `belongsTo`, `hasMany`, `morphTo`, the usual Eloquent vocabulary, and not one line outside `vendor/` ever calls `->foreign()`. The relationships are real. The database enforces none of them.

Put another way: half of this corpus would draw an ER diagram (ERD) with almost no lines in it, not because the relationships are missing, but because they live somewhere a diagram cannot see.

That is not a defect anywhere on this list. It is a real fork in how Laravel applications get built, sitting in plain sight, that nobody had put a number on before. One half of this corpus leans on the database to hold its relationships together. The other half keeps every one of them in application code and asks nothing of the schema. Both are working software. They are just built on two different assumptions about what a database is for.

## Portability has a cost, and it is the foreign key

Part of that split has a plain explanation. Several of these projects ship migrations designed to run on more than one database engine, MySQL, PostgreSQL and SQLite alike. That choice has a direct, visible cost in the schema, and the foreign key is the main casualty.

Cachet is the clearest example: 32 tables, and 3 foreign keys between them. Its schema is full of columns that are clearly meant to reference another table, with `_id` naming, the right type, sitting right next to the table they point at, and no constraint declared. A `->foreign()` call is tied to a specific engine's constraint syntax in a way a plain integer column is not, so a schema meant to run anywhere gives up the constraint to keep that promise.

This is worth holding on to before reading the bottom of the table as a quality signal. A self-hostable project that has to work on whatever engine somebody happens to have is under a constraint that a private application, built for one engine from day one, never faces.

## What a starter kit adds, and what a flat-file CMS does not

Two results here are not surprises, and both are worth stating plainly, because they rule things out.

The first is about starter kits. The structural read included a bare Laravel skeleton as a control, migrated with nothing else installed, and three of the common ways a project gets started on top of it. Breeze and Filament both landed on exactly 9 tables, the same count as the bare control, with nothing flagged at either. Jetstream adds five more tables for team support and still comes back with nothing flagged under the default profile. So the schema a brand new Laravel project starts with does not really depend on which of those gets picked. That is worth knowing before assuming a schema problem in a young project came from a starter kit choice, because it almost certainly did not.

The second is Statamic, and it is why it sits outside the table above. Statamic scored exactly the same as the bare control: 9 tables, nothing flagged. That is the expected result rather than a surprising one, and it is easy to forget while reading a column of percentages. Statamic is a flat-file CMS. Content lives in files, not rows. Its database only exists for the parts of Laravel that need one, sessions, cache, the usual scaffolding. Ranking it on how connected its schema is would say nothing, because it has no application tables to connect.

## What this does and does not show

Every codebase here publishes its source, but the licence is not what creates the bias, and it is worth being precise about that. Twelve of these fifteen are MIT, AGPL or GPL. Three are commercial products that happen to ship readable source: Cachet, October CMS and Statamic. What all fifteen actually share is a distribution model. They ship to infrastructure they do not control, so their migrations have to run on whatever engine the person installing them happens to have.

That is the pressure that suppresses foreign keys, and it falls just as hard on the three commercial ones as on the twelve. A private application, built for one engine from day one and deployed only by the team that wrote it, is under none of it and will look far more connected as a result. That is a different population, and this census cannot see it.

One application that was meant to be in this set never finished. Coolify's migrations stop partway on MySQL: one index name resolves to 72 characters, past MySQL's limit of 64. That is not a defect in Coolify. It is a PostgreSQL-first application being exactly that, on an engine it was never designed for, and it could not be rescued by switching engines, because one pinned MySQL is the first rule of this setup.

## The instrument, briefly

Every schema here was read with [`truss:doctor`](https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=schema-census), a structural check I built into Laravel Truss. It is the reason this census could happen at all: it is what turned hundreds of tables across fifteen databases into something one person could actually read in a reasonable amount of time. Structure only, never data.

It is not the subject of this piece, and any real issue it turned up along the way goes to the project that owns it before it goes anywhere public. That is not a promise made only here: the [list of applications it has been run against](https://trussphp.com/reference/tested-applications/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=schema-census) says the same thing, and deliberately publishes no findings.

What is public is the part that is not anybody's fault. A lot of what looks like a schema decision in a mature Laravel application was never really decided by that application at all.
