## Checklist: bumping the Truss version shown on the site

`introducing-truss/index.md` (and its `it.md` translation) carries a running
`## Notes` changelog of every Truss release, independent of the version
badge in `TrussPromo.astro`. Bumping one without the other leaves the badge
and the changelog out of sync — every release gets an entry here, not just
ones that add a detection rule. See precedent commit `dd8262eb` (v1.11.0).

- [ ] Refresh `src/data/project-stats.json`: run
      `npm run projects:fetch-stats` first; if Packagist is still lagging
      the new tag, hand-edit the `albertoarena/laravel-truss.version` field
      instead (note this in the commit message, as `dd8262eb` did)
- [ ] Update the fallback string in `TrussPromo.astro`
      (`?? "v1.x.y"`) to match, so a missing/stale stats file still shows
      the current version
- [ ] Read the actual release notes
      (`https://github.com/albertoarena/laravel-truss/releases/tag/vX.Y.Z`)
      rather than assuming the diff from the version number — don't skip
      this step for a release that looks like "just a bugfix"
- [ ] Add one line to `introducing-truss/index.md`'s `## Notes` section,
      appended at the end (oldest first): `On <Month Day, Year>, Truss
      reached vX.Y.Z, <what changed>. See the [release
      notes](.../releases/tag/vX.Y.Z).` — matches `updating-posts.md`'s
      format, but for this post it's mandatory on every Truss release, not
      conditional on "substantive"
- [ ] Add the matching Italian line to `introducing-truss/it.md`'s `## Note`
      section, same position
- [ ] Direct commit to master is fine (version bump), per
      `publishing-workflow.md`
