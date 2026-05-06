---
title: "Your .env files are lying to you"
date: "2026-05-06T10:00:00.000Z"
template: "post"
draft: false
slug: "introducing-envaudit"
category: "Open Source"
tags:
  - "Node.js"
  - "Developer Tools"
  - "CLI"
  - "DevOps"
description: "Environment files drift out of sync silently. envaudit catches what you miss."
socialImage: "/images/posts/introducing-envaudit/cover.jpg"
---

![A rusty old key on a wooden table — photo by Nick Russill on Unsplash](/images/posts/introducing-envaudit/cover.jpg)

Not loudly. There's no error, no warning, no failing test. Your `.env.example` says you need 15 variables. Your actual `.env` has 22. The staging server is missing 3 that production has. And nobody noticed, because everyone just eyeballs it.

I've been there more times than I'd like to admit.

Environment files are one of those things that work fine until they don't. Every project has a `.env.example` that starts accurate and slowly drifts out of sync with reality. Variables get added for a new feature, never documented. Old ones linger after a refactor. Somewhere along the way, someone commits a real API token to `.env.example` "just for reference". The file becomes a polite fiction.

So I built [envaudit](https://albertoarena.github.io/envaudit/).

## What it does

envaudit is a CLI tool that compares `.env` files against each other and against `.env.example`. It flags:

- **Missing variables** - keys in `.env.example` that your `.env` doesn't have
- **Undocumented keys** - variables in your `.env` that don't appear in `.env.example`
- **Empty values** - keys that exist but have no value set
- **Potential secrets** - values in `.env.example` that look like real credentials instead of placeholders

That last one matters. I've seen teams commit actual API tokens to `.env.example` "just for reference", then wonder why their keys got leaked.

## Usage

```bash
npx @albertoarena/envaudit check
```

That's it for a basic audit. It runs in milliseconds, has zero external dependencies, and works with any framework or language. You don't need a Node.js project to use it.

You can also diff two files:

```bash
npx @albertoarena/envaudit diff .env.staging .env.production
```

Or sync missing keys from `.env.example` to your local `.env`:

```bash
npx @albertoarena/envaudit sync
```

The sync command shows a preview before making any changes, which I think is the right default behaviour.

## Why zero dependencies?

I wanted something I could drop into any CI pipeline without worrying about supply chain issues or slow installs. The tool uses only Node.js built-in modules, so it installs fast and works with no lockfile concerns.

For CI, the `--ci` flag is what you want: it exits with code 1 when critical issues are found (missing variables or real secrets in `.env.example`), so your build fails before the misconfiguration reaches production. Undocumented or empty variables are reported as warnings but won't block the build.

```bash
npx @albertoarena/envaudit check --ci --no-color
```

The `--no-color` flag keeps the output clean in CI logs. If you inject secrets at runtime and don't want warnings about empty values, add `--ignore-empty`.

## Get started

Check out the [documentation](https://albertoarena.github.io/envaudit/) or install globally if you use it often:

```bash
npm install -g @albertoarena/envaudit
```

Feedback welcome, as always.
