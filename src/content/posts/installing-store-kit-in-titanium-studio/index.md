---
title: "Installing Store Kit in Titanium Studio"
date: "2014-11-18T13:12:03.284Z"
template: "post"
draft: false
slug: "installing-store-kit-in-titanium-studio"
category: "Titanium"
tags:
  - "iOs"
  - "Titanium"
  - "gitTio"
description: "A brief tutorial about how to install Store Kit module in Titanium Studio with gitTio."
---

Notwithstanding I'm a full-stack Web developer and despite I **don't** develop for mobile, I was asked to upgrade a
legacy
iPhone app so that it worked with the latest version of Titanium SDK on iOS. I was scared! But I have to admit that I
was surprised to be able to do it.

One of the challenges I had to face was to convert the existing paid app into a
_["Freemium"](https://en.wikipedia.org/wiki/Freemium)_ one, so that the user is free to try, but can pay for something
more. The concept is to provide the full content to paying users, and a preview to people that want only to try it. To
do this, I needed to interface with the InAppPurchase (IAP) stuff on ITunes.

And here it comes the [Store Kit module](https://github.com/tidev/ti.storekit) (ti.storekit). It is a very interesting
extension, that allows interfacing with your iTunes account and that can manage purchases etc., but I had a very big
challenge: **I wasn't able to install it!**

Well, someone would say, it's a simple thing, dude! Probably it is, if you are an iOS/Android developer. The reality is
that the documentation I found was confused and contradictory, and it took two days to make it work on my MacBook.
Somewhere I was suggesting to install Store Kit manually, and somewhere else I found different approaches that didn't
work.

But here you get the best (and quick!) solution I found, that is, **leave gitTio to do the dirty job!**

## What is gitTio?

In few words, **gitTio** is a cool piece of software. It is basically a search engine for Titanium modules that runs
from terminal. You install it using [NPM](https://www.npmjs.com/), the package manager for Node.js:

```
[sudo] npm install -g gittio
```

## Installing Store Kit

Once you've installed **gitTio**, if your `tiapp.xml` already references some modules, you can simply go to your project folder and run from terminal:

```
~/myproject $ gittio install -g
```

This will install all the modules referenced.

Or you can simply install the Store Kit module:

```
~/myproject $ gittio install ti.storekit
```

Et voilà, Store Kit now will be working in your app!

## Reference

Install Store Kit with gitTio: [http://gitt.io/component/ti.storekit](http://gitt.io/component/ti.storekit)
