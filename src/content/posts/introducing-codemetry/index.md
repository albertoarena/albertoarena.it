---
title: "Introducing Codemetry"
date: "2025-02-07T14:00:00.000Z"
template: "post"
draft: false
slug: "introducing-codemetry"
category: "Open Source"
tags:
  - "Laravel"
  - "PHP"
  - "Git"
  - "Code Quality"
description: "A Git repository analysis tool that converts version control history into quality metrics."
---

I'm excited to introduce [Codemetry](https://albertoarena.github.io/codemetry/), a new open-source project I've been working on.

## What is Codemetry?

Codemetry is a Git repository analysis tool that converts your version control history into meaningful quality metrics. It generates a daily quality indicator (good/medium/bad) that helps teams understand code quality trends through measurable data rather than guesswork.

## How it works

Codemetry examines your Git history and detects patterns that often correlate with code quality:

- **Code churn**: The volume of changes in a given period
- **File scatter**: How modifications are distributed across files
- **Follow-up fixes**: Rapid patches after commits, which can indicate rushed or problematic work
- **Commit patterns**: Signals about development workflow

Each day's metrics are compared against your project's historical baseline. This means "high churn" is contextual to your specific repository, not an arbitrary threshold.

## Key features

- **Baseline comparison** for normalised insights specific to your project
- **Follow-up fix detection** to identify potentially rushed work
- **Optional AI summaries** that explain what the metrics mean
- **Laravel-first** with native Artisan command support
- **Privacy-focused**: Runs entirely locally with no code uploads; AI features are opt-in

## Benefits

Codemetry helps you identify periods in your codebase that might need closer review. Instead of relying on gut feeling, you get data-driven insights. It's particularly useful for:

- Spotting risky periods before they become technical debt
- Understanding the rhythm of your development process
- Making informed decisions about when to schedule code reviews

## Built with AI

Codemetry was fully implemented using an AI coding agent, based on my original idea and requirements. It's a practical example of how AI can accelerate the development of useful tools when guided by clear human intent.

## Get started

Check out the [GitHub repository](https://github.com/albertoarena/codemetry) and the [documentation](https://albertoarena.github.io/codemetry/) to get started.

```bash
composer require albertoarena/codemetry
php artisan codemetry:analyze --days=7
```

I'd love to hear your feedback!
