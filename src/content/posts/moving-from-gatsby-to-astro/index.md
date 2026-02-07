---
title: "Moving from Gatsby to Astro"
date: "2025-02-07T12:00:00.000Z"
template: "post"
draft: false
slug: "moving-from-gatsby-to-astro"
category: "Static Websites"
tags:
  - "Astro"
  - "Gatsby"
description: "I migrated my blog from Gatsby to Astro. Here's why."
---

A few years ago, I [moved my blog to Gatsby](/posts/finally-i-moved-to-gatsby) because I wanted to learn React. It served me well, but it was time for a change.

## Why Astro?

[Astro](https://astro.build/) is a modern static site generator that caught my attention for several reasons:

**Zero JavaScript by default.** Astro ships zero JavaScript to the browser unless you explicitly need it. For a blog like mine, this means faster page loads and better performance.

**Content Collections.** Astro provides built-in support for Markdown content with type-safe frontmatter validation. No more runtime surprises.

**Simpler configuration.** Gatsby's plugin ecosystem is powerful but complex. Astro keeps things straightforward while still being flexible.

**Framework agnostic.** While Gatsby is React-only, Astro lets you use React, Vue, Svelte, or plain HTML. I can pick the right tool for each component.

**Faster builds.** My blog now builds significantly faster, which makes the development experience more enjoyable.

## The migration

The migration was relatively smooth. The content structure remained similar, and Astro's Markdown support made it easy to keep my existing posts. The main work was converting React components to Astro components, which are simpler and closer to plain HTML.

If you're running a content-focused website and considering a change, Astro is worth a look.
