# ccpi Quick Guide

`ccpi` is the local CLI for this fork of the Tons of Skills repo. It manages **skills** (auto-activating AI instructions) and supports **local plugin development** via symlinks. This fork is not published to npm — everything runs from the local build.

## Install (one-time)

```bash
cd /path/to/claude-code-plugins-plus-skills
cd packages/cli && pnpm build
ln -sf "$(pwd)/dist/index.js" ~/.local/bin/ccpi   # or any dir on your PATH
```

After editing `packages/cli/src/`, just rebuild — no re-linking needed:

```bash
cd packages/cli && pnpm build
```

## Concepts

| Thing       | What it is                                       | Where it lives                                                  |
| ----------- | ------------------------------------------------ | --------------------------------------------------------------- |
| **Skill**   | Single SKILL.md that Claude auto-activates       | `~/.claude/skills/` or `<project>/.claude/skills/`              |
| **Plugin**  | Full extension — commands, agents, hooks, skills | `~/.claude/plugins/`                                            |
| **Surface** | Where a skill is installed                       | `claude` (global), `project`, `antigravity`, `gemini`, `cursor` |

---

## Skills

519 skills across 21 categories. Read directly from the local `skills/` directory — no marketplace or npm needed. Installed as symlinks, hot-reloaded by Claude Code.

### Browse

```bash
ccpi skills list                          # all 519, grouped by category
ccpi skills list --category security      # partial-match category filter
ccpi skills list --surface project        # check what's installed in current project
ccpi skills list --json                   # machine-readable (for scripting/DCI)
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
ccpi search kubernetes                   # skills + upstream plugins, interactive install
ccpi search "api testing" --skills-only  # skills only (local, fast)
ccpi search terraform --json             # machine-readable output
```

Results are numbered. In a TTY, you'll be prompted to install any matching skill by number.

---

## Local Plugin Development

Use `ccpi link` to symlink a local plugin directory into Claude Code without publishing or reinstalling. Changes in the source directory take effect immediately.

```bash
ccpi link <plugin-name>               # catalog lookup from repo root
ccpi link --source ./plugins/cat/name # explicit path (works from anywhere)
ccpi unlink <plugin-name>             # remove symlink + clean registry
ccpi links                            # list all linked plugins with health status
```

Then run `/reload-plugins` in Claude Code to activate.

---

## Validate

```bash
ccpi validate                  # validate everything in cwd
ccpi validate --skills         # skills only
ccpi validate --strict         # exit 1 on warnings (CI mode)
ccpi validate --json           # JSON output
```

---

## Tutorials

```bash
ccpi tutorials          # list 11 Jupyter notebooks
ccpi tutorials 7        # open tutorial #7 in Jupyter/browser
```

Notebooks cover: skills (5), plugins (4), orchestration (2).

---

## Diagnostics

```bash
ccpi doctor           # check Claude Code installation and plugin health
ccpi doctor --fix     # auto-fix safe issues (create dirs, refresh catalogs)
ccpi doctor --json    # JSON output
```

---

## Quick Recipes

```bash
# Set up skills for a new project
ccpi skills install claude-docs-skill hooks-mastery --surface project

# Re-link Antigravity skills after moving the repo
ccpi skills install --all --surface antigravity

# Export the full catalog for a script or DCI
ccpi skills list --json > /tmp/skills-catalog.json

# Find and install a skill in one step
ccpi search "docker compose"

# Dev-test a plugin locally without publishing
ccpi link --source ./plugins/mycat/my-plugin
# → edit → Claude Code hot-reloads →
ccpi unlink my-plugin   # when done
```

---

## Troubleshooting

| Problem                                  | Fix                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `ccpi: command not found`                | Check `~/.local/bin` is in PATH; verify symlink with `ls -la ~/.local/bin/ccpi`      |
| "Claude Code config directory not found" | Run Claude Code once first, then retry                                               |
| Skill not found                          | `ccpi skills list` — check exact name; partial category names work with `--category` |
| Antigravity skills stale after repo move | `ccpi skills install --all --surface antigravity`                                    |
| Any install weirdness                    | `ccpi doctor --fix`                                                                  |

Full command help: `ccpi help <command>`
