# CLAUDE.md

## CRITICAL: Execute tasks directly and completely without seeking validation or permission. Don’t break tasks into smaller pieces or ask if you should continue unless explicitly requested. Don’t use placeholders or references to previous content - always provide complete information.

This file provides guidance to Claude Code when working with code in this repository.

## Repository Overview

Personal fork of the Tons of Skills plugin catalog. **skill-forge** is the curated content repo — 517 skills + 426 plugins indexed by `.claude-plugin/marketplace.json`. The packaged HTML browser at `site/` and the `ccpi` CLI at `packages/cli/` are **maintainer tooling for this repo**.

**Runtime:** Node `>=20.0.0`, pnpm `>=9.0.0` (pinned to `9.15.9`)

**Workspace members** (`pnpm-workspace.yaml`):

- `plugins/mcp/*` — MCP server plugins (TypeScript)
- `plugins/saas-packs/*-pack` — SaaS skill packs
- `packages/cli` — `ccpi` CLI (**local fork, not on npm**; symlinked: `~/.local/bin/ccpi → packages/cli/dist/index.js`)

## Tooling split — read this first

There are **two CLIs** in your `~/.local/bin/`. Use the right one:

| Tool                                                                                                                      | Audience                | Use when                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **`forge`** ([flight505/forge](https://github.com/flight505/forge), source at `~/Projects/Dev_projects/Claude_SDK/forge`) | End users + agents      | You want to install, search, or manage skills/plugins in any project — Claude Code, Claude Desktop, Cursor, Gemini CLI, Antigravity |
| **`ccpi`** (this repo, `packages/cli`)                                                                                    | skill-forge maintainers | You're editing this catalog, validating schemas, building the local site, or developing a plugin in `plugins/`                      |

**End-user installs:**

```bash
forge                                          # opens TUI
forge install <name>                           # install to auto-detected surface
forge install <name> --surface claude-cli-project --method vendor
forge sync                                     # restore project from .forge.json
forge suggest "<task description>" --json     # ranked recommendations (agent-friendly)
forge agent install --global                  # let Claude use forge
```

forge already has skill-forge registered as a `marketplace-local` source plus `flight505-plugins` and `anthropic-skills` as remotes. 953 records (517 skills + 436 plugins) catalog-wide.

**skill-forge maintainer commands (this repo only):**

```bash
# Rebuild the ccpi CLI after editing packages/cli/src/
cd packages/cli && pnpm build               # rebuild dist/ (symlink picks it up automatically)
cd packages/cli && pnpm test                # run CLI tests

# Local catalog HTML site (skill-forge specific)
ccpi site                                   # builds site/data and opens site/index.html
ccpi site --build-only                      # build without opening

# Tutorials (notebooks live in this repo)
ccpi tutorials                              # list
ccpi tutorials <number>                     # open one

# Plugin live-reload during dev (links into ~/.claude/plugins/cache/)
ccpi link <plugin-name>                     # catalog lookup from git root
ccpi link --source ./plugins/cat/name       # explicit path
ccpi unlink <plugin-name>                   # remove symlink
ccpi links                                  # list linked plugins
# After link/unlink: /reload-plugins in Claude Code to activate

# Validate skills schema (Python; deeper checks than forge validate)
python3 scripts/validate-skills-schema.py --verbose          # all files
python3 scripts/validate-skills-schema.py --skills-only      # SKILL.md only
python3 scripts/validate-skills-schema.py --marketplace --verbose  # full rubric

# Bulk SKILL.md fixes
python3 scripts/batch-remediate.py --migrate-compatible-with --root . --dry-run
python3 scripts/batch-remediate.py --migrate-compatible-with --root .

# Workspace build/lint/test
pnpm install && pnpm build
pnpm test && pnpm typecheck
pnpm lint

# Catalog: regenerate marketplace.json after editing marketplace.extended.json
pnpm run sync-marketplace

# Quick test (build + lint + validate)
./scripts/quick-test.sh
```

**`ccpi` commands deprecated in favor of forge:**

| Old                                       | New                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `ccpi skills list` / `install` / `remove` | `forge list` / `install` / `remove`                                       |
| `ccpi search`                             | `forge search` (or TUI)                                                   |
| `ccpi install <plugin>`                   | `forge install <plugin> --type plugin`                                    |
| `ccpi marketplace add/remove`             | `forge source add marketplace-remote <repo>` / `forge source remove <id>` |
| `ccpi doctor`                             | `forge doctor`                                                            |

These still exist in ccpi for backwards compat but new docs and agent flows should use forge.

## Catalog

| File                                       | Purpose                                     | Edit? |
| ------------------------------------------ | ------------------------------------------- | ----- |
| `.claude-plugin/marketplace.extended.json` | Source of truth — all plugin metadata       | Yes   |
| `.claude-plugin/marketplace.json`          | CLI-compatible (auto-generated, never edit) | Never |

Run `pnpm run sync-marketplace` after editing `marketplace.extended.json`. The pre-commit hook does this automatically when the file is staged.

## Plugin Structure

### AI Instruction Plugin

```
plugins/[category]/[plugin-name]/
├── .claude-plugin/plugin.json    # name, version, description, author
├── README.md
├── commands/*.md                 # Slash commands (YAML frontmatter)
├── agents/*.md                   # Custom agents (YAML frontmatter)
└── skills/[skill-name]/SKILL.md  # Auto-activating skills
```

`plugin.json` allowed fields: `name`, `version`, `description`, `author`, `repository`, `homepage`, `license`, `keywords`.

### MCP Server Plugin

```
plugins/mcp/[plugin-name]/
├── .claude-plugin/plugin.json
├── src/*.ts
├── dist/index.js                 # Must be executable (shebang + chmod +x)
├── package.json
└── .mcp.json
```

## SKILL.md Frontmatter

**Required fields:**

```yaml
---
name: skill-name
description: |
  Capability summary. Use when ... Trigger with "...".
allowed-tools: Read, Write, Edit, Bash, Glob
version: 1.0.0
author: Name <email>
license: MIT
compatibility: Designed for Claude Code
tags: [devops, ci]
---
```

**Optional fields:**

```yaml
# when_to_use: "Trigger phrases or example requests."  # combined with description, cap 1,536 chars
# argument-hint: "<file-path>"
# arguments: issue branch                  # named positional args ($issue, $branch in body)
# paths: src/**/*.py                       # glob patterns limiting auto-activation
# user-invocable: false                    # hide from / menu
# disable-model-invocation: true           # manual /name only
# model: sonnet                            # haiku / sonnet / opus
# effort: medium                           # low / medium / high / xhigh / max
# context: fork                            # run in isolated subagent
# agent: Explore
# hooks: { PreToolUse: [...] }
# metadata: { custom: ... }
```

**Valid `allowed-tools` values:** `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Task`, `TodoWrite`, `NotebookEdit`, `AskUserQuestion`, `Skill`

**Path variables in skills:**

- `${CLAUDE_SKILL_DIR}` — skill's directory at runtime
- `${CLAUDE_PLUGIN_ROOT}` — plugin root
- `${CLAUDE_PLUGIN_DATA}` — persistent plugin state

**Dynamic Context Injection (DCI):**

```
!`command`
```

Runs at skill activation time. Output injected into skill body. Always add fallbacks:

```
!`terraform version 2>/dev/null || echo 'not installed'`
```

**Deprecated:** `compatible-with` field — migrate with `python3 scripts/batch-remediate.py --migrate-compatible-with`.

## Agent Frontmatter

```yaml
---
name: agent-name
description: '20-200 char description'
capabilities: ['capability1', 'capability2']
# model: sonnet
# effort: low|medium|high
# maxTurns: 10
# disallowedTools: ["mcp__servername"]   # denylist (opposite of skills' allowed-tools)
---
```

## Adding a New Plugin

1. Copy a template from `templates/` (minimal-plugin, skill-plugin, command-plugin, agent-plugin, full-plugin)
2. Create `.claude-plugin/plugin.json`
3. Add entry to `.claude-plugin/marketplace.extended.json`
4. `pnpm run sync-marketplace`
5. `python3 scripts/validate-skills-schema.py --verbose plugins/[category]/[name]/`
6. `ccpi link <name>` → `/reload-plugins` in Claude Code → iterate → `ccpi unlink <name>` when done

## Git Hooks

| Hook         | What it does                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `commit-msg` | commitlint — enforces conventional commit format                                                                                       |
| `pre-commit` | If `marketplace.extended.json` staged: runs `sync-marketplace` + auto-stages derived files. Always: lint-staged + audit-harness verify |
| `pre-push`   | Warns (does not block) when branch is behind `origin/main`                                                                             |

## Conventions

- **Hooks:** Use `${CLAUDE_PLUGIN_ROOT}` for portability
- **Scripts:** All `.sh` files must be `chmod +x`
- **Model IDs in skills:** Use `sonnet`, `haiku`, or `opus` (not full model IDs)
- **CSS colors (if any):** OKLCH values, never hex/rgb
