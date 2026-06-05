---
title: "Your README Deserves Real Numbers"
description: "traffic-badge is a GitHub Action that pulls live view and clone counts from the official GitHub API and pins them as SVG badges directly in your README. No third-party servers, no guesses."
date: "2026-06-04T09:00:00.000Z"
template: "post"
draft: false
slug: "traffic-badge-github-action"
category: "Open Source"
tags:
  - "GitHub"
  - "GitHub Actions"
  - "Open Source"
  - "Developer Tools"
socialImage: "/images/posts/traffic-badge-github-action/cover.jpg"
---

![Your README Deserves Real Numbers](/images/posts/traffic-badge-github-action/cover.jpg)

If you maintain an open-source repo, you've probably wondered at some point how many people actually visit it. GitHub has the answer buried in the Insights tab, but nobody looks there. It resets after 14 days, there's no history, and your README, the thing everyone sees, tells them nothing.

I built [traffic-badge](https://github.com/marketplace/actions/traffic-badge) to fix that.

## What it does

It's a GitHub Action that runs on a schedule, hits the official GitHub Traffic API, and commits a live SVG badge to a dedicated branch in your repo. You embed that badge in your README once and it updates automatically from then on.

The badge shows whatever you care about: total views, unique visitors, clones, unique cloners. One workflow file per metric, or stack them all.

## Why it's different from the alternatives

A lot of traffic badge solutions rely on a third-party counting server. Which means you're trusting someone else's infrastructure, someone else's uptime, and someone else's definition of "a view." When that server goes down or changes its counting logic, your badge quietly becomes wrong.

`traffic-badge` doesn't phone home. The numbers come straight from GitHub's own API, the same data you'd see in your Insights tab. The raw JSON is committed to your repo under a `traffic-data` branch, so you can inspect every data point, diff it, delete it, whatever you want. Full transparency.

It also handles the awkward overlap problem. GitHub's Traffic API returns a rolling 14-day window, so if you run the action daily you'd normally double-count the days that appear in both runs. `traffic-badge` deduplicates by date automatically, so your cumulative totals stay accurate without any extra work on your end.

## Setting it up

Two steps. First, generate a personal access token with `repo` scope (classic) or `Administration: read` (fine-grained) and add it as a repository secret called `TRAFFIC_TOKEN`. The default `GITHUB_TOKEN` won't work here — the Traffic API requires elevated access and will return a 403 otherwise. Then add a workflow file:

```yaml
name: Traffic Badge
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  badge:
    runs-on: ubuntu-latest
    steps:
      - uses: albertoarena/github-traffic-badge@v1
        with:
          token: ${{ secrets.TRAFFIC_TOKEN }}
          metric: views
          color: blue
```

Run it once manually, then grab the badge URL it creates and drop it in your README:

```markdown
![Views](https://raw.githubusercontent.com/OWNER/REPO/traffic-data/badge.svg)
```

That's it. No server to maintain, no API key for a third-party service, no monthly bill. It runs on free GitHub-hosted runners.

## The options worth knowing

The `metric` field accepts `views`, `clones`, `views-unique`, and `clones-unique`. You can run multiple workflows with different metrics if you want to show both.

`color` takes any named colour or a hex value. `style` supports the standard shields.io styles: `flat`, `flat-square`, `plastic`, `for-the-badge`. And if your numbers get large enough that the badge looks cluttered, there's an `abbreviated` flag that turns `12345` into `12.3K`.

---

It's open source, MIT licensed, and available on the [GitHub Marketplace](https://github.com/marketplace/actions/traffic-badge). If you run into anything odd or have a feature request, issues are open.
