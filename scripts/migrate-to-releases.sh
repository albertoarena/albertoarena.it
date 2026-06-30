#!/bin/bash
# One-time migration: snapshots the current live site into the releases structure
# inside public_html/, then wires up the current symlink and root .htaccess.
#
# The site stays live throughout — public_html/.htaccess is written last, so
# traffic keeps hitting the existing flat files until the rewrite rule is in place.
#
# Normal usage (run from your local machine once SSH access is confirmed):
#   SSH_HOST=<host> SSH_PORT=65100 SSH_USER=<user> SSH_KEY=~/.ssh/deploy_key \
#     ./scripts/migrate-to-releases.sh
#
# Local test mode (no SSH, no server — uses /tmp/migrate-test/ as a sandbox):
#   LOCAL_TEST=1 ./scripts/migrate-to-releases.sh

set -euo pipefail

LOCAL_TEST="${LOCAL_TEST:-0}"
TIMESTAMP=$(date -u '+%Y%m%d%H%M%S')

# ── Local test mode ──────────────────────────────────────────────────────────
if [ "$LOCAL_TEST" = "1" ]; then
  TEST_HOME="/tmp/migrate-test/home"
  TEST_PUBLIC_HTML="$TEST_HOME/public_html"

  echo "LOCAL TEST MODE — sandbox: $TEST_HOME"
  echo "  Release: $TIMESTAMP"
  echo ""

  # Seed a fake public_html if it doesn't exist
  if [ ! -d "$TEST_PUBLIC_HTML" ]; then
    echo "→ Creating fake public_html with sample files..."
    mkdir -p "$TEST_PUBLIC_HTML"
    echo "<h1>Hello from the live site</h1>" > "$TEST_PUBLIC_HTML/index.html"
    touch "$TEST_PUBLIC_HTML/about.html"
    touch "$TEST_PUBLIC_HTML/robots.txt"
    touch "$TEST_PUBLIC_HTML/.ftp-deploy-sync-state.json"
    echo "  Done."
    echo ""
  else
    echo "→ Using existing sandbox at $TEST_PUBLIC_HTML"
    echo ""
  fi

  echo "→ Creating release directory..."
  mkdir -p "$TEST_PUBLIC_HTML/releases/$TIMESTAMP"

  echo "→ Snapshotting public_html into release..."
  cd "$TEST_PUBLIC_HTML"
  for item in $(ls -A | grep -Ev '^(releases|current)$'); do
    cp -a "$item" "releases/$TIMESTAMP/"
  done
  echo "  Snapshot complete."

  echo "→ Creating current symlink..."
  ln -sfn "releases/$TIMESTAMP" "$TEST_PUBLIC_HTML/current"
  echo "  current → releases/$TIMESTAMP"

  echo "→ Writing root .htaccess..."
  cat > "$TEST_PUBLIC_HTML/.htaccess" <<'HTACCESS'
Options +FollowSymLinks -Indexes
RewriteEngine On

# Block direct HTTP access to the releases directory
RewriteRule ^releases(/.*)?$ - [F,L]

# Route all requests through the active release via the current symlink
RewriteCond %{REQUEST_URI} !^/current/
RewriteRule ^(.*)$ current/$1 [L]
HTACCESS
  echo "  .htaccess written."

  echo ""
  echo "Done. Verifying structure..."
  echo ""
  echo "--- $TEST_PUBLIC_HTML/ ---"
  ls -la "$TEST_PUBLIC_HTML/"
  echo ""
  echo "--- current/ (via symlink) ---"
  ls -la "$TEST_PUBLIC_HTML/current/"
  echo ""
  echo "--- releases/$TIMESTAMP/ ---"
  ls -la "$TEST_PUBLIC_HTML/releases/$TIMESTAMP/"

  echo ""
  echo "To re-run: rm -rf $TEST_PUBLIC_HTML && LOCAL_TEST=1 $0"
  exit 0
fi

# ── Normal mode (SSH to server) ──────────────────────────────────────────────
SSH_HOST="${SSH_HOST:?Set SSH_HOST (e.g. your-server.netsons.net)}"
SSH_PORT="${SSH_PORT:-65100}"
SSH_USER="${SSH_USER:?Set SSH_USER (your cPanel/SSH username)}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/deploy_key}"

SSH="ssh -p ${SSH_PORT} -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST}"

echo "Migrating to releases structure inside public_html/"
echo "  Host:     ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
echo "  Release:  ${TIMESTAMP}"
echo ""

echo "→ Creating release directory..."
$SSH "mkdir -p ~/public_html/releases/${TIMESTAMP}"

echo "→ Snapshotting current public_html into release..."
$SSH bash -s <<REMOTE
  set -euo pipefail
  cd ~/public_html
  for item in \$(ls -A | grep -Ev '^(releases|current)$'); do
    cp -a "\$item" "releases/${TIMESTAMP}/"
  done
  echo "  Snapshot complete."
REMOTE

echo "→ Creating current symlink..."
$SSH bash -s <<REMOTE
  set -euo pipefail
  cd ~/public_html
  ln -sfn releases/${TIMESTAMP} current
  echo "  current → releases/${TIMESTAMP}"
REMOTE

echo "→ Writing root .htaccess..."
$SSH bash -s <<'REMOTE'
  cat > ~/public_html/.htaccess <<'HTACCESS'
Options +FollowSymLinks -Indexes
RewriteEngine On

# Block direct HTTP access to the releases directory
RewriteRule ^releases(/.*)?$ - [F,L]

# Route all requests through the active release via the current symlink
RewriteCond %{REQUEST_URI} !^/current/
RewriteRule ^(.*)$ current/$1 [L]
HTACCESS
  echo "  .htaccess written."
REMOTE

echo ""
echo "Done. Verifying structure..."
$SSH "ls -la ~/public_html/ | grep -E '(releases|current|htaccess)'"

echo ""
echo "Migration complete. The site now serves via:"
echo "  public_html/.htaccess → current/ → releases/${TIMESTAMP}/"
echo ""
echo "No cPanel changes needed. Future deploys activate by flipping the current symlink."
