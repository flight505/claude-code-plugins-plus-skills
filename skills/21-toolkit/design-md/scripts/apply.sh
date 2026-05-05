#!/usr/bin/env bash
# Apply a DESIGN.md template into the current working directory.
# Usage:
#   apply.sh <brand>          # copy template → ./DESIGN.md (fails if exists)
#   apply.sh <brand> --force  # overwrite existing DESIGN.md
#
# The brand slug must match a file in ../references/templates/<brand>.md.
# Slugs preserve dots: linear.app, mistral.ai, x.ai, opencode.ai, together.ai.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../references/templates"
MANIFEST="$TEMPLATES_DIR/manifest.json"

usage() {
  cat <<'USAGE' >&2
Usage: apply.sh <brand> [--force]

Copies a DESIGN.md template into the current working directory.

Examples:
  apply.sh claude
  apply.sh linear.app
  apply.sh stripe --force

Run list.sh to see all available brands.
USAGE
  exit 2
}

[[ $# -lt 1 ]] && usage

BRAND="$1"
FORCE=0
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force|-f) FORCE=1 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
  shift
done

# Normalize common aliases (linear → linear.app, mistral → mistral.ai, etc.)
case "$BRAND" in
  linear)       BRAND="linear.app" ;;
  mistral)      BRAND="mistral.ai" ;;
  xai|x)        BRAND="x.ai" ;;
  opencode)     BRAND="opencode.ai" ;;
  together)     BRAND="together.ai" ;;
  verge)        BRAND="theverge" ;;
  the-verge)    BRAND="theverge" ;;
esac

TEMPLATE="$TEMPLATES_DIR/${BRAND}.md"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "✗ No template for '$BRAND'." >&2
  echo "  Run: bash $(dirname "$0")/list.sh" >&2
  # Try a fuzzy hint.
  matches=$(find "$TEMPLATES_DIR" -maxdepth 1 -name "*${BRAND}*.md" -not -name manifest.json | head -5 || true)
  if [[ -n "$matches" ]]; then
    echo "  Did you mean:" >&2
    while IFS= read -r m; do
      echo "    - $(basename "$m" .md)" >&2
    done <<<"$matches"
  fi
  exit 1
fi

DEST="$(pwd)/DESIGN.md"

if [[ -f "$DEST" && "$FORCE" -eq 0 ]]; then
  echo "✗ $DEST already exists. Pass --force to overwrite." >&2
  exit 1
fi

# Atomic write: stage in tempfile, then rename.
TMP="$(mktemp "${DEST}.XXXXXX")"
trap 'rm -f "$TMP"' EXIT
cp "$TEMPLATE" "$TMP"
mv "$TMP" "$DEST"
trap - EXIT

# Pull the description from manifest.json if python3 is available.
DESCRIPTION=""
if command -v python3 >/dev/null 2>&1 && [[ -f "$MANIFEST" ]]; then
  DESCRIPTION=$(python3 -c "
import json, sys
try:
    data = json.load(open('$MANIFEST'))
    for e in data:
        if e['brand'] == '$BRAND':
            print(e['description'])
            break
except Exception:
    pass
" 2>/dev/null || true)
fi

echo "✓ Installed DESIGN.md for '$BRAND'"
echo "  Location: $DEST"
[[ -n "$DESCRIPTION" ]] && echo "  Style:    $DESCRIPTION"
echo ""
echo "Next: tell Claude to use the DESIGN.md in this project."
echo "      e.g. 'Build a landing page following DESIGN.md'"
