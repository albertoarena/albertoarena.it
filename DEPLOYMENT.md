# Deployment

`albertoarena.it` deploys with a **server-pull** model: CI never connects to
the host. CI publishes the built site to a branch, and the server pulls it
over HTTPS. This avoids inbound-FTP flakiness (see
`docs/plans/completed/server-pull-deployment.md` for the full migration
writeup), and each pull is a clean release (no stale-file buildup, rollback
is a symlink flip). Mirrors the same setup already proven for
`trussphp.com` on the same Netsons account.

## Pipeline

```
push to `master`
      │
      ▼
CI (.github/workflows/publish.yml): build → force-push static site to `deploy` branch
      │
      ▼
`deploy` branch = the built dist/ (static assets only, no source)
      │
      ▼  every ~5 min, cron on the host
scripts/server-deploy.sh: git fetch `deploy` over HTTPS
      │
      ▼
~/albertoarena.it/releases/<timestamp>/  (fresh)  +  current -> releases/<timestamp>  (atomic)
      │
      ▼
Apache serves through ~/albertoarena.it/.htaccess (rewrites all traffic to current/)
```

**Normal deploy: just push to `master`.** The site updates within ~5
minutes, no manual step.

## Components

| Piece | Location |
|---|---|
| Build + publish | `.github/workflows/publish.yml` (push to `master` + manual dispatch) |
| Built output | `deploy` branch (force-pushed each build) |
| Server pull script | `scripts/server-deploy.sh` (source of truth in this repo) |
| Running copy on host | `~/bin/albertoarena-it-server-deploy.sh` (fetched from this repo) |
| Cron (host) | `*/5 * * * * /bin/bash $HOME/bin/albertoarena-it-server-deploy.sh >> $HOME/albertoarena-it-server-deploy.log 2>&1` |
| Docroot | `~/albertoarena.it/` with an `.htaccess` that rewrites all traffic to `current/` |
| Docroot `.htaccess` template | `scripts/docroot.htaccess` (source of truth in this repo; **not** auto-deployed — see below) |
| Releases + symlink | `~/albertoarena.it/releases/<ts>/`, `~/albertoarena.it/current` |
| Block direct `current/`/`releases/<ts>/` access | `public/.htaccess` → deployed into every release automatically (see below) |
| Working git clone (deploy state) | `~/.albertoarena-deploy/` — **outside** the docroot, not web-reachable |

### Deploy state lives outside the docroot

`server-deploy.sh`'s working git clone and SHA stamp used to live at
`~/albertoarena.it/.deploy-src` — inside the docroot. That path was
reachable over HTTP and served a complete second copy of the site: the
docroot rewrite that routes traffic into `current/` doesn't catch it, and a
dot prefix isn't protection (found live 2026-08-16, on a sibling site
copying this same pattern). State now lives at `~/.albertoarena-deploy/`,
outside the docroot entirely, so there's no path that can serve it
regardless of `.htaccess` behavior. Don't move it back into the docroot
when reusing this pattern elsewhere.

### Docroot `.htaccess` is hand-maintained, and doesn't reliably run custom rules

The docroot `.htaccess` is **not** part of the build or the pull-deploy
pipeline — CI only ever publishes into `releases/<ts>/`, one level below
the docroot. `scripts/docroot.htaccess` in this repo mirrors it; changes
must be copied to `~/albertoarena.it/.htaccess` on the host by hand (cPanel
File Manager or SSH).

Its "Force HTTPS" block is owned by cPanel's own **Domains → Redirects**
feature (recognizable by its quoted, backslash-escaped destination) — leave
it alone, it's managed outside this repo. **Custom `RewriteRule`s added
elsewhere in this same file were tested extensively (2026-08-13) and never
fired for any of several independent conditions/patterns**, while the
cPanel-owned rule fired immediately — so something about this account's
`AllowOverride` scope or cPanel's management of the file prevents
hand-added rules here from taking effect reliably. Don't rely on this file
for anything beyond what cPanel itself manages.

### Blocking direct access to `current/`/`releases/<ts>/`

Because the docroot `.htaccess` can't be trusted for custom rules, this is
instead handled in `public/.htaccess` — a file this repo already controls
and that ships into every release automatically via the normal build/pull
pipeline, no server-side hand-editing required. It redirects (301) any
direct hit on `current/...` or `releases/<ts>/...` to the equivalent
canonical `https://albertoarena.it/...` URL, using `%{THE_REQUEST}` (the
client's original request line, unaffected by the docroot's internal
`current/` rewrite) to distinguish a direct hit from a normal page view
that was internally routed through `current/`. See the comments in
`public/.htaccess` for the full explanation. Reuse the same technique,
relocated to whatever the equivalent auto-deployed `.htaccess` is, when
setting up this releases/current mechanism on another Astro site — don't
depend on a hand-maintained docroot `.htaccess` for it.

The script/log/cron entry names are namespaced (`albertoarena-it-`) because
the target account already runs another project's cron-based pull deploy —
see `docs/plans/completed/server-pull-deployment.md`.

## Operations

**Deploy immediately (skip the cron wait)** — on the host:
```
bash ~/bin/albertoarena-it-server-deploy.sh
```
If CI hasn't published yet, run Actions → **Publish** → Run workflow first.

**Update the server script** — edit `scripts/server-deploy.sh`, commit, then
on the host:
```
curl -fsSL https://raw.githubusercontent.com/albertoarena/albertoarena.it/master/scripts/server-deploy.sh -o ~/bin/albertoarena-it-server-deploy.sh
chmod +x ~/bin/albertoarena-it-server-deploy.sh
```

**Rollback** — point `current` at a previous release (pause the cron to
hold it, otherwise the next run rolls forward to the latest `deploy`
commit):
```
ls -1t ~/albertoarena.it/releases
ln -sfn releases/<previous-ts> ~/albertoarena.it/current
```

**Manual full deploy (fallback if CI is down)** — build locally
(`npm run build`), upload `dist/` into a new
`~/albertoarena.it/releases/<ts>/`, and repoint `current`.

## Troubleshooting

- Log: `tail -n 50 ~/albertoarena-it-server-deploy.log`
- Run by hand: `bash ~/bin/albertoarena-it-server-deploy.sh` →
  `deployed release <ts> …` or `up to date (<sha>)`.
- `up to date` means the `deploy` branch has no new commit; check the
  Publish workflow ran green.
- `git: command not found` in cron is a PATH issue; the script prepends the
  host's git path. Adjust the `export PATH=...` line if git lives elsewhere.
- Verify live: `curl -sI https://albertoarena.it/` for a `200`, or check
  `~/.albertoarena-deploy/deployed-sha` against the latest `deploy` branch
  commit on GitHub.

## Notes

- The server-pull needs **no secrets** (public repo, outbound HTTPS).
- The legacy FTP pipeline (`deploy.yml`) and its `FTP_*` secrets were
  removed 2026-08-12 once this setup was confirmed live — see
  `docs/plans/completed/server-pull-deployment.md`.
