---
title: "PHP is not dead. Here is what people shipped."
date: "2026-10-19T11:17:00.000Z"
template: "post"
draft: false
slug: "php-is-not-dead-here-is-what-people-shipped"
category: "PHP"
tags:
  - "PHP"
  - "Community"
  - "Laravel"
description: "Every few months someone writes that PHP is dead. After years in languages that most developers stopped talking about, here is how I check that claim: with installs, release dates and a community that is still shipping."
socialImage: "/images/posts/php-is-not-dead-here-is-what-people-shipped/cover.jpg"
coverAlt: "A herd of African elephants walking towards the camera along a dirt road, with a calf at the left edge"
---

Every few months, somebody writes the obituary for PHP again. Sometimes it is Laravel instead. I read these posts, I close the tab, and a week later I read another one.

I have a reason to take the word "dead" seriously. My first program was on a Commodore 64 in 1985, a small thing that drew the planets of the solar system as sprites. After that came C and C++, then Clipper and Delphi, and nine years of building data-entry and OCR software with Borland tools. I have spent a lot of my career in tools that were popular once and that most developers do not talk about now. So when someone says a language is dead, I want to know what they mean by it.

## What dead looks like to me

Here is the test I use. In a living language, people ship new things. Existing tools keep getting new major versions. New developers arrive and ask questions, and the community argues about what comes next. When a language is dead, those things stop. Old code stays readable and old manuals stay online, but nobody starts something new with it.

Delphi is a fair example. Embarcadero still maintains it, so I will not say that nobody uses it. But on social media I never see anyone talking about something new they built with Delphi. That is my idea of dead: the new work goes somewhere else, and you stop hearing about it.

This post is not against Rust or Go. I do not use Rust. I understand why people are excited about it, and some developers say it is better than PHP. That is a fair opinion. Now I can ask the same question about PHP, and I can answer it with numbers instead of mood.

## What the numbers say

Between 20 April and 17 October 2026, Laravel's framework package was [installed more than 80 million times on Packagist](https://packagist.org/packages/laravel/framework/stats). Installs count every `composer install`, including CI runs, so I read the figure as a measure of activity. It tells me that a lot of PHP code is being built and rebuilt every day.

Pest 5 came out on 28 July, built on PHP 8.4 and PHPUnit 13. The testing framework had [about 34 million installs](https://packagist.org/packages/pestphp/pest/stats) in the same window. That is not what a dead language looks like.

The Laravel AI SDK gives you one API for many AI providers. Its first release came out in February, and version 1.0 followed on 23 September. It had [about 9.8 million installs](https://packagist.org/packages/laravel/ai/stats) in the same window. So new work is still happening in PHP, including the newest kind.

## A list of things people shipped

I wanted more than a few big names, so I started [phplives.dev](https://phplives.dev). It is a list of real things people shipped with PHP in the last six months. Each entry links to its source and shows the date it shipped. There are no opinions on it and no benchmark wars.

The small projects surprised me. I expected to know most of them. I did not. [Qbix Server](https://github.com/Qbix/webserver) is a web server written in pure PHP. It replaces nginx and PHP-FPM with one process that serves static files, PHP scripts and WebSockets. [Sloppy](https://github.com/Heyosseus/sloppy) is a static analyser that finds the debt AI agents leave in PHP code, such as god methods and N+1 queries. It runs locally, with no model inside it. I had never heard of either one, and I think both are very cool. Good PHP projects are being built, and many of them get little attention.

## Where the community lives

On 16 October I joined [dev/null](https://dev-null.sh), a social network for developers. Its code is on GitHub under Nuno Maduro's account, and it is a Laravel app. People post what they are working on, and others reply within minutes. From what I see, people there like PHP, and nobody tells you it is dead.

There is also Tom, a small helper bot that welcomes new people. When I wanted a feature, I typed `/feature`. It opened a real GitHub issue on the project, [#540](https://github.com/nunomaduro/dev-null.sh/issues/540). After a few days on dev/null and a lot of time with this list, I see a PHP community that is busy and still shipping.

## What you can do

- When you find a good PHP package, say so in public. A short post is enough.
- Star the repos you use. It costs nothing and it helps other people find them.
- Try something new from a PHP developer you do not know yet.
- If you shipped something with PHP recently, tell me on [dev/null](https://dev-null.sh/@albertoarena). It might belong on [phplives.dev](https://phplives.dev).

PHP lives! 🔥
