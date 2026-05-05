#!/usr/bin/env bash
# List available DESIGN.md templates.
# Usage:
#   list.sh                        # all 66 brands, grouped by category
#   list.sh --flat                 # flat alphabetical list
#   list.sh --search <term>        # filter by substring (in brand or description)
#   list.sh --category <name>      # filter by category name (ai, devtools, fintech, etc.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFERENCES_DIR="$SCRIPT_DIR/../references"
MANIFEST="$REFERENCES_DIR/templates/manifest.json"

MODE="grouped"
SEARCH=""
CATEGORY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --flat|-f) MODE="flat" ;;
    --search|-s) shift; SEARCH="${1:-}" ;;
    --category|-c) shift; CATEGORY="${1:-}" ;;
    -h|--help)
      cat <<'HELP'
Usage: list.sh [--flat] [--search TERM] [--category NAME]

Shows all 66 DESIGN.md templates with descriptions. By default they're grouped
by category (AI, Developer Tools, Fintech, etc.). Use --flat for an alphabetical
dump, --search to filter by substring, --category to filter by group.
HELP
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "✗ manifest.json missing at $MANIFEST" >&2
  echo "  Run update-templates.sh to regenerate." >&2
  exit 1
fi

if [[ "$MODE" == "flat" ]]; then
  TARGET="$REFERENCES_DIR/catalog.md"
else
  TARGET="$REFERENCES_DIR/categories.md"
fi

if [[ -n "$SEARCH" || -n "$CATEGORY" ]]; then
  # Filtering uses the manifest + categories.md lookup.
  python3 - "$MANIFEST" "$REFERENCES_DIR/categories.md" "$SEARCH" "$CATEGORY" <<'PY'
import json, sys, re, pathlib

manifest_path, categories_path, search, category = sys.argv[1:5]
data = json.load(open(manifest_path))

# Build brand → category map from categories.md section headers.
text = pathlib.Path(categories_path).read_text()
current_cat = None
brand_to_cat = {}
for line in text.splitlines():
    if line.startswith("## "):
        current_cat = line[3:].strip()
    elif line.startswith("- `") and current_cat:
        m = re.match(r"- `([^`]+)`", line)
        if m:
            brand_to_cat[m.group(1)] = current_cat

search_lc = (search or "").lower()
category_lc = (category or "").lower()

hits = []
for e in sorted(data, key=lambda x: x["brand"]):
    brand = e["brand"]
    desc = e["description"]
    cat = brand_to_cat.get(brand, "Other")
    if search_lc and search_lc not in brand.lower() and search_lc not in desc.lower():
        continue
    if category_lc and category_lc not in cat.lower():
        continue
    hits.append((brand, desc, cat))

if not hits:
    print("No matches.", file=sys.stderr)
    sys.exit(1)

width = max(len(b) for b, _, _ in hits)
for brand, desc, cat in hits:
    print(f"  {brand:<{width}}  {desc}  [{cat}]")
print(f"\n{len(hits)} match(es).")
PY
  exit 0
fi

# No filters: just dump the pre-rendered file.
cat "$TARGET"
