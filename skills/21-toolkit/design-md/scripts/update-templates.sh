#!/usr/bin/env bash
# Refresh DESIGN.md templates from the upstream `getdesign` npm package.
# Pulls the latest release, extracts package/templates/*.md and manifest.json,
# replaces local copies atomically, and regenerates catalog.md + categories.md.
#
# Usage:
#   update-templates.sh              # pull latest and regenerate indexes
#   update-templates.sh --dry-run    # download to tempdir, don't replace

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REFERENCES_DIR="$SKILL_DIR/references"
TEMPLATES_DIR="$REFERENCES_DIR/templates"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

if ! command -v npm >/dev/null 2>&1; then
  echo "✗ npm not found in PATH. Install Node.js (>=18) to update templates." >&2
  exit 1
fi

TMPDIR="$(mktemp -d -t design-md-sync-XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "→ Fetching getdesign@latest via npm pack…"
cd "$TMPDIR"
npm pack getdesign@latest >/dev/null 2>&1 || {
  echo "✗ npm pack failed. Check network access and npm registry." >&2
  exit 1
}

TARBALL=$(ls getdesign-*.tgz 2>/dev/null | head -1)
if [[ -z "$TARBALL" ]]; then
  echo "✗ no tarball produced by npm pack" >&2
  exit 1
fi

echo "→ Extracting $TARBALL"
tar -xzf "$TARBALL"

SRC_TEMPLATES="$TMPDIR/package/templates"
if [[ ! -d "$SRC_TEMPLATES" ]]; then
  echo "✗ $SRC_TEMPLATES not found — upstream package layout changed?" >&2
  exit 1
fi

COUNT=$(find "$SRC_TEMPLATES" -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
if [[ "$COUNT" -lt 30 ]]; then
  echo "✗ only found $COUNT templates — expected at least 30. Aborting." >&2
  exit 1
fi

echo "→ Found $COUNT templates and manifest.json"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "↳ --dry-run: leaving local templates unchanged"
  echo "↳ staged at: $SRC_TEMPLATES"
  trap - EXIT  # keep tempdir so user can inspect
  echo "  (tempdir preserved: $TMPDIR)"
  exit 0
fi

# Atomic replace via staging dir.
STAGE="$REFERENCES_DIR/templates.new"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp "$SRC_TEMPLATES"/*.md "$STAGE/"
cp "$SRC_TEMPLATES/manifest.json" "$STAGE/manifest.json"

rm -rf "$TEMPLATES_DIR.old"
[[ -d "$TEMPLATES_DIR" ]] && mv "$TEMPLATES_DIR" "$TEMPLATES_DIR.old"
mv "$STAGE" "$TEMPLATES_DIR"
rm -rf "$TEMPLATES_DIR.old"

echo "→ Installed $COUNT templates to $TEMPLATES_DIR"

# Regenerate catalog.md + categories.md from the new manifest.
echo "→ Regenerating catalog.md and categories.md"
python3 "$SCRIPT_DIR/_regen-indexes.py" "$TEMPLATES_DIR/manifest.json" "$REFERENCES_DIR"

VERSION=$(python3 -c "import json; print(json.load(open('$TEMPLATES_DIR/manifest.json'))[0].get('sourceCommit', 'unknown')[:8])" 2>/dev/null || echo "unknown")

echo ""
echo "✓ Templates updated."
echo "  Count:         $COUNT"
echo "  Source commit: $VERSION"
echo "  Location:      $TEMPLATES_DIR"
