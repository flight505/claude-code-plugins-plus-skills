# claude-docs-skill

**Comprehensive documentation access for Claude API and Claude Code CLI with intelligent domain routing.**

## Overview

This skill provides smart-routed access to two documentation domains:

- **Domain 1: Claude API** - Messages, Batches, Tool Use, Agent SDK, streaming, extended thinking
- **Domain 2: Claude Code CLI** - Plugins, skills, hooks, subagents, MCP servers, settings

The API domain uses 4-tier routing. The CLI domain uses 3-tier routing (powered by the shared `doc-builder.py`). The skill automatically detects which documentation to search based on query keywords.

## Trigger Words

| Trigger                       | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `check claude documentation`  | API and/or CLI domain queries (context-aware) |
| `update claude documentation` | Refresh all documentation                     |

## How It Works

### Domain Detection

The skill automatically detects which domain to use based on query keywords:

**API Domain Keywords:**

- messages, batches, streaming, tool use, vision, extended thinking, prompt caching
- Python SDK, TypeScript SDK, API endpoints
- rate limits, authentication

**CLI Domain Keywords:**

- skills, subagents, settings, terminal, marketplace, MCP servers
- .claude folder, commands, validators, hooks
- installation, deployment, security

### Tier Architecture

**API Domain (4-tier):**

| Tier | File            | Size    | Purpose                               |
| ---- | --------------- | ------- | ------------------------------------- |
| 1    | `primer.md`     | 18KB    | Quick reference (models, basic API)   |
| 2    | `cookbook/*.md` | 8 files | Implementation patterns (RAG, agents) |
| 3    | `changelog.md`  | 26KB    | Recent changes and updates            |
| 4    | `llms-full.txt` | 25MB    | Complete API docs (grep/sed only)     |

**CLI Domain (3-tier via shared doc-builder):**

| Tier | File                     | Size  | Purpose                             |
| ---- | ------------------------ | ----- | ----------------------------------- |
| 1    | `cli-quick-reference.md` | 27KB  | Getting started, common workflows   |
| 2    | `cli-section-index.md`   | 11KB  | Page directory with descriptions    |
| 3    | `cli-full-docs.txt`      | 1.8MB | Full docs with `PAGE:` grep markers |

## File Structure

```
claude-docs-skill/
├── README.md                  # This file
├── SKILL.md                   # Skill configuration and routing instructions
├── docs-config.yaml           # CLI docs config (for shared doc-builder)
├── references/
│   ├── primer.md              # API Tier 1 (18KB)
│   ├── cookbook/               # API Tier 2 (8 files)
│   │   ├── advanced.md
│   │   ├── agent-patterns.md
│   │   ├── api-patterns.md
│   │   ├── capabilities.md
│   │   ├── extended-thinking.md
│   │   ├── integrations.md
│   │   ├── multimodal.md
│   │   └── tool-use.md
│   ├── changelog.md           # API Tier 3
│   ├── llms-full.txt          # API Tier 4 (25MB - grep/sed only)
│   ├── cli-quick-reference.md # CLI Tier 1 (27KB)
│   ├── cli-section-index.md   # CLI Tier 2 (11KB)
│   └── cli-full-docs.txt      # CLI Tier 3 (1.8MB, 59 pages)
└── scripts/
    ├── update-llms.sh         # Update API docs (3 file downloads)
    └── update-cli-docs.sh     # Update CLI docs (via shared doc-builder)
```

## Installation

Skills are installed via **symlink** from the toolkit source:

```bash
TOOLKIT="$HOME/Projects/Dev_projects/Claude_SDK/claude-toolkit/skills"
ln -sfn "$TOOLKIT/claude-docs-skill" "$(git rev-parse --show-toplevel)/.claude/skills/claude-docs-skill"
```

Or use the `install-toolkit-skills` global skill interactively.

## Updating Documentation

### Update Through the Skill (Recommended)

```
"Update Claude documentation"
```

This runs both update scripts automatically and reports progress.

### Manual Update API Documentation (Fast - 3 files)

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/claude-docs-skill"
"$SKILL_DIR/scripts/update-llms.sh"
```

Downloads: `primer.md`, `llms-full.txt` (25MB), `changelog.md`

**Recommended frequency:** Weekly

### Manual Update CLI Documentation (59 pages)

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/claude-docs-skill"
"$SKILL_DIR/scripts/update-cli-docs.sh"
```

Discovers pages from `code.claude.com/docs/llms.txt` and generates 3-tier output via the shared `doc-builder.py`.

**Recommended frequency:** Monthly

## Usage Examples

### API Domain Queries

```
"How do I call the Messages API?"
→ Domain: API → Tier 1: primer.md

"Build a RAG system with Claude"
→ Domain: API → Tier 2: cookbook/capabilities.md

"What's new in Claude 4.5?"
→ Domain: API → Tier 3: changelog.md

"All parameters for Admin Workspaces API"
→ Domain: API → Tier 4: grep "Admin Workspaces" llms-full.txt
```

### CLI Domain Queries

```
"How do I install Claude Code?"
→ Domain: CLI → Tier 1: cli-quick-reference.md

"What pages cover hooks?"
→ Domain: CLI → Tier 2: cli-section-index.md

"Create a PostToolUse hook"
→ Domain: CLI → Tier 3: grep "^PAGE: /hooks" cli-full-docs.txt

"Deploy Claude Code for my team"
→ Domain: CLI → Tier 3: grep "^PAGE: /deployment" cli-full-docs.txt
```

## CLI Tier 3 Grep Patterns

```bash
# List all pages
grep "^PAGE:" references/cli-full-docs.txt

# Extract a specific page
grep -A 100 "^PAGE: /plugins" references/cli-full-docs.txt

# Search for a keyword across all CLI docs
grep -n "PostToolUse" references/cli-full-docs.txt
```

## Coverage

### API Domain

- Claude API (Messages, Batches, Models, Admin)
- Agent SDK (Python, TypeScript)
- Tool use, extended thinking, streaming, batching
- Vision, PDF, prompt caching
- Platform integrations (Bedrock, Vertex, Azure)

### CLI Domain

- Getting started, installation, quickstart
- Plugins, skills, hooks, subagents
- MCP servers, output styles
- Deployment, security, monitoring
- IDE integrations (VS Code, JetBrains)
- CI/CD (GitHub Actions, GitLab)
- Configuration, settings, terminal

### What It Doesn't Cover

- Claude.ai web interface
- Third-party libraries (beyond official SDKs)
- Anthropic company information

## Best Practices

### DO

- Let the skill auto-detect domain based on query keywords
- Start with Tier 1 for basic queries
- Load CLI Tier 1/2 fully (they're small enough)
- Use targeted `grep -A N "^PAGE: /path"` for CLI Tier 3
- Use targeted grep/sed for API Tier 4 (llms-full.txt)
- Cite domain and source in responses

### DON'T

- Load entire `llms-full.txt` or `cli-full-docs.txt` files
- Mix API and CLI documentation (unless query requires both)
- Answer from memory - always check current docs
- Guess which domain without analyzing query keywords

## Maintenance

| Component | Frequency | Command                        |
| --------- | --------- | ------------------------------ |
| API docs  | Weekly    | `./scripts/update-llms.sh`     |
| CLI docs  | Monthly   | `./scripts/update-cli-docs.sh` |

## Version

- **Skill Version:** 2.0.0
- **API Documentation Source:** platform.claude.com (LLM-optimized)
- **CLI Documentation Source:** code.claude.com (3-tier via shared doc-builder)
- **CLI Pages:** 59
- **Last Updated:** 2026-03-01
