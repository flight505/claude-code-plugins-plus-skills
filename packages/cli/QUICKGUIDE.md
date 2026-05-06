# ccpi Quick Guide

`ccpi` manages **plugins** (full Claude Code extensions) and **skills** (auto-activating AI instructions) from [tonsofskills.com](https://tonsofskills.com).

## Install (local fork)

This is a local fork — `ccpi` is **not on npm**. It runs directly from the built source via a symlink.

```bash
# One-time setup: build and symlink into PATH
cd /path/to/claude-code-plugins-plus-skills
cd packages/cli && pnpm build
ln -sf "$(pwd)/dist/index.js" ~/.local/bin/ccpi   # or any dir on your PATH

# After editing packages/cli/src/, rebuild to pick up changes
cd packages/cli && pnpm build
```

The symlink at `~/.local/bin/ccpi` resolves to `packages/cli/dist/index.js` — rebuilding is enough, no re-linking needed.

## Concepts

| Thing       | What it is                                       | Where it lives                                                  |
| ----------- | ------------------------------------------------ | --------------------------------------------------------------- |
| **Plugin**  | Full extension — commands, agents, hooks, skills | `~/.claude/plugins/`                                            |
| **Skill**   | Single SKILL.md that Claude auto-activates       | `~/.claude/skills/` or `<project>/.claude/skills/`              |
| **Surface** | Where a skill is installed                       | `claude` (global), `project`, `antigravity`, `gemini`, `cursor` |

---

## Plugins

```bash
# Add the marketplace (one-time, run inside Claude Code)
/plugin marketplace add jeremylongshore/claude-code-plugins

# Install a plugin
ccpi install devops-pack

# Install all plugins
ccpi install --all

# Install a pack or category
ccpi install --pack devops
ccpi install --category security

# List installed plugins
ccpi list
ccpi list --all          # include available-but-not-installed

# Check for updates
ccpi upgrade --check
ccpi upgrade --all
ccpi upgrade --plugin devops-pack

# Diagnose issues
ccpi doctor
ccpi doctor --fix        # auto-fix safe issues
```

### Local plugin dev mode (symlink, live reload)

```bash
ccpi link <plugin-name>              # from repo root (catalog lookup)
ccpi link --source ./path/to/plugin  # explicit path, works anywhere
ccpi unlink <plugin-name>            # remove symlink + clean registry
ccpi links                           # list linked plugins + health status
```

Then run `/reload-plugins` in Claude Code to activate.

---

## Skills

519 skills across 21 categories. Installed as symlinks — no restart needed.

### Browse

```bash
ccpi skills list                         # all 519, grouped by category
ccpi skills list --category security     # partial-match category filter
ccpi skills list --surface project       # check current project installs
ccpi skills list --json                  # machine-readable (for scripting/DCI)
```

### Install

```bash
ccpi skills install hooks-mastery --surface project    # single skill
ccpi skills install --category devops --surface claude # whole category
ccpi skills install --all --surface project            # all 519

# Surface options:
#   claude      → ~/.claude/skills/           (global, all projects)
#   project     → <git-root>/.claude/skills/  (current project only)
#   antigravity → ~/.gemini/antigravity/skills/
#   gemini      → ~/.gemini/skills/
#   cursor      → ~/.cursor/skills/
```

### Remove

```bash
ccpi skills remove hooks-mastery --surface project
```

---

## Search

```bash
ccpi search kubernetes              # skills + plugins, interactive install
ccpi search "api testing" --skills-only
ccpi search docker --plugins-only
ccpi search terraform --json        # machine-readable output
```

Results are numbered. In a TTY, you'll be prompted to install any skill by number.

---

## Validate

```bash
ccpi validate                        # validate everything in cwd
ccpi validate --skills               # skills only
ccpi validate --strict               # exit 1 on warnings (CI mode)
ccpi validate --json                 # JSON output
```

---

## Tutorials

```bash
ccpi tutorials                 # list 11 Jupyter notebooks
ccpi tutorials 7               # open tutorial #7 in Jupyter/browser
```

Notebooks cover: skills (5), plugins (4), orchestration (2).

---

## Marketplace

```bash
ccpi marketplace                 # check connection status
ccpi marketplace --verify        # detailed diagnostics
ccpi marketplace-add             # guided setup
ccpi marketplace-remove          # guided removal
```

---

## Quick Recipes

```bash
# Start fresh on a new project
ccpi doctor
ccpi skills install claude-docs-skill hooks-mastery --surface project

# Re-link Antigravity skills after moving the repo
ccpi skills install --all --surface antigravity

# Export the full catalog for a script or DCI
ccpi skills list --json > /tmp/skills-catalog.json

# Find and install a skill in one step
ccpi search "docker compose" --surface project

# Dev-test a local plugin without publishing
ccpi link --source ./my-new-plugin
# → iterate → ccpi unlink my-new-plugin when done
```

---

## Troubleshooting

| Problem                                  | Fix                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| "Claude Code config directory not found" | Run Claude Code once first, then retry                                             |
| Skill not found                          | `ccpi skills list` — check exact name; partial category names work in `--category` |
| Plugin not found                         | `ccpi list --all` or browse tonsofskills.com                                       |
| Antigravity skills stale after repo move | `ccpi skills install --all --surface antigravity`                                  |
| Any install weirdness                    | `ccpi doctor --fix`                                                                |

Full docs: `ccpi help <command>` · [tonsofskills.com](https://tonsofskills.com)
