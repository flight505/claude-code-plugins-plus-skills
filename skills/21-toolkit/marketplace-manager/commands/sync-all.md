---
name: sync-all
description: Sync all submodules with uncommitted pointer changes to marketplace.json
arguments: none
---

# Sync All Changed Plugins

Synchronize all plugins with uncommitted submodule pointer changes to marketplace.json in one operation.

## Usage

```
/marketplace:sync-all
```

**Arguments:** None

## Workflow

When this command is invoked:

1. **Detect changed submodules** - Run `git diff --submodule` to find uncommitted pointer changes
2. **Read all versions** - Get version from each changed plugin's plugin.json
3. **Update marketplace.json** - Update all changed plugins in plugins[] array
4. **Bump marketplace version** - Increment patch once (X.Y.Z → X.Y.Z+1)
5. **Commit and push** - Single commit for all changes

## Implementation

Use the `scripts/sync-marketplace.py` script with `--all` flag:

```bash
python scripts/sync-marketplace.py --all
```

## Output Format

```
Detected changed submodules: <plugin-1>, <plugin-2>
✓ Read <plugin-1> version: X.Y.Z
✓ Read <plugin-2> version: A.B.C
✓ Updated marketplace.json
✓ Bumped marketplace version: M.N.O → M.N.O+1
✓ Committed and pushed

Synced 2 plugins: <plugin-1> vX.Y.Z, <plugin-2> vA.B.C to marketplace vM.N.O+1
```

## When to Use

Use `sync-all` when:

- You've updated multiple plugins and want to sync them together
- You want one clean marketplace commit instead of multiple
- You're unsure which submodules have changed

## Detecting Changed Submodules

Git command used:

```bash
git diff --submodule | grep "^Submodule" | grep "new commits" | awk '{print $2}'
```

Example output:

```
sdk-bridge
nano-banana
```

## Error Handling

**Not in marketplace root:**

```
Error: marketplace-manager can only run from marketplace root
```

**No changed submodules:**

```
No submodule changes detected
All plugins already synchronized
```

**Plugin.json missing for changed submodule:**

```
Warning: Could not read version for <plugin-name>
Skipping <plugin-name>
```

## Examples

```bash
# After updating multiple submodules
cd ~/Projects/Dev_projects/Claude_SDK/flight505-marketplace
git status
# Output: modified: sdk-bridge (new commits)
#         modified: nano-banana (new commits)

/marketplace:sync-all
# → Syncs both in one operation
```

## Comparison to Individual Sync

**Using sync-all (recommended):**

```bash
/marketplace:sync-all
# Result: 1 marketplace commit
```

**Using individual sync:**

```bash
/marketplace:sync sdk-bridge
/marketplace:sync nano-banana
# Result: 2 marketplace commits
```

Use `sync-all` for cleaner git history.
