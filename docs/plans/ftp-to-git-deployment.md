# Migration plan: FTP to git deployment on Netsons

## Current state

Deployment uses `SamKirkland/FTP-Deploy-Action` with a 3-attempt retry loop. It is unreliable:

- FTP connections to Netsons drop randomly, especially under load
- The sync state file (`.ftp-deploy-sync-state.json`) tracks which files were uploaded; when a mid-upload attempt fails, the state diverges from the server and subsequent retries may skip files or transfer partial content
- The workflow already has a retry mechanism, but that complexity is a symptom of the underlying fragility

**Example:** run [27741342912](https://github.com/albertoarena/albertoarena.it/actions/runs/27741342912) — all three FTP attempts ran but the deploy verification failed.

## Why git via SSH

SSH is not perfectly reliable on Netsons either, but it fails less often than FTP and recovers more cleanly. The key advantages:

- No state file — git commit hash is the source of truth
- Atomic release switching via symlinks: the live site is never in a partial state
- Retry logic on SSH/SCP is straightforward and well-understood
- Rollback is trivial: repoint the symlink to the previous release

The [laravel-netsons-deploy](https://github.com/albertoarena/laravel-netsons-deploy) plugin uses this approach for Laravel apps and is a good reference for the SSH patterns (retry helpers, known_hosts setup, symlink activation, release cleanup).

## Target architecture

```
public_html/
├── current -> releases/20260618_120000/   (symlink — what Apache/Nginx serves)
└── releases/
    ├── 20260618_120000/                   (latest)
    └── 20260618_110000/                   (previous — kept for rollback)
```

The GitHub Actions runner builds the Astro site, uploads `dist/` to a timestamped release directory on the server via SCP, then atomically switches the `current` symlink. If the post-deploy verification fails, the symlink is restored to the previous release.

Netsons must be configured to serve from `public_html/current/` rather than `public_html/` directly. Check whether this requires an `.htaccess` change or a support request to update the document root.

## New workflow steps

1. **Checkout** — same as now
2. **Setup Node.js** — same as now
3. **Install dependencies** — simplify: remove the Rollup pin/force install workaround once confirmed no longer needed
4. **Build Astro site** — `npm run build` → produces `dist/`
5. **Prepare SSH**
   - Load SSH private key into agent
   - Add Netsons host to known_hosts (keyscan or hardcoded fingerprint)
6. **Create release directory on server**
   ```bash
   ssh_retry netsons "mkdir -p public_html/releases/$TIMESTAMP"
   ```
7. **Upload dist/ via SCP**
   ```bash
   scp_retry -r dist/ netsons:public_html/releases/$TIMESTAMP/
   ```
8. **Activate release**
   ```bash
   ssh_retry netsons "ln -sfn releases/$TIMESTAMP public_html/current"
   ```
9. **Verify deployment** — HTTP check against https://albertoarena.it/, same logic as today
10. **Rollback on failure**
    ```bash
    # if verification fails:
    ssh_retry netsons "ln -sfn releases/$PREVIOUS public_html/current"
    ```
11. **Cleanup old releases** — keep last 3, remove the rest

## SSH retry helper

Borrowed from laravel-netsons-deploy. Add to the workflow as a shell function:

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

## Secrets needed

| Secret | Value |
|---|---|
| `SSH_HOST` | Netsons hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | 65100 (Netsons default) |
| `SSH_PRIVATE_KEY` | Private key (Ed25519 preferred) |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p 65100 <host>` |

Remove `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PORT` once migration is confirmed working.

## Prerequisites to check before starting

- [ ] Confirm Netsons plan supports SSH (SSD 30+)
- [ ] Confirm `git` is available on the server (needed if we ever want server-side clone; not strictly required for SCP-based approach)
- [ ] Generate Ed25519 key pair and add the public key to Netsons SSH authorised keys
- [ ] Confirm whether serving from `public_html/current/` is possible without a support request (symlink follow, document root change)
- [ ] Test SSH connection from a local machine on port 65100 before wiring into CI

## Migration steps

1. Set up SSH key and test connection manually
2. Resolve the `public_html/current/` document root question
3. Implement the new workflow in a feature branch
4. Do a manual dry-run: build locally, SCP to a test directory, verify symlink behaviour
5. Trigger the new workflow on a non-master branch push
6. If successful, merge and remove the FTP workflow
7. Remove FTP secrets from the repository

## What to keep from the current workflow

- Node.js build steps (minus the Rollup workaround, which should be revisited)
- Post-deploy HTTP + content verification
- `workflow_dispatch` trigger for manual deploys

## Notes

- The Rollup pin (`rollup@4.22.4` + `@rollup/rollup-linux-x64-gnu --force`) in the current workflow is a workaround for an old compatibility issue. Worth testing without it after migrating; if it's still needed, document why.
- SSH on Netsons also fails randomly, but less often than FTP and without the state corruption problem. The retry helpers + rollback make failures recoverable rather than silent.
