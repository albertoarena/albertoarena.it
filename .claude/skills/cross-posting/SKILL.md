---
name: cross-posting
description: Formatting quirks and checklist for cross-posting an albertoarena.it blog post to dev.to or Medium (cover image upload, canonical URL, topics). Use when cross-posting a post to either platform.
---

## dev.to

- dev.to's cover image field does not accept an external URL (hotlinked image)
  — it silently fails to render. It must be a fresh manual upload through the
  editor's "Upload Cover Image" button every time, even when cross-posting a
  post whose cover already exists at `albertoarena.it`.
- Same restriction applies to inline body images: a hotlinked image (SVG or
  otherwise) won't render, so any image referenced in the post body needs the
  same manual upload treatment.
- Set the canonical URL via Advanced Options to
  `https://albertoarena.it/posts/<slug>/` so dev.to doesn't compete with the
  original for search ranking.

## Medium

- Setting the story's topics (the tag pills shown just above the byline,
  e.g. Programming / PHP / Software Development) does not always work
  reliably through browser automation (claude-in-chrome) — the click
  sometimes doesn't register. Verify the topics actually got applied after
  setting them, or leave that step for the user to do manually.
