---
title: "10,000 downloads"
date: "2026-06-30T10:00:00.000Z"
template: "post"
draft: false
slug: "laravel-event-sourcing-generator-10k"
category: "Open Source"
tags:
  - "PHP"
  - "Laravel"
  - "Event sourcing"
  - "Spatie"
  - "Open Source"
description: "laravel-event-sourcing-generator just crossed 10,000 downloads on Packagist. A short look back at how it started and where things have gone since."
socialImage: "/images/posts/laravel-event-sourcing-generator-10k/cover.jpg"
---

![Sparkler at night](/images/posts/laravel-event-sourcing-generator-10k/cover.jpg)

[laravel-event-sourcing-generator](https://github.com/albertoarena/laravel-event-sourcing-generator) crossed 10,000 downloads on Packagist today.

I built it to solve a specific friction point: setting up a Spatie event-sourcing domain meant writing a lot of the same files every time — aggregates, events, projectors, reactors, read models. The generator takes a migration or a quick description of your model and scaffolds all of it in one artisan command. It's not a framework addition, just a time-saver.

```bash
composer require --dev albertoarena/laravel-event-sourcing-generator
php artisan event-sourcing:generate Post
```

10k is more than I expected when I published it. The package has a narrow focus and a niche audience — Laravel developers who've already bought into event sourcing — so seeing it spread this far is genuinely surprising.

The project didn't stop at the generator. Earlier this year I built a [Claude Code skill](https://github.com/albertoarena/claude-laravel-event-sourcing) that adds a design conversation before the code generation, so you work through the domain boundaries before anything gets written. More recently, the [filament-event-sourcing](https://github.com/albertoarena/filament-event-sourcing) plugin closes the gap between Filament's admin panel and your aggregates. The generator is still the foundation, but these fill in the parts it was never meant to handle.

Thanks to everyone who's used it, filed issues, or left feedback. The package is still actively maintained and the best place for questions is the [GitHub issues](https://github.com/albertoarena/laravel-event-sourcing-generator/issues).
