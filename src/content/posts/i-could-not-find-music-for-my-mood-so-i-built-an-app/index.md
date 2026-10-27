---
title: "I could not find music for my mood, so I built an app"
date: "2026-10-27T13:00:00.000Z"
template: "post"
draft: false
slug: "i-could-not-find-music-for-my-mood-so-i-built-an-app"
category: "Open Source"
tags:
  - "Sudo Play"
  - "Laravel"
  - "NativePHP"
  - "Open Source"
description: "Why I built Sudo Play, a small open source Mac app that picks a Spotify playlist for your coding mood, and how you can add your own."
socialImage: "/images/posts/i-could-not-find-music-for-my-mood-so-i-built-an-app/cover.jpg"
coverAlt: "The Sudo Play window on a dark background, next to the command sudo play --mood flow-state"
---

I code with music almost every day. And every day I lose time on the same small problem: I cannot find a good playlist for how I feel. Spotify has a lot of playlists, but the search results are not made for a developer on a Monday morning, or for someone who is about to deploy on a Friday afternoon. I would scroll, try three playlists, and then pick one I already knew. So I built my own tool to do it for me.

## What it does

The app is called [Sudo Play](https://sudoplay.dev/?utm_source=albertoarena&utm_medium=referral&utm_campaign=sudo-play). It lives in the Mac menu bar. You open it, pick a genre like jazz or lo-fi, and then pick a mood. The moods are made for developers: Coffee Needed, Blue Monday, Flow State, Debugging, Friday Deploy, and a few more. You press Play and the playlist opens in Spotify.

The pick is the same all day for everyone who chooses the same genre and mood, and tomorrow it changes. If you do not like the pick, you press Next. If you cannot decide, you press Surprise me. The window also shows your choice as a command, like `sudo play --genre jazz --mood flow-state`. That is only a joke for developers, because there is nothing to run in a terminal.

## How I built it

I built it with Laravel and NativePHP, which lets you make a desktop app with PHP. I also used the project to try Claude Code in the cloud, and I wrote about that in [another post](/posts/what-i-learned-from-my-first-claude-code-cloud-sessions/). NativePHP works well for me.

## The day the app stopped

On 21 October the app stopped working. The window was open and the notifications still came, but every click did nothing. Inside the app, a PHP server shows the window, and that server had been killed from the outside. Nothing started it again, so the app looked alive when it was not.

I did not want users to see this, so I made two changes. The app now restarts the server by itself, within a few seconds. If it cannot, it tells you to quit and open it again, instead of showing a button that does nothing. I tested it on my Mac by killing the server many times, and then I left a test version running overnight. The fix is in version 1.0.3, so if you already have the app, please update to [1.0.3](https://github.com/albertoarena/sudo-play/releases/tag/v1.0.3). The details are in [this pull request](https://github.com/albertoarena/sudo-play/pull/49).

## The launch

I put Sudo Play on Product Hunt on 26 October. I cannot say yet how it went, because the first day was quiet. What I got were several emails from people selling things, like paid upvotes. I ignored all of them. I want the votes, if they come, to come from people who tried the app.

## Help me add more playlists

I use Sudo Play every day, and I want more playlists and more moods. It is open source, so it can be more than my own taste in music. I cannot do it alone, and your taste is different from mine. The app is free and works on Macs with Apple silicon. You can [download it here](https://sudoplay.dev/?utm_source=albertoarena&utm_medium=referral&utm_campaign=sudo-play), and if you know a playlist that makes you code better, I would like to hear it. You can help in a few ways:

- Add a playlist. The catalog is one file, and a new playlist is a few lines and a pull request. A bot checks it for you.
- Suggest a mood. Tell me about a moment in the developer day that has no playlist yet.
- Try the app and tell me what breaks. Open an issue on [GitHub](https://github.com/albertoarena/sudo-play).
