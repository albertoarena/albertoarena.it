# Plan: push latest posts into the profile README from this repo's deploy CI

**Status:** Completed — merged and deployed (PR #16), `PROFILE_README_TOKEN`
in place, verified working in CI. The one remaining step — retiring the old
pull-based workflow in the profile repo (see "After it works" below) — lives
in that repo, not this one, and isn't tracked here.
**Target repo:** `albertoarena/albertoarena` (profile repo), `README.md`
**Moved from:** `albertoarena/albertoarena`'s `docs/blog-push-handoff.md`,
which now just points here. This plan lives in this repo because all the
work happens in this repo's CI, not the profile repo's.

## Why

The profile repo currently *pulls* the feed on a schedule from a GitHub
Actions runner. Those runners hit `albertoarena.it` from Azure IP ranges,
which the site intermittently blackholes, so the job times out (`Request
timed out after 60000ms`, 0 posts fetched). Full diagnosis in the profile
repo's `docs/blog-workflow-feed-timeouts.md`.

Instead of pulling, **this repo's deploy CI pushes** the latest 5 posts into
the profile README after each successful deploy. The build already has the
post data locally (`dist/rss.xml`), so there is no network call to
`albertoarena.it` and no Azure-IP problem, the only network calls this step
makes are to `github.com`, checkout and push.

## What must land in the profile README

Rewrite the block between these two markers in the profile repo's
`README.md`, and nothing else in the file:

```
<!-- BLOG-POST-LIST:START -->
- Aug 5, 2026 · [I built a Laravel event-sourcing generator, then the AI version](https://albertoarena.it/posts/generator-vs-ai-skill/)
- Aug 3, 2026 · [I gave my schema viewer your app's colours](https://albertoarena.it/posts/gave-my-schema-viewer-your-app-colours/)
- Aug 1, 2026 · [We Became Editors-in-Chief, and Nobody Trained Us](https://albertoarena.it/posts/we-became-editors-in-chief/)
- Jul 31, 2026 · [The schema doctor is in](https://albertoarena.it/posts/the-schema-doctor-is-in/)
- Jul 27, 2026 · [CLAUDE.md ...](https://albertoarena.it/posts/claude-md-skills-are-not-disk/)<!-- BLOG-POST-LIST:END -->
```

Exact format rules (must match to avoid a noisy diff against the existing
pull-based history):

- 5 most recent posts, newest first.
- Each line: `- <date> · [<title>](<url>)`. Separator is a middle dot `·`
  (U+00B7), not a hyphen.
- Date format `mmm d, yyyy` -> `Aug 5, 2026`. No leading zero on the day.
- Newline right after `...START -->`; the first item is on its own line.
- `<!-- BLOG-POST-LIST:END -->` is appended directly to the last item's
  line, no trailing newline before it.
- Commit message: `chore: update latest blog posts` (matches existing
  history in the profile repo).

## Corrections made to the original spec

The original handoff doc (written from the profile repo, without checking
this repo's actual build output or workflow) got three things slightly
wrong. Verified against the real repo before implementing:

1. **`RSS_PATH` default.** The original script defaulted to
   `public/rss.xml`. This project's Astro output directory is `dist/`
   (confirmed: no `outDir` override in `astro.config.mjs`, and the actual
   build writes `dist/rss.xml`). `public/` is the source static-assets
   folder, not a build output.
2. **CI job shape.** The original example assumed a separate `build` job
   with `needs: build` and an artifact hand-off. This repo's
   `.github/workflows/deploy.yml` is a single `build-and-deploy` job, build
   and FTP-deploy happen in the same job. The push step is just another
   step appended to that job, after the existing "Verify deployment
   success" step, so it only runs once the live site is confirmed up, and a
   genuine deploy failure blocks it instead of the README updating for a
   deploy that didn't ship.
3. **`fast-xml-parser` wasn't a dependency.** Confirmed necessary by
   inspecting the real `dist/rss.xml`: titles/descriptions contain XML
   entities (`&apos;` etc.) that a naive regex would mangle. Added as a
   `devDependency` (lockfile-pinned) rather than an ad-hoc `npm i` inside
   the CI step.

## Non-issue worth noting

Neither this mechanism nor the site itself gates on the post's `date`
frontmatter, `draft: false` plus any date goes live the moment it deploys
to `master`. This step faithfully mirrors whatever's live at deploy time,
same as the site's own RSS feed and homepage already do. It introduces no
new leak risk; publish timing is controlled entirely by when a post lands
on `master`, not by its `date` field.

## Generator script

`scripts/update-profile-readme.mjs`, see the file for the implementation.
Reads the locally built `dist/rss.xml` and rewrites the checked-out profile
README.

## CI step

Appended to `build-and-deploy` in `.github/workflows/deploy.yml`, after
deploy verification. See that file for the implementation.

## Token (the one manual setup step, not done by Claude)

The blog CI needs write access to the profile repo:

1. Create a **fine-grained PAT** scoped to only `albertoarena/albertoarena`,
   permission **Contents: Read and write**.
2. Add it to this repo (`albertoarena.it`) as an Actions secret named
   `PROFILE_README_TOKEN`.

Until that secret exists, the new step will fail on `master`. Don't merge
this branch until the secret is in place.

## After it works: retire the pull side (in the profile repo)

Once a deploy has successfully updated the profile README:

- **Delete** `.github/workflows/blog-posts.yml` in the profile repo, or
- Remove its `schedule:` trigger and keep `workflow_dispatch` as a manual
  fallback (manual runs still hit the same Azure block, so it's a fallback
  in name only).
