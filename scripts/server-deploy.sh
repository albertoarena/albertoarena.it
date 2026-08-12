#!/bin/bash
# Server-side pull deploy for albertoarena.it (runs ON Netsons).
#
# Pulls the pre-built `deploy` branch of albertoarena/albertoarena.it over
# HTTPS and, only when it sees a new commit, unpacks it into a fresh
# timestamped release and atomically flips the `current` symlink, then
# prunes to the newest 3 releases. The server initiates the connection
# (outbound HTTPS), so it is not affected by inbound-FTP blocking. Safe to
# run repeatedly from cron. Mirrors the proven laravel-truss-docs setup on
# the same Netsons account — see docs/plans/completed/server-pull-deployment.md.
#
# Usage: server-deploy.sh [BASE_DIR]
#   BASE_DIR defaults to $HOME/albertoarena.it (the live docroot parent).
#   Pass a scratch dir (e.g. $HOME/albertoarena.it/_test) to test without
#   touching the live `current` symlink.
set -euo pipefail

# cron runs with a minimal PATH; ensure cPanel's git and the standard tools
# are found (git lives under cPanel's 3rdparty bin, curl/tar under /usr/bin).
export PATH="/usr/local/cpanel/3rdparty/lib/path-bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

BASE="${1:-$HOME/albertoarena.it}"
REPO="https://github.com/albertoarena/albertoarena.it.git"
BRANCH="deploy"
SRC="$BASE/.deploy-src"
STAMP="$BASE/.deployed-sha"

mkdir -p "$BASE"

# Keep a shallow single-branch mirror of the deploy branch. --force on fetch
# so a force-pushed (rewritten) deploy branch always updates cleanly.
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

# Fresh, clean release from the committed tree (no .git, no stale files).
TS="$(date -u +%Y%m%d%H%M%S)"
mkdir -p "$BASE/releases/$TS"
git -C "$SRC" archive "origin/$BRANCH" | tar -x -C "$BASE/releases/$TS"
ln -sfn "releases/$TS" "$BASE/current"
( cd "$BASE/releases" && ls -1t | tail -n +4 | xargs -r rm -rf ) || true
echo "$NEW" > "$STAMP"
echo "deployed release $TS from $NEW"
