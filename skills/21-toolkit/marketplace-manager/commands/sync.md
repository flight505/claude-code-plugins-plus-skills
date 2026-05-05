---
name: sync
description: Sync one plugin's version from submodule to marketplace.json
arguments: <plugin-name>
---

# Sync Plugin to Marketplace

Synchronize a single plugin's version from its submodule to marketplace.json and bump marketplace version.

## Usage

```
/marketplace:sync <plugin-name>
```

**Arguments:**

- `<plugin-name>` - Plugin to sync (sdk-bridge, storybook-assistant, claude-project-planner, nano-banana)

## Workflow

When this command is invoked:

1. **Verify location** - Check for `.claude-plugin/marketplace.json`
2. **Validate plugin** - Ensure submodule exists
3. **Read version** - Get version from `<plugin-name>/.claude-plugin/plugin.json`
4. **Update marketplace.json** - Update plugins[] array
5. **Bump marketplace version** - Increment patch (X.Y.Z → X.Y.Z+1)
6. **Commit and push** - Single commit with descriptive message

## Implementation

Use the `scripts/sync-marketplace.py` script with plugin name argument:

```bash
python scripts/sync-marketplace.py <plugin-name>
```

## Output Format

```
✓ Read <plugin-name> version: X.Y.Z
✓ Updated marketplace.json
✓ Bumped marketplace version: A.B.C → A.B.C+1
✓ Committed and pushed

Synced <plugin-name> vX.Y.Z to marketplace vA.B.C+1
```

## Error Handling

**Not in marketplace root:**

```
Error: marketplace-manager can only run from marketplace root
Expected: .claude-plugin/marketplace.json
```

**Plugin not found:**

```
Error: Plugin '<plugin-name>' not found
Available plugins: sdk-bridge, storybook-assistant, claude-project-planner, nano-banana
```

**Plugin.json missing:**

```
Error: Plugin manifest not found: <plugin-name>/.claude-plugin/plugin.json
```

**Version read failure:**

```
Error: Could not read version from plugin.json
```

## Examples

```bash
cd ~/Projects/Dev_projects/Claude_SDK/flight505-marketplace
/marketplace:sync sdk-bridge
```
