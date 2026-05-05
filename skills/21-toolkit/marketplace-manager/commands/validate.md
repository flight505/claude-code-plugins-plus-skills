---
name: validate
description: Run all marketplace validators manually
arguments: none
---

# Validate Marketplace

Run all marketplace validators manually to check plugin manifests and synchronization status.

## Usage

```
/marketplace:validate
```

**Arguments:** None

## Workflow

When this command is invoked:

1. **Find validators** - List all `.claude/hooks/validators/*.py` scripts
2. **Execute each validator** - Run with `uv run`
3. **Parse results** - Check exit codes and output
4. **Format output** - Present readable summary
5. **Report status** - Pass/fail with details

## Validators Executed

**plugin-manifest-validator.py**

- Validates all plugin.json files
- Checks required fields present
- Verifies version format
- Ensures valid JSON structure

**marketplace-sync-validator.py**

- Compares submodule versions to marketplace.json
- Detects version drift
- Ensures all plugins synchronized

## Implementation

Execute validators directly:

```bash
for validator in .claude/hooks/validators/*.py; do
  uv run "$validator" < /dev/null
done
```

## Output Format

**Success:**

```
Running marketplace validators...

✓ plugin-manifest-validator.py
  - All 4 plugin manifests valid
  - Required fields present
  - Versions in valid format

✓ marketplace-sync-validator.py
  - marketplace.json versions match submodules
  - All plugins synchronized

All validations passed!
```

**Failure:**

```
Running marketplace validators...

✗ plugin-manifest-validator.py
  - sdk-bridge: Missing 'description' field
  - nano-banana: Invalid version format: 'v1.2.0' (should be '1.2.0')

✗ marketplace-sync-validator.py
  - sdk-bridge version mismatch:
    - Submodule: 4.0.1
    - Marketplace: 4.0.0

Validation failed! Fix errors above.
```

## When to Use

Use `/marketplace:validate` when:

- Before syncing plugins to marketplace
- After making manual edits to plugin.json or marketplace.json
- Debugging sync issues
- Verifying marketplace consistency

## Integration with PostToolUse Hooks

These validators also run automatically via PostToolUse hooks:

- After Edit/Write on plugin.json files
- After Edit/Write on marketplace.json

Manual validation is useful for:

- Checking status without editing files
- Running all validators at once
- Debugging before committing

## Error Handling

**Not in marketplace root:**

```
Error: marketplace-manager can only run from marketplace root
Expected: .claude/hooks/validators/*.py
```

**No validators found:**

```
Warning: No validators found in .claude/hooks/validators/
Expected at least: plugin-manifest-validator.py, marketplace-sync-validator.py
```

**Validator execution failed:**

```
Error: Could not execute plugin-manifest-validator.py
Check that uv is installed and script is executable
```

## Examples

```bash
cd ~/Projects/Dev_projects/Claude_SDK/flight505-marketplace

# Check everything before syncing
/marketplace:validate
# → All validators pass

# Safe to sync
/marketplace:sync sdk-bridge
```

## Validator Exit Codes

Validators use standard exit codes:

- `0` - All checks passed
- `1` - Validation errors found

The `/marketplace:validate` command aggregates these:

- All `0` → "All validations passed!"
- Any `1` → "Validation failed! Fix errors above."

## Best Practices

1. **Run before syncing** - Catch issues early
2. **Run after manual edits** - Verify changes are valid
3. **Run periodically** - Check for drift
4. **Fix errors immediately** - Don't let issues accumulate
