# Migration plan: FTP to git deployment on Netsons

**Status: in progress — open question, pick up before implementing**

> **Open question:** the current architecture activates releases by flipping a `public_html/current` symlink and serving from it as the document root. This requires a Netsons document root change (cPanel or support request). The preferred alternative is to keep `public_html/` as the document root and activate by running `rsync -a --delete releases/$TIMESTAMP/ ~/public_html/` — no server config change, works identically on any shared hosting plan, and rollback is the same rsync in reverse. Releases would live at `~/apps/albertoarena.it/releases/` (outside `public_html/`). The plan needs to be updated to reflect this before implementation begins.

## Current state

Deployment uses `SamKirkland/FTP-Deploy-Action` with a 3-attempt retry loop. It is unreliable:

- FTP connections to Netsons drop randomly, especially under load
- The sync state file (`.ftp-deploy-sync-state.json`) tracks which files were uploaded; when a mid-upload attempt fails, the state diverges from the server and subsequent retries may skip files or transfer partial content
- The workflow already has a retry mechanism, but that complexity is a symptom of the underlying fragility

**Example:** run [27741342912](https://github.com/albertoarena/albertoarena.it/actions/runs/27741342912) — all three FTP attempts ran but the deploy verification failed.

## Why SSH/SCP

SSH is not perfectly reliable on Netsons either, but it fails less often than FTP and recovers more cleanly. The key advantages:

- No state file — the active release is tracked by a plain `.active_release` file and a symlink
- Atomic release switching via symlinks: the live site is never in a partial state
- Single-file tarball upload instead of hundreds of small files — faster and resilient to mid-transfer failures
- Retry logic on SSH/SCP is straightforward and well-understood
- Rollback is trivial and automatic: repoint the symlink to the previous release

## Target architecture

```
public_html/
├── .active_release                          (plain text: timestamp of current release)
├── current -> releases/20260618_120000/     (symlink — what Apache serves)
└── releases/
    ├── 20260618_120000/                     (latest)
    ├── 20260618_110000/                     (previous — kept for rollback)
    └── 20260618_100000/                     (oldest kept)
```

The GitHub Actions runner builds the Astro site, packs `dist/` into a tarball, uploads it to a timestamped release directory via SCP, extracts it on the server, then atomically switches the `current` symlink. If post-deploy verification fails, the symlink and `.active_release` are restored to the previous release.

Netsons serves from `public_html/current/` — confirmed working via symlink follow (`Options +FollowSymLinks` in `.htaccess` or equivalent).

## New workflow steps

1. **Checkout** — same as now
2. **Setup Node.js** — same as now
3. **Install dependencies** — keep Rollup workaround for now (see Notes)
4. **Build Astro site** — `npm run build` → produces `dist/`
5. **Generate release timestamp** — captured once via `$GITHUB_OUTPUT`, reused across all steps:
   ```bash
   TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
   echo "timestamp=$TIMESTAMP" >> $GITHUB_OUTPUT
   ```
6. **Prepare SSH**
   - Write private key to `~/.ssh/deploy_key`, `chmod 600`
   - Append `SSH_KNOWN_HOSTS` secret to `~/.ssh/known_hosts`
   - Write an SSH config alias so all subsequent commands use `netsons` as the host:
     ```
     Host netsons
       HostName <SSH_HOST>
       User <SSH_USER>
       Port <SSH_PORT>
       IdentityFile ~/.ssh/deploy_key
     ```
7. **Create release directory on server**
   ```bash
   ssh_retry netsons "mkdir -p public_html/releases/$TIMESTAMP"
   ```
8. **Upload dist/ via tarball**
   ```bash
   tar -czf /tmp/dist.tar.gz -C dist/ .
   scp_retry /tmp/dist.tar.gz netsons:public_html/releases/$TIMESTAMP/
   ssh_retry netsons "tar -xzf public_html/releases/$TIMESTAMP/dist.tar.gz \
     -C public_html/releases/$TIMESTAMP/ && \
     rm public_html/releases/$TIMESTAMP/dist.tar.gz"
   ```
9. **Read active release** — captures the current release for rollback before touching anything:
   ```bash
   PREVIOUS=$(ssh netsons "cat public_html/.active_release 2>/dev/null || echo ''")
   echo "previous=$PREVIOUS" >> $GITHUB_OUTPUT
   ```
10. **Activate release** — write `.active_release` then flip symlink atomically:
    ```bash
    ssh_retry netsons "echo '$TIMESTAMP' > public_html/.active_release && \
      ln -sfn releases/$TIMESTAMP public_html/current"
    ```
11. **Verify deployment** — HTTP check against https://albertoarena.it/, same logic as today
12. **Rollback on failure** (`if: failure()`) — restore symlink and `.active_release`:
    ```bash
    PREVIOUS=${{ steps.active_release.outputs.previous }}
    if [ -n "$PREVIOUS" ]; then
      ssh_retry netsons "ln -sfn releases/$PREVIOUS public_html/current && \
        echo '$PREVIOUS' > public_html/.active_release"
    fi
    ```
13. **Cleanup old releases** — keep last 3, remove the rest:
    ```bash
    ssh_retry netsons "cd public_html/releases && ls -1t | tail -n +4 | xargs -r rm -rf"
    ```
14. **Cleanup SSH** (`if: always()`) — remove the deploy key:
    ```bash
    rm -f $HOME/.ssh/deploy_key
    ```

## SSH retry helpers

Add to the workflow as shell functions (defined once in an early `run:` block and exported):

```bash
ssh_retry() {
  local max=3 delay=10 attempt=0
  until ssh "$@"; do
    code=$?
    attempt=$((attempt + 1))
    [ $attempt -ge $max ] && exit $code
    [ $code -eq 255 ] || exit $code   # 255 = connection refused, worth retrying
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

Both functions use the `netsons` SSH config alias, so no explicit `-i`, `-p`, or user@host needed in call sites.

## Secrets needed

| Secret | Value |
|---|---|
| `SSH_HOST` | Netsons hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | 65100 (Netsons default) |
| `SSH_PRIVATE_KEY` | Ed25519 private key (no passphrase) |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p 65100 <host>` |

No passphrase needed — the key is protected by living only in GitHub secrets. Remove `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PORT` once migration is confirmed working.

## Prerequisites

- [x] Confirm symlink follow works (`public_html/current/` served correctly by Apache)
- [ ] Confirm Netsons plan supports SSH (SSD 30+)
- [ ] Generate Ed25519 key pair, add public key to Netsons SSH authorised keys
- [ ] Test SSH connection from local machine: `ssh -p 65100 -i ~/.ssh/deploy_key <user>@<host>`
- [ ] Capture `SSH_KNOWN_HOSTS`: `ssh-keyscan -p 65100 <host>`

## Migration steps

1. Generate Ed25519 key pair and test SSH connection manually from local machine
2. Add GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`
3. Implement the new workflow in a feature branch
4. Do a manual dry-run: build locally, SCP tarball to a test directory, verify extract and symlink behaviour
5. Trigger the new workflow on a non-master branch push
6. If successful, merge and remove the FTP workflow
7. Remove FTP secrets from the repository

## What to keep from the current workflow

- Node.js build steps
- Post-deploy HTTP + content verification
- `workflow_dispatch` trigger for manual deploys

## Notes

- The Rollup pin (`rollup@4.22.4` + `@rollup/rollup-linux-x64-gnu --force`) in the current workflow is a workaround for an old compatibility issue. Worth testing without it in a separate PR after migrating; if it's still needed, document why. Do not mix this cleanup into the deployment migration.
- SSH on Netsons also fails randomly, but less often than FTP and without the state corruption problem. The retry helpers + automatic rollback make failures recoverable rather than silent.
- The `.active_release` file is written before the symlink flip and is the single source of truth for rollback. If a deploy is interrupted before step 10, `.active_release` still points to the previous release, so rollback is safe.
