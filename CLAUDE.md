# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Repository Overview

Personal fork of the Tons of Skills plugin catalog. This is a **local development environment** for `ccpi` — the Claude Code plugin & skills CLI.

**Runtime:** Node `>=20.0.0`, pnpm `>=9.0.0` (pinned to `9.15.9`)

**Workspace members** (`pnpm-workspace.yaml`):

- `plugins/mcp/*` — MCP server plugins (TypeScript)
- `plugins/saas-packs/*-pack` — SaaS skill packs
- `packages/cli` — `ccpi` CLI (**local fork, not on npm**; symlinked: `~/.local/bin/ccpi → packages/cli/dist/index.js`)

## Essential Commands

```bash
# CLI — rebuild after any change to packages/cli/src/
cd packages/cli && pnpm build               # rebuild dist/ (symlink picks it up automatically)
cd packages/cli && pnpm test                # run CLI tests
cd packages/cli && pnpm test -- --grep "pattern"  # single test

# ccpi skill commands
ccpi skills list                            # all 519 skills grouped by category
ccpi skills list --category security        # filter by category
ccpi skills list --json                     # machine-readable
ccpi skills install <name> --surface project  # install skill into current project
ccpi skills remove <name> --surface project

# ccpi plugin dev (symlink local plugin into Claude Code)
ccpi link <plugin-name>                     # catalog lookup from git root
ccpi link --source ./plugins/cat/name       # explicit path
ccpi unlink <plugin-name>                   # remove symlink
ccpi links                                  # list linked plugins
# After link/unlink: run /reload-plugins in Claude Code to activate

# ccpi search and tutorials
ccpi search <query>                         # search skills + plugins
ccpi tutorials                              # list 11 Jupyter notebooks
ccpi tutorials <number>                     # open a tutorial

# Validate skills schema
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

# Catalog: if you edit .claude-plugin/marketplace.extended.json, regenerate marketplace.json
pnpm run sync-marketplace

# Quick test (build + lint + validate)
./scripts/quick-test.sh
```

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
