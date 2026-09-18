---
title: "ER diagrams for Filament, without a single row of customer data"
date: "2026-09-18T10:00:00.000Z"
template: "post"
draft: false
slug: "erd-for-filament-without-customer-data"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Filament"
  - "Developer Tools"
  - "Database"
description: "filament-truss brings Truss's live entity relationship diagram (ERD) into a Filament panel: structure only, properly gated, themed to match automatically, no build step."
socialImage: "/images/posts/erd-for-filament-without-customer-data/cover.jpg"
coverAlt: "A blue architectural cross-section blueprint of a multi-storey building, showing staircases, doors and room outlines with no readable labels"
discussion: "albertoarena/filament-truss"
---

Most admin panels are one careless query away from showing more than they should. A resource that lists customers, a relation manager that previews orders, a widget somebody added to answer one Slack question and never removed: it is easy to build a dashboard that quietly exposes real data to anyone who can log in. [filament-truss](https://github.com/albertoarena/filament-truss) adds an entity relationship diagram (ERD) to your Filament panel that cannot do that, because it never reads a row in the first place. It draws tables, columns, indexes and foreign keys: structure only, never data.

## What it does

filament-truss wraps [Truss](https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=filament-truss), the Laravel schema viewer, as a first-class page inside a Filament panel.

- **A native panel page.** The diagram sits in your panel's own navigation, not behind a separate route you have to remember exists.
- **Structure only.** Tables, columns, indexes, foreign keys and column defaults. No row data is read to build the page, and none can be reached from it.
- **Open a resource already focused on its own table.** A resource can link straight into the diagram with its table isolated and its neighbours highlighted, and the link removes itself rather than greying out on a table the diagram cannot show.
- **Themed automatically, no build step.** The diagram follows your panel's own colours and corner radius, and switches with light and dark, with nothing to configure.

## It only shows what a diagram needs

The page calls `Truss::payload()` and hands the result straight to Truss's own frontend. There is no second renderer, and no schema endpoint of its own to keep in sync with the one Truss already has.

Truss also keeps framework plumbing out of the diagram by design. On its own demo database that is 16 tables with 8 excluded, so the default footer reads `8 of 16 tables` rather than presenting a filtered diagram as if it were the whole schema. If you need to see the excluded tables too, that stays an explicit operator decision, not something a viewer can toggle on themselves.

Below is that same page from the demo application that ships with the plugin, focused on a single table. Focus isolates a table and its foreign-key neighbours, which is also what powers a resource's own link into the diagram:

<img src="/images/posts/erd-for-filament-without-customer-data/panel-light.webp" alt="The filament-truss diagram page in light mode, inside the demo Filament panel's own sidebar, focused on the books table with its columns, keys and foreign-key neighbours visible" class="block dark:hidden rounded-lg border border-white-cloud" />
<img src="/images/posts/erd-for-filament-without-customer-data/panel-dark.webp" alt="The same filament-truss diagram page in dark mode, the panel's own colours carried through automatically" class="hidden dark:block rounded-lg border border-dark-cloud" />

## Getting access control right, not just working

The obvious way to wire a package's own page into someone else's panel is to let the panel handle "can this user see this page" and stop there. That is wrong in both directions. It is too permissive if the application has switched Truss off entirely, and it is too strict in local, where Truss is deliberately open and a page consulting the shipped allow-list would simply be missing for a developer on their own machine.

So the page asks Truss's own `Authorize` logic the same four questions Truss asks itself everywhere else: is the feature enabled, is this environment local, is a gate even bound, and does the user pass the `viewTruss` gate. Panels can authenticate against a guard of their own, so that last question is asked about the panel's own user, not whatever the default guard happens to resolve.

That parity matters past the page itself. Truss serves its stylesheet, its script and Mermaid from routes gated the same way, so a viewer who is let onto the page but refused by the gate does not get a polite message, they get a blank frame and a handful of failed requests. Access control here is not only about the page loading, it is about the page working at all once it has.

## Requirements

- PHP 8.2 or newer
- Laravel 12 or 13
- Filament 5 (Filament 4 is not supported)
- `albertoarena/laravel-truss` ^1.13.1

```bash
composer require albertoarena/filament-truss
```

## Accessibility

The diagram is keyboard operable and has been tested with VoiceOver, and axe-core runs against it in CI. That is a real bar, and it is the one being claimed here: not WCAG conformance, which is a separate, formal thing this has not been measured against.

## Get started

The package is on [GitHub](https://github.com/albertoarena/filament-truss) today, and it has been submitted to the official Filament plugins directory and is awaiting approval. If you are already running [Truss](https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=filament-truss) and Filament in the same app, this is the shortest path from "I have a schema viewer" to "I have a schema viewer where my team already works."

Feedback welcome, as always.
