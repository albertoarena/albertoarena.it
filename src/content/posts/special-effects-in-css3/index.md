---
title: "Special effects in CSS3"
date: "2013-11-11T13:12:03.284Z"
template: "post"
draft: false
slug: "special-effects-in-css3"
category: "CSS"
tags:
  - "CSS"
description: "Some interesting effects that can be implemented in pure CSS3."
---

Cascading Style Sheet (CSS) is evolving, and especially from when level 3, know usually as CSS3, has been adopted by the
modern browsers, it's possible to create images, sprites and other "special effects" without the need of PNG files or
Javascript.

In this post, I'll list some interesting and inspiring applications of CSS3, in different contexts, showing how this
style language has reached a such expressiveness that was probably unpredictable when the CSS level 1 was published in
December 1996. I have seen a lot of nice examples, but most of them use some Javascript.

## Images

<figure class="float-right" style="width: 240px">
	<img src="/images/posts/special-effects-in-css3/css-simpsons.webp" alt="CSS Simpsons">
</figure>

I noticed this fresh and cool example of how images can be created in pure CSS3, developed by Christopher Pattle, a UK
developer: [The Simpons in CSS](https://pattle.github.io/simpsons-in-css/). This is a must-see!

I loved the way Christopher broke up the faces of the Simpsons heroes, and I found it impressively organised. E.g.
Marge's face is compound of 63 different DIV tags, while Ned's moustache is made with 7 DIV tags.

## Sprites

<figure class="float-right" style="width: 240px">
	<img src="/images/posts/special-effects-in-css3/css-sprites.webp" alt="CSS Sprites">
</figure>

Another cool technique is to create sprites in CSS3. An approach involves the combination of CSS `animation` plus the
experimental `@keyframes at-rule`, that controls the frames to be rendered at a certain point of animation.

This is a cool [sample on JsFiddle](https://jsfiddle.net/simurai/CGmCe/), that is easy to understand as its source code
is shown.

## Animated buttons

<figure class="float-right" style="width: 240px">
	<img src="/images/posts/special-effects-in-css3/css-animated-buttons.webp" alt="Animated buttons">
</figure>

Would you like your buttons to have animation in pure CSS, without any
Javascript? [See those buttons](https://tympanus.net/Tutorials/AnimatedButtons/index.html). In this case, when the mouse
is over the image is rescaled using the `transform` attribute.

I like the different effects, especially those in the Demo 1 and Demo 4 page. I think that this and other examples
available on the Internet can be easily implemented in your website.

## What else?

What can we expect? CSS3 is now mature, and it offers a lot of possible applications. Together with Javascript, now we
can have games that are played on different devices without any Flash. We can create complex typography effects using
web-fonts. We can have the effect
of [browsing the pages of a book](https://tympanus.net/Development/AnimatedBooks/index2.html) in pure CSS. What else?
Well, it depends only on our fantasy: the potential is tremendous!

## Read more

- [`@keyframes at-rule` on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes)
- [`transform` attribute on MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)
