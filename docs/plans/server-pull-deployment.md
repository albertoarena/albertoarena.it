# Migration plan: server-pull deployment (supersedes the SSH/SCP plan)

**Status: finalized — blocked on hosting migration (Phase 0), not started**

## TL;DR

`docs/plans/ftp-to-git-deployment.md` designed an SSH/SCP + symlink release
pipeline to replace the failing FTP deploy. It's fully specced but has been
blocked for weeks on upgrading the Netsons hosting plan, because the current
plan (Hosting Web 10) doesn't support SSH.

There's a better model: **server-pull**. CI never connects to the server at
all. Instead:

1. CI builds and force-pushes the static output to a `deploy` branch on GitHub.
2. A cron job **on the server** pulls that branch over outbound HTTPS on a
   schedule and swaps it in via an atomic symlink flip — the same
   release/rollback model the SSH plan already designed, just triggered from
   the other direction.

The server initiates every connection; nothing connects inward, so it
sidesteps inbound-SSH/FTP flakiness entirely. This pattern is already proven
in production for another Astro site I maintain, on a Netsons account that
does support cron.

**Recommendation:** adopt this model instead of finishing the SSH plan — but
see Phase 0 below, since it needs infrastructure the current hosting plan
doesn't have.

## Why the current plan (Hosting Web 10) can't run *either* pipeline

Checked directly: Web 10 has **no SSH** (blocking the old plan) **and no cron
jobs** (blocking server-pull too). Neither approach is deployable on the
current hosting, full stop — this isn't just a matter of picking the better
architecture, the current plan lacks the primitives both designs need.

The path forward: move `albertoarena.it` onto the same Netsons account/server
already running the other project's cron-based pull deploy (confirmed to
support cron, git, and outbound HTTPS), as an addon domain, after downgrading
the current account from full hosting to domain-only. That migration is
**Phase 0** — separate from, and a prerequisite for, everything below. It's
the user's to drive (DNS, avoiding data loss on the existing account, timing
the downgrade), not something to script here.

## Proposed architecture

```
push to `main`
      │
      ▼
CI (.github/workflows/publish.yml): build → force-push dist/ to `deploy` branch
      │
      ▼
`deploy` branch = built static site (no source, no history — force-pushed each time)
      │
      ▼  on a schedule, cron on the host
scripts/server-deploy.sh: git fetch `deploy` over HTTPS
      │
      ▼
~/public_html/releases/<timestamp>/  (fresh, from `git archive`)
current -> releases/<timestamp>       (atomic symlink flip)
      │
      ▼
Apache serves through ~/public_html/.htaccess (rewrites all traffic to current/)
```

**`.github/workflows/publish.yml`**, the whole deploy step:

```yaml
- name: Publish dist to the deploy branch
  run: |
    cd dist
    git init -q
    git checkout -q -b deploy
    git add -A
    git -c user.email=actions@github.com -c user.name="github-actions[bot]" \
      commit -q -m "build: ${GITHUB_SHA}"
    git push -q --force "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" deploy
  env:
    GITHUB_TOKEN: ${{ github.token }}
```

No secrets beyond the built-in `github.token` — it's pushing to the *same*
repo, just a different branch. (`albertoarena.it` is a public repo, so this
works with zero extra credentials, same as today.)

**`scripts/server-deploy.sh`**, the pull+activate step:

```bash
#!/bin/bash
set -euo pipefail
export PATH="/usr/local/cpanel/3rdparty/lib/path-bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

BASE="${1:-$HOME/public_html}"
REPO="https://github.com/albertoarena/albertoarena.it.git"
BRANCH="deploy"
SRC="$BASE/.deploy-src"
STAMP="$BASE/.deployed-sha"

mkdir -p "$BASE"

if [ ! -d "$SRC/.git" ]; then
  git clone --branch "$BRANCH" --single-branch --depth 1 "$REPO" "$SRC"
else
  git -C "$SRC" fetch --depth 1 --force origin "$BRANCH"
fi

NEW="$(git -C "$SRC" rev-parse "origin/$BRANCH")"
OLD="$(cat "$STAMP" 2>/dev/null || echo none)"
if [ "$NEW" = "$OLD" ]; then
  echo "up to date ($NEW)"
  exit 0
fi

TS="$(date -u +%Y%m%d%H%M%S)"
mkdir -p "$BASE/releases/$TS"
git -C "$SRC" archive "origin/$BRANCH" | tar -x -C "$BASE/releases/$TS"
ln -sfn "releases/$TS" "$BASE/current"
( cd "$BASE/releases" && ls -1t | tail -n +4 | xargs -r rm -rf ) || true
echo "$NEW" > "$STAMP"
echo "deployed release $TS from $NEW"
```

Cron, on the host (cadence to be set once on the target account — every 5
minutes is a reasonable default, matching the reference implementation):

```
*/5 * * * * /bin/bash $HOME/bin/albertoarena-it-server-deploy.sh >> $HOME/albertoarena-it-server-deploy.log 2>&1
```

**`.htaccess`** at the docroot — identical to what the SSH plan already
designed, unchanged:

```apache
Options +FollowSymLinks -Indexes
RewriteEngine On
RewriteRule ^releases(/.*)?$ - [F,L]
RewriteCond %{REQUEST_URI} !^/current/
RewriteRule ^(.*)$ current/$1 [L]
```

## Why this beats finishing the SSH plan

| | SSH/SCP plan (blocked) | Server-pull (this plan) |
|---|---|---|
| Direction of connection | CI → Netsons (inbound) | Netsons → GitHub (outbound) |
| Requires SSH | Yes | No |
| Requires cron on host | No | Yes — Web 10 doesn't have it, target account does |
| Secrets needed | `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` | None |
| Release/symlink model | Yes | Yes — same pattern |
| Rollback | Repoint symlink via SSH | Repoint symlink (needs one-off shell access — see Operations below) |
| Deploy latency | Immediate (CI-driven) | Up to one cron cycle (~5 min) |
| Proven anywhere | No (never implemented) | Yes — running today for another project on the target account |
| Works on current hosting | No | No — both need Phase 0 |

The real tradeoffs versus the SSH plan: deploy latency (a push isn't live
instantly), and losing the CI-blocking "is the live site actually up" check
since CI no longer touches the server. Both addressed below.

## Adapting for albertoarena.it specifically

- **Docroot**: `albertoarena.it` will land as an **addon domain** on the
  target account rather than a main domain, so cPanel may allow pointing the
  docroot straight at `current/` without the `.htaccess` rewrite layer.
  Recommendation: use the `.htaccess`-rewrite technique anyway (as shown
  above) rather than relying on the addon-domain docroot setting — it's
  proven, and keeps the setup identical regardless of how the domain is
  wired in cPanel.
- **Namespacing**: since this lands on an account that already runs another
  project's cron-based pull deploy, the script filename, log file, and cron
  entry all need project-specific names to avoid collision —
  `~/bin/albertoarena-it-server-deploy.sh`,
  `~/albertoarena-it-server-deploy.log`, as used above. The releases
  directory itself doesn't need namespacing since it lives under this
  project's own docroot.
- **Verification step**: the current FTP workflow's "Verify deployment
  success" (HTTP + title check, fails the CI run on mismatch) can't work the
  same way — CI finishes before the cron job has necessarily run.
  Recommendation: drop it from CI (matches the proven reference — rely on the
  server's deploy log plus an occasional manual `curl` spot-check instead).
  A non-blocking delayed check (a second scheduled workflow that curls the
  site ~10 minutes after push and just notifies on mismatch, without failing
  the build) is a reasonable follow-up if silent failures become a problem,
  not needed for the initial migration.
- **Rollup pin**: the current FTP workflow carries a `rollup@4.22.4` +
  `@rollup/rollup-linux-x64-gnu --force` workaround. Worth testing without it
  once the new pipeline is stable, but as a separate change — don't bundle it
  into the deploy migration itself.

## Phase 0 — hosting migration (separate, user-driven, prerequisite)

Not detailed here — this is infrastructure work the user is handling
directly (downgrading the current Netsons account from Hosting Web 10 to
domain-only without losing anything on it, then adding `albertoarena.it` as
an addon domain on the target account, then repointing DNS). Everything below
assumes Phase 0 is complete.

## Phase 1 — deploy pipeline (once Phase 0 lands)

1. Add `.github/workflows/publish.yml` (per above), keep `test.yml` as-is.
2. Add `scripts/server-deploy.sh` (per above).
3. Set up the cron entry on the target account via cPanel's **Cron Jobs** UI.
4. Use cPanel **File Manager** (or SSH, if the target account has it) to
   write the root `.htaccess` at the new docroot.
5. Trigger the cron entry once manually to bootstrap `releases/` and
   `current` — verify `https://albertoarena.it/` still loads correctly
   throughout (the rewrite is transparent, so this should be zero-downtime).
6. Push a trivial change to `main`, confirm the `deploy` branch updates, wait
   for the next cron tick, confirm the release directory and symlink update.
7. Once confirmed stable over a few real deploys, delete the old
   `deploy.yml` FTP workflow and remove `FTP_HOST`/`FTP_USER`/`FTP_PASS`/
   `FTP_PORT` secrets.
8. Move both `ftp-to-git-deployment.md` and this plan to
   `docs/plans/completed/` once live (per this repo's existing convention).
9. Update the `project-deployment-migration` memory: the SSH-upgrade blocker
   is gone, replaced by the Phase 0 hosting-migration dependency (and once
   Phase 0 lands, that too is resolved).

## What this plan deliberately doesn't do

- Doesn't touch the *current* hosting plan or attempt to make either pipeline
  work on Web 10 — confirmed impossible (no SSH, no cron), so Phase 0 is
  required no matter which deploy architecture is chosen.
- Doesn't script or detail the Phase 0 hosting migration itself — that's
  explicitly separate, user-owned work.
- Doesn't extract a shared/reusable deploy-tool across projects, even though
  that's a natural longer-term idea once two projects run the identical
  pattern on the same account. Ship the self-contained version here first.
