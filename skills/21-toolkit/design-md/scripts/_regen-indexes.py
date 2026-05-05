#!/usr/bin/env python3
"""Regenerate catalog.md (flat) and categories.md (grouped) from manifest.json.

Invoked by update-templates.sh after a sync. The category mapping is hand-curated
to match the upstream README groupings; when new brands are added upstream and
land in "Other", edit CATEGORY_MAP and re-run.

Usage:
    _regen-indexes.py <path-to-manifest.json> <references-dir>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


# Hand-curated category grouping — mirrors the upstream README sections.
# Update when new brands are added upstream that don't land in the right bucket.
CATEGORY_MAP: dict[str, list[str]] = {
    "AI & LLM Platforms": [
        "claude", "cohere", "elevenlabs", "minimax", "mistral.ai", "ollama",
        "opencode.ai", "replicate", "runwayml", "together.ai", "voltagent", "x.ai",
    ],
    "Developer Tools & IDEs": [
        "cursor", "expo", "lovable", "raycast", "superhuman", "vercel", "warp",
    ],
    "Backend, Database & DevOps": [
        "clickhouse", "composio", "hashicorp", "mongodb", "posthog", "sanity",
        "sentry", "supabase",
    ],
    "Productivity & SaaS": [
        "cal", "intercom", "linear.app", "mintlify", "notion", "resend", "zapier",
    ],
    "Design & Creative Tools": [
        "airtable", "clay", "figma", "framer", "miro", "webflow",
    ],
    "Fintech & Crypto": [
        "binance", "coinbase", "kraken", "revolut", "stripe", "wise",
    ],
    "E-commerce & Retail": [
        "airbnb", "meta", "nike", "shopify",
    ],
    "Media & Consumer Tech": [
        "apple", "ibm", "nvidia", "pinterest", "playstation", "spacex", "spotify",
        "theverge", "uber", "wired",
    ],
    "Automotive": [
        "bmw", "bugatti", "ferrari", "lamborghini", "renault", "tesla",
    ],
}


def load_manifest(path: Path) -> list[dict]:
    data = json.loads(path.read_text())
    if not isinstance(data, list) or not data:
        raise SystemExit(f"manifest.json is empty or not a list: {path}")
    return data


def write_catalog_md(entries: list[dict], out_path: Path) -> None:
    lines = [
        "# DESIGN.md Catalog",
        "",
        f"**{len(entries)} templates** available. Flat alphabetical list.",
        "",
        "For a grouped view, see [categories.md](categories.md).",
        "",
        "| Brand | Description |",
        "|-------|-------------|",
    ]
    for e in sorted(entries, key=lambda x: x["brand"]):
        lines.append(f"| `{e['brand']}` | {e['description']} |")
    lines.append("")
    lines.append("## Usage")
    lines.append("")
    lines.append("```bash")
    lines.append('bash "${CLAUDE_SKILL_DIR}/scripts/apply.sh" <brand>')
    lines.append("```")
    lines.append("")
    out_path.write_text("\n".join(lines))


def write_categories_md(entries: list[dict], out_path: Path) -> None:
    by_brand = {e["brand"]: e for e in entries}
    seen: set[str] = set()

    lines = [
        "# DESIGN.md Categories",
        "",
        f"**{len(entries)} templates** grouped by category. "
        "See [catalog.md](catalog.md) for the flat alphabetical view.",
        "",
    ]

    for category, brands in CATEGORY_MAP.items():
        present = [b for b in brands if b in by_brand]
        if not present:
            continue
        lines.append(f"## {category}")
        lines.append("")
        for b in present:
            e = by_brand[b]
            lines.append(f"- `{b}` — {e['description']}")
            seen.add(b)
        lines.append("")

    # Anything not in CATEGORY_MAP lands here (new upstream brands).
    unclassified = sorted(set(by_brand) - seen)
    if unclassified:
        lines.append("## Other / Uncategorized")
        lines.append("")
        lines.append("*New upstream brands that need categorization. "
                     "Edit `scripts/_regen-indexes.py` CATEGORY_MAP and re-run.*")
        lines.append("")
        for b in unclassified:
            e = by_brand[b]
            lines.append(f"- `{b}` — {e['description']}")
        lines.append("")

    out_path.write_text("\n".join(lines))


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: _regen-indexes.py <manifest.json> <references-dir>")
    manifest = Path(sys.argv[1])
    ref_dir = Path(sys.argv[2])
    entries = load_manifest(manifest)

    catalog = ref_dir / "catalog.md"
    categories = ref_dir / "categories.md"
    write_catalog_md(entries, catalog)
    write_categories_md(entries, categories)

    print(f"✓ wrote {catalog.name} ({len(entries)} brands)")
    print(f"✓ wrote {categories.name}")


if __name__ == "__main__":
    main()
