#!/usr/bin/env bash
# Open the local Skill Forge site in the default browser.
# Works on macOS (open), Linux (xdg-open), and Windows (start).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/site"
INDEX="$SITE_DIR/index.html"

if [[ ! -f "$INDEX" ]]; then
  echo "site/index.html not found — run: pnpm site:build" >&2
  exit 1
fi

URL="file://$INDEX"

case "$(uname -s)" in
  Darwin*)
    open "$URL"
    ;;
  Linux*)
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL"
    else
      echo "xdg-open not found — open this URL manually:"
      echo "  $URL"
    fi
    ;;
  CYGWIN* | MINGW* | MSYS*)
    start "$URL"
    ;;
  *)
    echo "Unsupported platform — open this URL manually:"
    echo "  $URL"
    ;;
esac
