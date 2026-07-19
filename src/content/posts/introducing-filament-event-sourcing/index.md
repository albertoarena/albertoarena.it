---
title: "What if every Filament write went through an aggregate?"
date: "2026-06-18T10:00:00.000Z"
template: "post"
draft: false
slug: "introducing-filament-event-sourcing"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Filament"
  - "Event sourcing"
  - "Spatie"
description: "A Filament plugin that routes every create, edit, and delete through your domain aggregates, without giving up the admin panel you already love."
socialImage: "/images/posts/introducing-filament-event-sourcing/cover.jpg"
---

![Filament Event Sourcing plugin](/images/posts/introducing-filament-event-sourcing/cover.jpg)

Filament is a great admin panel. Event sourcing is a great architectural pattern. Getting the two to work together, though, has always meant compromises: either you bypass your aggregates and write directly to the database, or you ditch Filament's create/edit flows and build everything from scratch. I've been using both in the same projects for a while, and that friction kept bothering me. So I built a plugin to remove it.

[filament-event-sourcing](https://github.com/albertoarena/filament-event-sourcing) is a Filament plugin that intercepts the standard create, edit, and delete actions and routes them through your domain aggregates. Your forms stay the same. Your validations and notifications stay the same. The only change is what happens on write: instead of an Eloquent save, the data flows through your aggregate and gets stored as a domain event. The read model is still updated by your projectors, exactly as you'd expect.

This plugin is part of a small ecosystem I've been building around Spatie's package — see also the [generator](/posts/domain-using-spatie-event-sourcing/) for scaffolding new domains and the [Claude Code skill](/posts/ai-laravel-event-sourcing/) for designing them conversationally.

## What you get out of the box

The plugin ships with a few things I found myself needing every time I mixed Filament with event sourcing.

![Posts list with per-row History action](/images/posts/introducing-filament-event-sourcing/posts-list.webp)

The first is an event history browser. Every record gets a dedicated view of its event log: event class, timestamp, version, and the full JSON payload on expand. It's available either as a relation manager tab on the view page, or as a slide-over action on the table row. No extra setup: add the trait to your resource and it appears.

![Per-record event history as a slide-over with expandable JSON payloads](/images/posts/introducing-filament-event-sourcing/event-history.webp)

![Per-record event history as a relation manager tab](/images/posts/introducing-filament-event-sourcing/event-history-relation-tab.webp)

The second is a system-wide stored events browser. This gives you a searchable, filterable view of every event in your application, across all aggregates. You can filter by event class, aggregate UUID, or date range. It's read-only by design, which keeps the event log immutable.

![System-wide stored events browser](/images/posts/introducing-filament-event-sourcing/stored-event-browser.webp)

![Stored event detail view with full payload and metadata](/images/posts/introducing-filament-event-sourcing/stored-event-view.webp)

The third is a projector replay page. You can trigger a replay for any registered projector directly from the admin panel, one at a time, with a live count of how many events were processed. Access is controlled by a three-layer authorization system: a plugin-level option, a config flag, and a Gate ability for fine-grained control.

![Projector replay confirmation](/images/posts/introducing-filament-event-sourcing/replay-step-2-confirmation.webp)

![Projector replay notification](/images/posts/introducing-filament-event-sourcing/replay-step-3-notification.webp)

## How to install it

```bash
composer require albertoarena/filament-event-sourcing
```

You'll need Laravel 11 or 12, Filament 4.0+, and Spatie's `laravel-event-sourcing` 7.0+. The plugin registers itself automatically via Filament's plugin system.

From there, you add two traits to your resource (`CreatesEventSourcedRecord` and `EditsEventSourcedRecord`), wire up the delete action, and the rest is your aggregate logic. The plugin doesn't try to generate your events or commands. That's your domain, and it should stay that way.

A full working example with a `Post` entity is available in the [demo repository](https://github.com/albertoarena/filament-event-sourcing-demo/), which walks through the complete setup from aggregate to Filament resource.

## Where to go from here

The package is at version 0.1.0 and working. There's more I want to add, but the core is solid enough to use in real projects today. The [documentation](https://albertoarena.github.io/filament-event-sourcing/) covers installation, each feature in detail, configuration, and authorization. If you're already using Spatie's event sourcing package with Filament, this plugin is probably the missing piece.

Feedback and contributions are welcome.
