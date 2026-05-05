# Warp Docs Skill

Comprehensive documentation skill for [Warp](https://www.warp.dev) - the modern, AI-powered terminal.

## Features

- **92 pages** of official Warp documentation
- **3-tier architecture** for optimal context usage
- **Auto-update** from docs.warp.dev via sitemap (shared doc-builder)
- **LLM-optimized** format with grep-friendly `PAGE:` markers

## Trigger Phrases

| Trigger                     | Purpose                   |
| --------------------------- | ------------------------- |
| `check warp documentation`  | General Warp questions    |
| `update warp documentation` | Refresh all documentation |

## 3-Tier Architecture

| Tier | File                 | Size  | Purpose                                  |
| ---- | -------------------- | ----- | ---------------------------------------- |
| 1    | `quick-reference.md` | 19KB  | Getting started, shortcuts, basics       |
| 2    | `section-index.md`   | 25KB  | All pages organized by section           |
| 3    | `full-docs.txt`      | 939KB | Complete documentation with grep markers |

## Section Coverage

| Section         | Pages | Topics                                        |
| --------------- | ----- | --------------------------------------------- |
| Agents          | 24    | AI command generation, context, conversations |
| Ambient Agents  | 5     | Background agents, scheduled tasks, MCP       |
| Code            | 9     | Editor, review, codebase context              |
| Terminal        | 59    | Blocks, themes, input, windows, completions   |
| Getting Started | 8     | Installation, shortcuts, shells               |
| Knowledge       | 15    | Warp Drive, notebooks, workflows, teams       |
| Platform        | 13    | Agent API, SDK, CLI, deployment               |
| Integrations    | 5     | GitHub Actions, Linear, Slack                 |
| Support         | 12    | Billing, troubleshooting, updates             |

## Usage Examples

```bash
# Tier 1: Quick answers
"What are the keyboard shortcuts in Warp?"

# Tier 2: Find topics
"What documentation exists about Warp agents?"

# Tier 3: Deep details (skill uses grep internally)
"How do I configure custom SSH settings in Warp?"
```

## Grep Patterns for Tier 3

```bash
# Find a specific page
grep -A 100 "^PAGE: /terminal/blocks" full-docs.txt

# Find all pages in a section
grep "^PAGE:" full-docs.txt | grep "/agents/"

# Search for keyword
grep -n "keyboard shortcut" full-docs.txt

# Extract complete page between separators
sed -n '/^PAGE: \/path/,/^═\{80\}$/p' full-docs.txt
```

## Updating Documentation

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/warp-docs-skill"
"$SKILL_DIR/scripts/update-docs.sh"
```

**Duration:** ~60 seconds (discovers pages from sitemap, fetches with rate limiting)

## Installation

Skills are installed via **symlink** from the toolkit source:

```bash
TOOLKIT="$HOME/Projects/Dev_projects/Claude_SDK/claude-toolkit/skills"
ln -sfn "$TOOLKIT/warp-docs-skill" "$(git rev-parse --show-toplevel)/.claude/skills/warp-docs-skill"
```

Or use the `install-toolkit-skills` global skill interactively.

## File Structure

```
warp-docs-skill/
├── SKILL.md                # Skill configuration and routing instructions
├── README.md               # This file
├── docs-config.yaml        # Config for shared doc-builder
├── references/
│   ├── quick-reference.md  # Tier 1 (19KB)
│   ├── section-index.md    # Tier 2 (25KB)
│   └── full-docs.txt       # Tier 3 (939KB, 90 pages)
└── scripts/
    └── update-docs.sh      # Wrapper for shared doc-builder
```

## Requirements

- Python 3.11+ (for shared doc-builder)
- `uv` package manager (PEP 723 inline script)
- Internet connection for updates

## Version

- **Skill Version:** 1.0.0
- **Source:** https://docs.warp.dev
- **Pages:** 92
- **Last Updated:** 2026-03-01
