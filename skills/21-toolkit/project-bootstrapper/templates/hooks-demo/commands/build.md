---
description: Build and validate project
hooks:
  Stop:
    - hooks:
        - type: command
          command: 'uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/ruff-validator.py'
---

# Build Command

Build the project and ensure it passes all quality checks.

## Workflow

1. Build the project (customize command below)
2. Run Stop hooks (validators) automatically
3. Fix any issues found
4. Complete when all checks pass

## Build Steps

<!-- Customize these steps for your project -->

1. **Install dependencies** (if needed)

   ```bash
   # pip install -r requirements.txt
   # npm install
   # cargo build
   ```

2. **Run build command**

   ```bash
   # python -m build
   # npm run build
   # cargo build --release
   ```

3. **Verify build output**
   - Check build succeeded
   - Note any warnings
   - Confirm artifacts created

## Stop Hooks

This command has Stop hooks configured that run automatically when the command completes:

- **ruff-validator.py** - Python linting

All hooks must pass before the command can finish.

## Customization

To add more validators to this command:

1. Create new validator in `.claude/hooks/validators/`
2. Add to the `hooks:` section in this file's frontmatter
3. Make sure validator is executable

Example:

```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: 'uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/ruff-validator.py'
        - type: command
          command: 'uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/type-checker.py'
```
