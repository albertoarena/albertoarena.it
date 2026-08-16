# Migration plan: server-pull deployment (supersedes the SSH/SCP plan)

**Status: Live (2026-08-12)** — DNS cutover, TLS cert, and email all
confirmed working on the new Netsons SSD 50 account. `deploy.yml` (FTP) and
its secrets removed same day. Remaining: cancel/downgrade the Hosting Web 10
plan before it renews on 2026-08-18 (domain-only going forward) — that part
is user-driven infra work, not tracked further here.

**Addendum (2026-08-16):** the `SRC="$BASE/.deploy-src"` layout below put
the working git clone inside the docroot, where it was reachable over HTTP
and served a full duplicate of the site. `server-deploy.sh` now keeps that
state at `~/.albertoarena-deploy/`, outside the docroot — see
`DEPLOYMENT.md`. The code block below is left as originally written for the
historical record; don't copy the `SRC`/`STAMP` lines from it verbatim.

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

## Phase 0 — hosting migration (2026-08-12 decisions)

**Target account confirmed**: the Netsons **SSD 50** shared-hosting account
that already runs `trussphp.com` (and other static sites) as addon domains —
the same account this plan's server-pull model was always designed against
as "the reference implementation," now the actual destination.

**Sequencing** (this order specifically, not hosting-downgrade-first):

1. ✅ **Done (2026-08-12)**: `albertoarena.it` added as an addon domain on
   the SSD 50 account. Confirmed docroot: `~/albertoarena.it/` — matches
   what `scripts/server-deploy.sh` and `DEPLOYMENT.md` already assumed, no
   changes needed there. Confirmed via cPanel's addon-domain list, which
   also shows a per-domain **Create Email** action — the target account
   does support mail hosting for addon domains (resolves the email
   question below).
2. Set up the deploy pipeline on the new SSD 50 account, while
   `albertoarena.it`'s DNS still points at the old Hosting Web 10 account —
   cron + `.htaccess` (see the copy-paste block below), then verify it
   serves correctly (reachable via the addon domain's own temporary/direct
   path before public DNS points at it). Nothing about this step touches
   the live site or risks downtime, since DNS hasn't moved yet.
3. Once verified working end-to-end (a real push → `deploy` branch update →
   cron pull → live release, confirmed via `curl`), switch DNS: the `A`
   record (and `www`) to the SSD 50 account's IP, **and** the `MX` record
   to the new account's mail (create the mailbox there first via
   **Create Email**) — same DNS edit, one cutover.
4. Once DNS has propagated and email is confirmed working, downgrade/cancel
   the Hosting Web 10 plan before 2026-08-18, keeping only the domain
   registration.

This is safer than downgrade-then-migrate: the old hosting stays live and
untouched as a fallback for the entire time the new pipeline is being built
and tested, and DNS only moves once the destination is already proven.

**Blocker found and resolved — email.** Checked live DNS (2026-08-12):

```
albertoarena.it.    A     <redacted>          (current Hosting Web 10 IP)
albertoarena.it.    MX    10 mail.albertoarena.it.
mail.albertoarena.it. A   <redacted>          (same server as the A record above)
```
(Actual IPs kept out of this public repo — see `.docs/` for infra-specific
notes, per the CLAUDE.md policy on confidential deployment info.)

Email for `albertoarena.it` is hosted directly on the Hosting Web 10
account being cancelled — not a separate provider. Cancelling that hosting
without a plan for email first would break mail delivery immediately.
**Decided (2026-08-12): SSD 50 also hosts mail** — confirmed via cPanel's
addon-domain list, which shows a **Create Email** action per domain.
Sequencing: create the mailbox(es) there via Create Email *before* the DNS
cutover in step 3, then repoint both `A` and `MX` in the same edit.

**Also found while checking DNS, unrelated but worth fixing in the same
pass**: `albertoarena.it` currently has **two separate SPF TXT records**
(`v=spf1 +a +mx ~all` and `v=spf1 include:_spf.mlsend.com +a +mx ~all` — the
second is MailerLite's). Multiple SPF records is invalid per RFC 7208 and
can cause SPF to permanently fail validation, hurting deliverability. Should
be merged into one (`v=spf1 include:_spf.mlsend.com +a +mx ~all` covers
both) whenever DNS is being touched for the migration anyway — not urgent
enough to block anything, but cheap to fix in the same sitting.

**Not decided yet, deferred rather than blocking**: `trussphp.com` sits
behind Cloudflare (its `A` record resolves to Cloudflare IPs, not directly
to Netsons) — `DEPLOYMENT.md` there even notes a cache-busting trick for it.
Whether `albertoarena.it` should get the same treatment is a separate,
non-urgent decision; this migration works identically with or without it
(point DNS straight at the SSD 50 account's IP for the simplest path, add
Cloudflare later if wanted).

### Status (2026-08-12): pipeline confirmed working, pre-cutover

PR #23 merged. Cron + `.htaccess` are live on the target account — the
existing pre-cPanel `.htaccess` (a force-HTTPS rule) had to be *merged*
with the release-routing rule, not replaced, since it predated this setup.
First real cron pull succeeded: `releases/<ts>/` was created with the full
expected build output and `current` symlinked to it correctly.

**Tested directly against the target server** (IP + exact commands in the
gitignored `.docs/server-pull-deployment-infra.md` — kept out of this
public repo per the CLAUDE.md policy on confidential deploy info), using
`curl --resolve` to hit it without touching real DNS:

- ✅ HTTP correctly 301-redirects to HTTPS (both `.htaccess` rules firing).
- ✅ Page content matches production exactly (title checked).
- ❌ HTTPS itself fails right now — `SSL: no alternative certificate
  subject name matches target host name`. The server doesn't have a valid
  cert for `albertoarena.it` yet, almost certainly because AutoSSL/Let's
  Encrypt needs DNS to actually point here before it can issue one.

**Action needed at DNS-cutover time, not before**: right after switching
the `A` record, check cPanel's **SSL/TLS Status** for `albertoarena.it` and
manually **Run AutoSSL** if it hasn't already picked up the domain —
otherwise the site's own force-HTTPS redirect sends every visitor into a
broken cert for however long AutoSSL's normal schedule takes to catch up.

## Phase 1 — deploy pipeline

**Confirmed against the live reference** (2026-08-12): read the actual
`.github/workflows/publish.yml`, `scripts/server-deploy.sh`, and
`DEPLOYMENT.md` runbook from the proven implementation — the code above
already matches it near-exactly (the reference's script defaults `BASE` to
`$HOME/trussphp.com`; this project's would default to
`$HOME/albertoarena.it` the same way). No secrets, no SSH, PATH-prepend for
cPanel's git already validated in production on this exact target account.

**One addition needed that the reference doesn't have**: the current
`deploy.yml`'s last two steps (checkout `albertoarena/albertoarena`, run
`scripts/update-profile-readme.mjs`, commit+push using
`PROFILE_README_TOKEN`) push the latest posts into the GitHub profile
README. That's specific to this repo and needs to carry over into the new
`publish.yml` — the reference workflow has nothing like it. Straightforward:
same steps, appended after the "publish to `deploy` branch" step.

**Naming** (per the existing namespacing note below, now concrete): docroot
`~/albertoarena.it/` (mirrors `~/trussphp.com/`), script
`~/bin/albertoarena-it-server-deploy.sh`, log
`~/albertoarena-it-server-deploy.log`, repo pull URL
`https://github.com/albertoarena/albertoarena.it.git`.

**Steps — repo-side work (1-2) can start now, doesn't block on Phase 0**:

1. Add `.github/workflows/publish.yml` (per above + the profile-readme
   steps carried over), keep `test.yml` as-is, leave the existing
   `deploy.yml` (FTP) in place and untouched for now — it's the fallback
   until the new pipeline is proven.
2. Add `scripts/server-deploy.sh` (per above, `albertoarena.it`-specific
   defaults).
3. *(Phase 0 must have landed — addon domain exists)* Set up the cron entry
   on the SSD 50 account via cPanel's **Cron Jobs** UI.
4. Use cPanel **File Manager** (or SSH, if the target account has it) to
   write the root `.htaccess` at the new docroot.
5. Trigger the cron entry once manually to bootstrap `releases/` and
   `current` — verify the addon domain serves correctly before DNS points
   there.
6. Push a trivial change to `main`, confirm the `deploy` branch updates, wait
   for the next cron tick, confirm the release directory and symlink update.
7. Only after DNS has been switched (Phase 0 step 2) and the site is
   confirmed serving correctly from the new pipeline over a few real
   deploys: delete the old `deploy.yml` FTP workflow and remove
   `FTP_HOST`/`FTP_USER`/`FTP_PASS`/`FTP_PORT` secrets.
8. Move both `ftp-to-git-deployment.md` and this plan to
   `docs/plans/completed/` once live (per this repo's existing convention).
9. Update the `project-deployment-migration` memory: mark Phase 0 and
   Phase 1 both complete, note the email migration outcome.

## What this plan deliberately doesn't do

- Doesn't touch the *current* hosting plan or attempt to make either pipeline
  work on Web 10 — confirmed impossible (no SSH, no cron), so Phase 0 is
  required no matter which deploy architecture is chosen.
- Doesn't script or detail the Phase 0 hosting migration itself — that's
  explicitly separate, user-owned work.
- Doesn't extract a shared/reusable deploy-tool across projects, even though
  that's a natural longer-term idea once two projects run the identical
  pattern on the same account. Ship the self-contained version here first.
