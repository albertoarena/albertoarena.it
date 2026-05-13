---
title: "Deploying Laravel to Netsons with GitHub Actions"
date: "2026-05-13T12:00:00.000Z"
template: "post"
draft: false
slug: "laravel-netsons-deploy"
category: "Laravel"
tags:
  - "Laravel"
  - "Deploy"
  - "Netsons"
  - "GitHub Actions"
  - "Open Source"
  - "PHP"
description: "I built a Laravel package to deploy to Netsons shared hosting via GitHub Actions, supporting both FTP and git clone strategies."
---

If you work with Italian clients, sooner or later you will run into [Netsons](https://www.netsons.com). It is one of the most popular hosting providers here, affordable and widely used for small and medium projects. The problem is that deploying a Laravel application to shared hosting is not exactly straightforward.

There is no Forge, no Envoyer, no one-click solution. You either script everything yourself from scratch or you copy that old deploy script from three projects ago and hope it still works.

I got tired of that.

## What I built

[laravel-netsons-deploy](https://github.com/albertoarena/laravel-netsons-deploy) is a Laravel package that gives you a complete deployment workflow for Netsons shared hosting, powered by GitHub Actions. Install it, run an artisan command, answer a few questions, and you get a ready-to-use `.github/workflows/deploy.yml` tailored to your project.

It supports two strategies, depending on your Netsons plan:

**FTP** builds your app on the GitHub Actions runner and uploads the result via FTP. It is the slower option, but subsequent deploys are incremental so only changed files are transferred.

**Git clone** clones your repository directly on the server via SSH, runs Composer there, and uses SCP only to transfer compiled assets. It is significantly faster.

Both strategies require SSH access to run post-deployment artisan commands (migrations, cache rebuilding, and so on), so both need a Netsons SSD 30 plan or higher. The difference is what gets transferred: with FTP you upload the built app, with git clone the server pulls the source and builds it locally.

Both strategies share the same core behavior: release-based deployments with timestamped directories, zero-downtime switching via a proxy `index.php`, shared `.env` and `storage/` across releases, automatic cache clearing, and database migrations on each deploy.

## The artisan commands

Three commands do most of the work:

- `php artisan netsons:install` runs the interactive setup wizard, publishes the config, and generates the workflow file.
- `php artisan netsons:env` manages custom environment variables, including secret-backed values, static values, and build-time variables for Vite.
- `php artisan netsons:check` shows your current configuration and lists the GitHub Secrets you need to add.

Once you have the workflow file committed and the secrets configured in your repository, deploys happen through GitHub Actions with a single click. No SSH sessions, no manual steps.

## How it was built

I used TDD throughout and had Claude Code as a coding assistant for the more repetitive parts. The documentation is complete, with separate guides for FTP setup, git strategy, Netsons configuration, and troubleshooting.

The package is stable and running in a real production project right now.

## Lessons learned

Getting here took 35 releases. That number sounds excessive, but shared hosting is full of edge cases: different PHP binary paths, FTP quirks, SSH on a non-standard port (65100 on Netsons), environments where Composer is available server-side and others where it is not. Each version fixed something real.

A few things stuck with me from this project.

**Build what does not exist yet.** There was nothing out there for deploying Laravel to Netsons specifically. I could have kept patching my scripts, but packaging the solution properly made it reusable and much easier to maintain.

**Patience is part of the process.** Thirty-five versions is not failure, it is refinement. The gap between "it works on my project" and "it works reliably across different setups" is where most of the real engineering happens.

**Sharing matters.** Making the package open source means someone else dealing with the same Netsons headache can skip the painful parts. And if they find an edge case I missed, they can contribute a fix.

## Try it

```bash
composer require albertoarena/laravel-netsons-deploy --dev
php artisan netsons:install
```

The full documentation is at [albertoarena.github.io/laravel-netsons-deploy](https://albertoarena.github.io/laravel-netsons-deploy). Issues and pull requests are welcome.
