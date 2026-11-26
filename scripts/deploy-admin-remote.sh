#!/usr/bin/env bash
# =============================================================================
# Strike Admin Panel: activate a new static build on the VPS.
# =============================================================================
# Copied to the VPS and run there by .github/workflows/admin-ci-cd.yml:
#
#   bash deploy-admin-remote.sh <dist.tar.gz> <git-sha> [web-root]
#
# How it works:
#   1. Find the web root (argument, else the nginx `root` of admin.strikeapp.in).
#   2. Keep a full copy of the current site in <web-root>.prev for rollback.
#   3. Copy the new hashed /assets first and swap index.html last, so a browser
#      never gets an index.html pointing at files that aren't there yet. Old
#      assets stay for 7 days so tabs that are already open keep working.
#
# Manual rollback to the previous release:
#   sudo rsync -a --delete <web-root>.prev/ <web-root>/
#   (without rsync: sudo find <web-root> -mindepth 1 -delete && sudo cp -a <web-root>.prev/. <web-root>/)
# =============================================================================
set -euo pipefail

TARBALL="${1:?usage: deploy-admin-remote.sh <dist.tar.gz> <git-sha> [web-root]}"
SHA="${2:?git sha required}"
WEB_ROOT="${3:-}"
DOMAIN="admin.strikeapp.in"
LOCK_FILE="/tmp/strike-admin-deploy.lock"

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "ERROR: another admin deploy is in progress."; exit 1; }

echo "== Strike Admin deploy of $SHA, $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- 1. Web root ---------------------------------------------------------------
if [ -z "$WEB_ROOT" ]; then
  # Print the `root` of the first top-level server{} block whose server_name
  # includes $DOMAIN (skips e.g. the port-80 redirect block, which has no root).
  for CONF in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
    [ -r "$CONF" ] || continue
    WEB_ROOT="$(awk -v d="$DOMAIN" '
      depth == 0 && /^[ \t]*server[ \t]*\{/ { inblk = 1; hasname = 0; root = "" }
      {
        if (inblk) {
          if ($1 == "server_name" && index($0, d)) hasname = 1
          if ($1 == "root" && root == "") { root = $2; sub(/;$/, "", root) }
        }
        o = gsub(/\{/, "{"); c = gsub(/\}/, "}"); depth += o - c
        if (inblk && depth == 0) { if (hasname && root != "") { print root; exit } inblk = 0 }
      }' "$CONF")"
    [ -n "$WEB_ROOT" ] && { echo "Found web root in $CONF"; break; }
  done
fi
if [ -z "$WEB_ROOT" ] || [ ! -d "$WEB_ROOT" ]; then
  echo "ERROR: couldn't find the web root for $DOMAIN (found: '${WEB_ROOT:-nothing}')."
  echo "       Set the ADMIN_WEB_ROOT repository variable in GitHub, e.g. /var/www/admin."
  exit 1
fi
WEB_ROOT="${WEB_ROOT%/}"
case "$WEB_ROOT" in /|/etc*|/usr*|/bin*|/root|/home) echo "ERROR: refusing unsafe web root '$WEB_ROOT'"; exit 1;; esac
echo "Web root: $WEB_ROOT"

# --- Permissions: write directly or via passwordless sudo --------------------
SUDO=""
if [ ! -w "$WEB_ROOT" ] || [ ! -w "$(dirname "$WEB_ROOT")" ]; then
  if sudo -n true 2>/dev/null; then
    SUDO="sudo -n"
  else
    echo "ERROR: $(whoami) can't write to $WEB_ROOT and has no passwordless sudo."
    echo "       Fix once on the VPS:  sudo chown -R $(whoami) $WEB_ROOT $(dirname "$WEB_ROOT")"
    exit 1
  fi
fi

# --- Unpack and sanity-check --------------------------------------------------
STAGE="$(mktemp -d /tmp/strike-admin-stage.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT
tar -xzf "$TARBALL" -C "$STAGE"
[ -f "$STAGE/index.html" ] || { echo "ERROR: build has no index.html, aborting."; exit 1; }
[ -d "$STAGE/assets" ]     || { echo "ERROR: build has no assets/ directory, aborting."; exit 1; }

# Match the owner of the existing files so nginx can still read them.
OWNER="$(stat -c '%U:%G' "$WEB_ROOT")"

# --- 2. Backup ------------------------------------------------------------------
echo "== Saving the current release to $WEB_ROOT.prev"
$SUDO rm -rf "$WEB_ROOT.prev"
$SUDO cp -a "$WEB_ROOT" "$WEB_ROOT.prev"

rollback() {
  echo "!! Deploy failed, restoring the previous release"
  if command -v rsync >/dev/null 2>&1; then
    $SUDO rsync -a --delete "$WEB_ROOT.prev/" "$WEB_ROOT/"
  else
    $SUDO find "$WEB_ROOT" -mindepth 1 -delete
    $SUDO cp -a "$WEB_ROOT.prev/." "$WEB_ROOT/"
  fi
  echo "!! Previous release restored"
}
trap 'rc=$?; [ $rc -ne 0 ] && rollback; rm -rf "$STAGE"; exit $rc' EXIT

# --- 3. Activate ----------------------------------------------------------------
echo "== Copying new assets"
$SUDO mkdir -p "$WEB_ROOT/assets"
$SUDO cp -a "$STAGE/assets/." "$WEB_ROOT/assets/"

echo "== Copying the other public files"
( cd "$STAGE" && find . -mindepth 1 -maxdepth 1 ! -name assets ! -name index.html -print0 ) \
  | while IFS= read -r -d '' f; do $SUDO cp -a "$STAGE/$f" "$WEB_ROOT/"; done

echo "== Switching index.html"
$SUDO cp "$STAGE/index.html" "$WEB_ROOT/index.html.new"
$SUDO mv -f "$WEB_ROOT/index.html.new" "$WEB_ROOT/index.html"   # atomic rename
echo "$SHA" | $SUDO tee "$WEB_ROOT/version.txt" >/dev/null

$SUDO chown -R "$OWNER" "$WEB_ROOT" 2>/dev/null \
  || echo "WARNING: couldn't chown to $OWNER (files stay world-readable, nginx can still serve them)"

# Remove old hashed assets that are not in this build and are older than 7 days.
( cd "$STAGE/assets" && ls -1 ) > "$STAGE/.keep"
$SUDO find "$WEB_ROOT/assets" -maxdepth 1 -type f -mtime +7 -print0 \
  | while IFS= read -r -d '' f; do
      grep -qxF "$(basename "$f")" "$STAGE/.keep" || $SUDO rm -f "$f"
    done

# Quick local check that nginx serves the new index.html.
if command -v curl >/dev/null 2>&1; then
  ENTRY="$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$STAGE/index.html" | head -1)"
  if curl -fsS -k --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" 2>/dev/null | grep -q "$ENTRY"; then
    echo "Local nginx check: OK"
  else
    echo "Local nginx check: couldn't confirm (the public check in CI decides)"
  fi
fi

echo "== Deployed $SHA to $WEB_ROOT"
