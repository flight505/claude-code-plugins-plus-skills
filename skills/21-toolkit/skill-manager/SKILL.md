---
name: skill-manager
description: Install, remove, and manage Claude Code skills dynamically with hot-reload. Use when the user wants to add or remove skills, list available or installed skills, check the skill catalog, or troubleshoot skill installation.
---

# Skill Manager

Manage Claude Code skills dynamically without restarting. Leverages Claude Code 2.1.0+ hot-reload feature for immediate skill availability.

## Path Resolution

Skills are **symlinked** into projects from the toolkit source at `<workspace>/.claude/skills/`.

```bash
WORKSPACE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SKILLS_DIR="$WORKSPACE_ROOT/.claude/skills"
```

Only 2 global skills (install-and-maintain, install-toolkit-skills) live at `~/.claude/skills/`. All others are symlinked project-locally.

## When to Use

Use this skill when the user wants to:

- Install a new skill from the catalog
- Remove an installed skill
- List available skills in the catalog
- List currently installed skills
- Check if a skill is installed

## How It Works

Skills are **symlinked** from the toolkit source to `<workspace>/.claude/skills/`. This avoids duplicating large reference files (doc skills are 24MB+). Claude Code 2.1.0+ automatically detects new skills without restart — they're immediately available in the current session. Updates to the toolkit source propagate to all linked projects instantly.

## Workflow

### List Available Skills

1. Read the catalog: `${CLAUDE_SKILL_DIR}/../catalog.json`
2. Display available skills with:
   - Name
   - Description
   - Version
   - Category/tags
   - Installation status (installed/not installed)

### Install a Skill

1. Check if skill exists in catalog
2. **Check if already installed** — look for `$SKILLS_DIR/<skill-name>/SKILL.md`. If it exists, tell the user it's already installed. Don't run the install script unless the user wants to reinstall.
3. **Preferred method** — use `ln -sfn` directly (no interactive prompts):
   ```bash
   TOOLKIT_DIR="$HOME/Projects/Dev_projects/Claude_SDK/claude-toolkit/skills"
   ln -sfn "$TOOLKIT_DIR/<skill-name>" "$SKILLS_DIR/<skill-name>"
   ```
4. **Alternative** — use the install script with `--force` for non-interactive reinstalls:
   ```bash
   python "${CLAUDE_SKILL_DIR}/scripts/install-skill.py" --force <skill-name>
   ```
5. Confirm installation successful
6. Inform user the skill is immediately available (no restart needed)

### Remove a Skill

1. Check if skill is installed (symlink or directory) at `$SKILLS_DIR/<skill-name>`
2. Confirm with user before removal
3. Remove the symlink: `rm "$SKILLS_DIR/<skill-name>"` (only removes the link, not the source)
4. Confirm removal successful

### Check Installation Status

1. Check if directory exists: `$SKILLS_DIR/<skill-name>/`
2. Verify SKILL.md exists in the directory
3. Report status to user

## Important Notes

- **Hot-reload**: Installed skills are immediately available without restarting Claude Code
- **Safety**: Always confirm before removing skills
- **Local source**: All skills in this toolkit are local (in claude-toolkit/skills/)
- **Required skill**: skill-manager itself should not be removed (marked as required in catalog)

## Examples

**User:** "List available skills"
→ Read catalog.json
→ Check which are installed
→ Display formatted list

**User:** "Install hooks-mastery skill"
→ Verify in catalog
→ Run install script
→ Confirm: "✓ hooks-mastery symlinked to .claude/skills/ — ready to use!"

**User:** "Remove project-bootstrapper"
→ Confirm: "Are you sure you want to remove project-bootstrapper?"
→ User confirms
→ Remove symlink: `rm "$SKILLS_DIR/project-bootstrapper"`
→ Confirm: "✓ project-bootstrapper removed (symlink only, source intact)"

## Files in This Skill

- `SKILL.md` (this file) - Skill instructions
- `scripts/install-skill.py` - Python script to install skills
- `../catalog.json` - Skill catalog (one level up)

## Installation Script Usage

**Preferred: Direct symlink** (simplest, no dependencies):

```bash
TOOLKIT_DIR="$HOME/Projects/Dev_projects/Claude_SDK/claude-toolkit/skills"
ln -sfn "$TOOLKIT_DIR/<skill-name>" "<workspace>/.claude/skills/<skill-name>"
```

**Alternative: Install script** (validates against catalog):

```bash
python /path/to/skill-manager/scripts/install-skill.py <skill-name>
python /path/to/skill-manager/scripts/install-skill.py --force <skill-name>  # non-interactive
```

The script:

1. Reads catalog.json to find the skill
2. Resolves the source path in the toolkit
3. Creates a symlink from `<workspace>/.claude/skills/<skill>` → toolkit source
4. Validates the installation (SKILL.md reachable via symlink)
5. Outputs success/failure

Use `--force` when running from Claude (avoids interactive y/n prompt that hangs non-interactively).

## Error Handling

- Skill not in catalog → Inform user, list available skills
- Skill already installed → Inform user, ask if they want to reinstall
- Required skill removal attempt → Block and explain it's required
- Installation failure → Show error, suggest troubleshooting

## Reference

**Catalog location:** `${CLAUDE_SKILL_DIR}/../catalog.json`
**Install script:** `${CLAUDE_SKILL_DIR}/scripts/install-skill.py`
**Installation target:** `<workspace>/.claude/skills/` (project-local)
**Claude Code version required:** 2.1.0+ (for hot-reload)
