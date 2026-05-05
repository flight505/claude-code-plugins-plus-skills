# [Project Name] - Self-Validating Configuration

## Overview

<!-- Brief description of what this project does -->

This project uses Claude Code hooks for automatic validation and self-correction.

## Tech Stack

<!-- List main technologies, frameworks, languages -->

## Automatic Validation

This project is configured with hooks that automatically validate changes:

### PostToolUse Hooks (Real-Time Validation)

Runs after `Edit` or `Write` operations:

- **template-validator.py** - Example validator (customize for your needs)

**How it works:**

1. Claude makes a change (Edit/Write)
2. Validator runs automatically
3. If validation fails, Claude sees errors and fixes them
4. Process repeats until validation passes

### Stop Hooks (Final Quality Gates)

Runs when command or task completes:

- **ruff-validator.py** - Python linting (if Python project)

**How it works:**

1. Claude completes a task
2. All Stop validators run
3. If any fail, Claude can't finish until fixed
4. Ensures final code passes all checks

## Customizing Validators

### Add New Validator

1. Copy `hooks/validators/template-validator.py`
2. Rename to describe your check (e.g., `json-schema-validator.py`)
3. Modify validation logic
4. Add to `.claude/settings.json` hooks
5. Make executable: `chmod +x hooks/validators/your-validator.py`

### Remove Validator

1. Remove from `.claude/settings.json` hooks
2. Delete validator file (or keep for reference)

### Modify Existing Validator

Open the validator file and adjust:

- `FILE_EXTENSIONS` - Which files to validate
- `validate_*` function - Validation logic
- Error messages - What Claude sees when validation fails

## Project Structure

```
project-root/
├── .claude/
│   ├── settings.json              # Hook configuration
│   ├── CLAUDE.md                  # This file
│   ├── commands/
│   │   └── build.md              # Example command with hooks
│   └── hooks/
│       └── validators/
│           ├── ruff-validator.py       # Python linter
│           └── template-validator.py   # Customize this
├── src/           # Source code
└── tests/         # Tests
```

## Common Commands

```bash
# Development
# Build
# Test
# Lint (manual): ruff check .
```

## Development Workflow

1. Make changes
2. Validators run automatically
3. Claude sees errors and fixes them
4. Final checks run on completion
5. Everything passes before task finishes

**Result:** Self-correcting, high-quality code

## Hook References

For more about hooks and validators:

- Use the `hooks-mastery` skill
- Read `.claude/hooks/validators/` example code
- See [Claude Code hooks documentation](https://github.com/anthropics/claude-code/blob/main/docs/hooks.md)

## Resources

<!-- Links to documentation, related repos, etc. -->
