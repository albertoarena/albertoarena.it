---
title: "I gave my schema viewer your app's colours"
date: "2026-08-03T10:00:00.000Z"
template: "post"
draft: false
slug: "gave-my-schema-viewer-your-app-colours"
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Laravel Truss 1.6 adds theming to match the app it's embedded in, and truss:export to generate deterministic schema files your CI can gate on."
socialImage: "/images/posts/gave-my-schema-viewer-your-app-colours/cover.jpg"
---

![Pantone colour swatches fanned out in a circle on a concrete surface](/images/posts/gave-my-schema-viewer-your-app-colours/cover.jpg)

[Truss](https://github.com/albertoarena/laravel-truss) is a live, zoomable ER diagram of your Laravel app's actual database schema, safe to run in production because it only ever reads structure. I introduced it [back in July](/posts/introducing-truss/), and it's been part of every client project since, gated behind a `viewTruss` policy. Two things kept nagging at me. The dashboard was always Truss blue, whatever the client's actual brand was, so it looked bolted onto their app rather than part of it. And the export button, one click for a Markdown data dictionary or a DBML file, only ever got clicked when I remembered to, so the schema file committed to the repo drifted quietly from the real one until someone noticed, usually the hard way.

Truss 1.6 fixes both: a themeable dashboard that matches whatever it's embedded in, and a `truss:export` command that puts the same output in your terminal and your CI pipeline, no browser required.

## Match it to your app

Colours and fonts now live under `truss.theme` in config, and Truss re-skins itself in both light and dark mode:

```php
// config/truss.php
'theme' => [
    'colors' => [
        'light' => [
            'accent' => '#b45309',
            'accent-secondary' => '#0f766e',
            'background' => '#faf6f0',
            'surface' => '#fffdf8',
            'text' => '#3a2a1c',
            'border' => '#c8873f',
        ],
        'dark' => [
            'accent' => '#fbbf24',
            'background' => '#1b130b',
            'surface' => '#26190d',
            'text' => '#f5e6d0',
            'border' => '#8a6428',
        ],
    ],
],
```

Only the knobs you set are overridden, everything else stays on the default Blueprint palette, so three or four values are enough to make it look at home. The re-skin runs deep: the diagram's relationship lines, label backdrops, background grid, table rows, and inputs all follow, not just the toolbar chrome. It ships as a same-origin stylesheet, no build step, `style-src 'self'` still covers it, and a default install adds no extra request at all. Each value is validated before it's written, so a typo falls back to the default instead of breaking the sheet.

Picking hex values by hand isn't required. The new [theme builder](https://trussphp.com/theme-builder/) previews a palette against the real dashboard live, starts from presets (Blueprint, Ember, Contrast) if you'd rather tweak than start blank, and generates the exact `config/truss.php` snippet to paste in.

<img src="/images/posts/gave-my-schema-viewer-your-app-colours/theme-builder-light.webp" alt="The Truss theme builder in light mode: colour knobs on the left, the schema diagram re-skinned in a warm amber and teal palette on the right" class="block dark:hidden rounded-lg border border-white-cloud" />
<img src="/images/posts/gave-my-schema-viewer-your-app-colours/theme-builder-dark.webp" alt="The same Truss theme builder in dark mode, the same amber and teal palette carried through to the dark background" class="hidden dark:block rounded-lg border border-dark-cloud" />

## Get a schema file without opening a browser

```bash
php artisan truss:export --format=dbml --output=docs/schema.dbml
php artisan truss:export --format=json --check
```

`truss:export` is the export button's command-line counterpart: the same five formats (DBML, JSON, CSV, Markdown data dictionary, Mermaid), generated straight from PHP, no browser involved. Output is deterministic, the same schema always produces the same bytes, which is what makes `--check` worth running: point it at the file you've committed, and it exits `1` the moment that file stops matching the database, `2` on a usage error, `0` when everything lines up. Wire it into a commit hook or CI, and schema drift stops being something a reviewer has to notice by eye. Structure only, as always, no network call.

## Try it

- Theme builder: [trussphp.com/theme-builder](https://trussphp.com/theme-builder/)
- Live demo: [trussphp.com/demo](https://trussphp.com/demo/)
- Theming guide: [trussphp.com/guides/theming](https://trussphp.com/guides/theming/)
- Schema export guide: [trussphp.com/guides/schema-export](https://trussphp.com/guides/schema-export/)
- Changelog: [CHANGELOG.md on GitHub](https://github.com/albertoarena/laravel-truss/blob/main/CHANGELOG.md)

Update with `composer update albertoarena/laravel-truss`.

## What's next

Lighthouse CI is next on the [roadmap](https://trussphp.com/roadmap/): automated performance and accessibility audits across both themes, light and dark. After that: more `truss:doctor` rules, reading Eloquent relationships for semantic labels instead of just foreign keys, and schema context formatted for AI agents working in the same codebase. If a theme knob is missing or `truss:export` should support a format it doesn't, [open a discussion](https://github.com/albertoarena/laravel-truss/discussions).

## Notes

On August 4, 2026, replaced the link to the v1.6.0 release notes above with a link to the [full changelog](https://github.com/albertoarena/laravel-truss/blob/main/CHANGELOG.md), since v1.6.1 has since shipped a fix on top of it.
