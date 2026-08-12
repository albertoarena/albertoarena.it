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
| Releases + symlink | `~/albertoarena.it/releases/<ts>/`, `~/albertoarena.it/current` |

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
  `~/.deployed-sha` under the docroot against the latest `deploy` branch
  commit on GitHub.

## Notes

- The server-pull needs **no secrets** (public repo, outbound HTTPS).
- The legacy FTP pipeline (`deploy.yml`) and its `FTP_*` secrets were
  removed 2026-08-12 once this setup was confirmed live — see
  `docs/plans/completed/server-pull-deployment.md`.
