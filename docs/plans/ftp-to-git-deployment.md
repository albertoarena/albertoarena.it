# Migration plan: FTP to git deployment on Netsons

**Status: in progress**

## Decisions

**Approach: symlink** — each deploy creates a timestamped release directory and atomically flips a `current` symlink. This is the same pattern used in the trucking-equipment project on Netsons. No rsync is used (not available on Netsons).

**Two deployment phases**, differing only in where releases live and how Apache is pointed at them:

| | Phase 1 — current Netsons hosting | Phase 2 — shared server (future) |
|---|---|---|
| Domain type | Main domain | Addon domain |
| cPanel docroot | Locked to `~/public_html/` | Freely configurable |
| Releases location | Inside `~/public_html/releases/` | Outside web root, e.g. `~/albertoarena.it/releases/` |
| Activation | Root `.htaccess` rewrites to `current/` | cPanel docroot set to `~/albertoarena.it/current` |
| `DEPLOY_PATH` variable | `public_html` | `albertoarena.it` |

Everything in the workflow is derived from `DEPLOY_PATH`. Moving to Phase 2 requires only changing that one GitHub Variable and updating the cPanel docroot — no workflow code changes.

---

## Current state

Deployment uses `SamKirkland/FTP-Deploy-Action` with a 3-attempt retry loop. It is unreliable:

- FTP connections to Netsons drop randomly, especially under load
- The sync state file (`.ftp-deploy-sync-state.json`) tracks which files were uploaded; when a mid-upload attempt fails, the state diverges from the server and subsequent retries may skip files or transfer partial content
- The workflow already has a retry mechanism, but that complexity is a symptom of the underlying fragility

**Example:** run [27741342912](https://github.com/albertoarena/albertoarena.it/actions/runs/27741342912) — all three FTP attempts ran but the deploy verification failed.

## Why SSH/SCP

SSH is not perfectly reliable on Netsons either, but it fails less often than FTP and recovers more cleanly. The key advantages:

- No state file — the active release is the `current` symlink itself
- Atomic release switching: the live site is never in a partial state
- Single-file tarball upload instead of hundreds of small files — faster and resilient to mid-transfer failures
- Retry logic on SSH/SCP is straightforward and well-understood
- Rollback is trivial: repoint the symlink to the previous release

---

## Target architecture

### Phase 1 — current Netsons hosting (main domain, locked docroot)

cPanel's main domain docroot is hardcoded to `~/public_html/` with no UI option to change it. Releases live inside it, and a root `.htaccess` transparently proxies all traffic through the `current` symlink. The browser never sees `/current/` in URLs.

```
~/public_html/
├── .htaccess                            ← proxies all traffic → current/, blocks /releases/
├── current -> releases/20260618120000/  ← relative symlink, flipped atomically on each deploy
└── releases/
    ├── 20260618120000/                  ← latest (dist/ contents)
    ├── 20260618110000/                  ← previous (kept for rollback)
    └── 20260618100000/                  ← oldest kept
```

### Phase 2 — shared server (addon domain)

When `albertoarena.it` moves to a shared server as an addon domain, cPanel allows setting the docroot freely. It is set once to `~/albertoarena.it/current`. No `.htaccess` rewrite layer needed.

```
~/albertoarena.it/
├── current -> releases/20260618120000/  ← cPanel docroot points here
└── releases/
    ├── 20260618120000/
    └── ...
```

---

## DEPLOY_PATH variable

`DEPLOY_PATH` is a GitHub Actions **Variable** (not a secret). It is the base folder for all deployment paths, relative to `~`. Changing it is the only step needed to switch between phases.

| Phase | `DEPLOY_PATH` value | cPanel docroot |
|---|---|---|
| 1 — current Netsons | `public_html` | `~/public_html/` (locked, no change needed) |
| 2 — shared server | `albertoarena.it` | `~/albertoarena.it/current` (set once in cPanel) |

All paths in the workflow are `~/${{ vars.DEPLOY_PATH }}/...`.

---

## Root `.htaccess` (Phase 1 only)

The file at `~/public_html/.htaccess` is written once by the migration script and does not change between deploys. It is not part of any release — it lives at the `public_html/` root permanently.

```apache
Options +FollowSymLinks -Indexes
RewriteEngine On

# Block direct HTTP access to the releases directory
RewriteRule ^releases(/.*)?$ - [F,L]

# Route all requests through the active release via the current symlink
RewriteCond %{REQUEST_URI} !^/current/
RewriteRule ^(.*)$ current/$1 [L]
```

- `+FollowSymLinks` — required for Apache to follow the `current` symlink
- `-Indexes` — disables directory listing (belt-and-suspenders, `releases/` is already blocked by the rule above)
- The block rule returns HTTP 403 for any request starting with `/releases/`
- The rewrite rule is transparent: `/about/` is served from `current/about/index.html` with no URL change visible to the browser

In Phase 2 this file is not needed — the cPanel docroot already points at `current/` directly.

---

## New workflow steps

1. **Checkout** — same as now
2. **Setup Node.js** — same as now
3. **Install dependencies** — keep Rollup workaround for now (see Notes)
4. **Build Astro site** — `npm run build` → produces `dist/`
5. **Generate release timestamp** — captured once via `$GITHUB_OUTPUT`, reused across all steps:
   ```bash
   TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
   echo "timestamp=$TIMESTAMP" >> $GITHUB_OUTPUT
   ```
6. **Prepare SSH**
   - Write private key to `~/.ssh/deploy_key`, `chmod 600`
   - Append `SSH_KNOWN_HOSTS` secret to `~/.ssh/known_hosts`
   - Write an SSH config alias so all subsequent steps use `netsons` as the host:
     ```
     Host netsons
       HostName <SSH_HOST>
       User <SSH_USER>
       Port <SSH_PORT>
       IdentityFile ~/.ssh/deploy_key
     ```
   - Define `ssh_retry` and `scp_retry` helpers (see SSH retry helpers section)
7. **Create release directory on server**
   ```bash
   ssh_retry netsons "mkdir -p ~/$DEPLOY_PATH/releases/$TIMESTAMP"
   ```
8. **Upload `dist/` via tarball**
   ```bash
   tar -czf /tmp/dist.tar.gz -C dist/ .
   scp_retry /tmp/dist.tar.gz netsons:~/$DEPLOY_PATH/releases/$TIMESTAMP/
   ssh_retry netsons "tar -xzf ~/$DEPLOY_PATH/releases/$TIMESTAMP/dist.tar.gz \
     -C ~/$DEPLOY_PATH/releases/$TIMESTAMP/ && \
     rm ~/$DEPLOY_PATH/releases/$TIMESTAMP/dist.tar.gz"
   ```
9. **Capture previous release** — read the current symlink target before touching anything (used for rollback):
   ```bash
   PREVIOUS=$(ssh netsons "readlink ~/$DEPLOY_PATH/current 2>/dev/null || echo ''")
   echo "previous=$PREVIOUS" >> $GITHUB_OUTPUT
   ```
10. **Activate release** — flip the relative symlink atomically:
    ```bash
    ssh_retry netsons "ln -sfn releases/$TIMESTAMP ~/$DEPLOY_PATH/current"
    ```
11. **Verify deployment** — HTTP check against https://albertoarena.it/, same logic as today
12. **Rollback on failure** (`if: failure()`) — restore the previous symlink:
    ```bash
    PREVIOUS=${{ steps.capture_previous.outputs.previous }}
    if [ -n "$PREVIOUS" ]; then
      ssh_retry netsons "ln -sfn $PREVIOUS ~/$DEPLOY_PATH/current"
    fi
    ```
13. **Cleanup old releases** — keep last 3, remove the rest:
    ```bash
    ssh_retry netsons "cd ~/$DEPLOY_PATH/releases && ls -1t | tail -n +4 | xargs -r rm -rf"
    ```
14. **Cleanup SSH** (`if: always()`) — remove the deploy key:
    ```bash
    rm -f $HOME/.ssh/deploy_key
    ```

---

## SSH retry helpers

Defined once in an early `run:` block, written to `/tmp/ssh-helpers.sh`, sourced by each subsequent step:

```bash
ssh_retry() {
  local max=3 delay=10 attempt=0
  until ssh "$@"; do
    code=$?
    attempt=$((attempt + 1))
    [ $attempt -ge $max ] && exit $code
    [ $code -eq 255 ] || exit $code   # 255 = connection error, worth retrying
    echo "SSH attempt $attempt failed, retrying in ${delay}s..."
    sleep $delay
  done
}

scp_retry() {
  local max=3 delay=10 attempt=0
  until scp "$@"; do
    code=$?
    attempt=$((attempt + 1))
    [ $attempt -ge $max ] && exit $code
    [ $code -eq 255 ] || exit $code
    echo "SCP attempt $attempt failed, retrying in ${delay}s..."
    sleep $delay
  done
}
```

Both functions use the `netsons` SSH config alias, so no explicit `-i`, `-p`, or `user@host` needed at call sites.

---

## Secrets and variables needed

**Secrets** (GitHub → Settings → Secrets):

| Secret | Value |
|---|---|
| `SSH_HOST` | Netsons hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | 65100 (Netsons default) |
| `SSH_PRIVATE_KEY` | Ed25519 private key (no passphrase) |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p 65100 <host>` |

**Variables** (GitHub → Settings → Variables):

| Variable | Phase 1 value | Phase 2 value |
|---|---|---|
| `DEPLOY_PATH` | `public_html` | `albertoarena.it` |

Once the SSH migration is confirmed working, remove `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PORT`.

---

## Prerequisites

- [x] Confirm Apache follows symlinks inside `public_html/` — verified via `.htaccess` `+FollowSymLinks`
- [ ] **Upgrade hosting plan** — current plan is Netsons Hosting Web 10, which does not support SSH. Must move to SSD 50 first. Everything below is blocked on this.
- [ ] Generate Ed25519 key pair, add public key to Netsons SSH authorised keys
- [ ] Test SSH connection from local machine: `ssh -p 65100 -i ~/.ssh/deploy_key <user>@<host>`
- [ ] Capture `SSH_KNOWN_HOSTS`: `ssh-keyscan -p 65100 <host>`
- [ ] Run one-time migration script (see below)

---

## One-time migration script

`scripts/migrate-to-releases.sh` bootstraps the server into the Phase 1 releases structure before the new workflow takes over. Run it once from your local machine after SSH access is confirmed.

**What it does:**
1. Creates `~/public_html/releases/<TIMESTAMP>/`
2. Copies the current flat `public_html/` contents into that release (excludes `releases/` and `current` to avoid self-copy)
3. Creates the relative `current` symlink (`current → releases/<TIMESTAMP>`)
4. Writes the root `.htaccess` (the rewrite + block rules above)

The `.htaccess` is written last. Until then the site continues serving from the existing flat files — no downtime.

```bash
SSH_HOST=<host> SSH_PORT=65100 SSH_USER=<user> SSH_KEY=~/.ssh/deploy_key \
  ./scripts/migrate-to-releases.sh
```

After running, verify `https://albertoarena.it/` loads correctly. The `.htaccess` rewrite is transparent — URLs are unchanged.

---

## Migration steps

1. Generate Ed25519 key pair and test SSH connection manually from local machine
2. Add GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`
3. Add GitHub variable: `DEPLOY_PATH=public_html`
4. Run `scripts/migrate-to-releases.sh` — server is now in Phase 1 structure
5. Implement the new workflow in a feature branch
6. Do a manual dry-run: build locally, SCP tarball to a test release directory, verify extract and symlink behaviour
7. Trigger the new workflow on a non-master branch push
8. If successful, merge and remove the FTP workflow
9. Remove FTP secrets from the repository

---

## What to keep from the current workflow

- Node.js build steps
- Post-deploy HTTP + content verification
- `workflow_dispatch` trigger for manual deploys

---

## Notes

- **No rsync on Netsons** — confirmed: `which rsync` returns empty. The workflow uses SCP for upload and server-side `tar` for extraction. Activation is purely a symlink flip — no file copying at activation time.
- **Rollback source of truth** — the `current` symlink itself is the source of truth. Before activating, the workflow reads `readlink current` to capture the previous target. If verification fails, the symlink is restored. No separate `.active_release` file is needed.
- **`.htaccess` is not part of releases** — it lives at `~/public_html/.htaccess` permanently and is written once by the migration script. Future deploys do not touch it. If it is ever lost or corrupted, re-run the relevant section of the migration script.
- **Phase 2 transition** — when moving to the shared server: create the addon domain in cPanel with docroot `~/albertoarena.it/current`, update `DEPLOY_PATH` to `albertoarena.it` in GitHub Variables, and deploy. The `.htaccess` rewrite layer is no longer needed and can be omitted. `public_html/` on the old server can be cleaned up after DNS propagates.
- **The Rollup pin** (`rollup@4.22.4` + `@rollup/rollup-linux-x64-gnu --force`) in the current workflow is a workaround for an old compatibility issue. Worth testing without it in a separate PR after migrating; if it's still needed, document why. Do not mix this cleanup into the deployment migration.
- **SSH on Netsons** also fails randomly, but less often than FTP and without the state corruption problem. The retry helpers + automatic rollback make failures recoverable rather than silent.
