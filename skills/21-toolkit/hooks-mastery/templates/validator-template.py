#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
Basic Validator Template

Copy this template and modify for your specific validation needs.

Usage:
1. Copy to .claude/hooks/validators/ and rename
2. Modify validate_your_condition() with your logic
3. Choose the right output pattern for your hook event (see STEP 6)
4. Add to .claude/settings.json with appropriate matcher and optional `if`
5. Make executable: chmod +x validator.py

Example settings.json entry:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "uv run \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validators/your-validator.py"

For PreToolUse hooks, add `if` to reduce overhead:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          if: "Bash(git *)"
          command: "uv run \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validators/your-validator.py"
"""

import json
import sys
from pathlib import Path
from datetime import datetime

ENABLE_LOGGING = True
LOG_FILE = Path(__file__).parent / "validator.log"


def log(message: str):
    if not ENABLE_LOGGING:
        return
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def find_project_root(start_path: Path, anchor_files: list[str]) -> Path:
    """Walk up directory tree until finding a directory with an anchor file."""
    current = start_path.resolve()
    for _ in range(10):
        for anchor in anchor_files:
            if (current / anchor).exists():
                log(f"Found project root at {current} (anchor: {anchor})")
                return current
        if current.parent == current:
            break
        current = current.parent
    raise FileNotFoundError(
        f"Could not find project root from {start_path}. "
        f"Searched for anchor files: {anchor_files}"
    )


def verify_project_root(project_root: Path, expected_paths: list[str]) -> list[str]:
    """Returns list of missing paths (empty = all verified)."""
    missing = []
    for path in expected_paths:
        if not (project_root / path).exists():
            missing.append(path)
            log(f"  Missing: {path}")
        else:
            log(f"  Found: {path}")
    return missing


def validate_your_condition(project_root: Path, file_path: Path) -> list[str]:
    """YOUR VALIDATION LOGIC HERE. Returns list of errors (empty = pass)."""
    errors = []
    # Add your checks here
    return errors


def block_pretooluse(reason: str):
    """Output block decision for PreToolUse hooks (hookSpecificOutput pattern)."""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason
        }
    }))


def block_posttooluse_or_stop(reason: str):
    """Output block decision for PostToolUse/Stop hooks (top-level pattern)."""
    print(json.dumps({
        "decision": "block",
        "reason": reason
    }))


def main():
    log("=" * 50)
    log("YOUR VALIDATOR NAME")

    # STEP 1: Read hook input
    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})
    hook_event = hook_input.get("hook_event_name", "")
    log(f"Tool: {tool_name}, Event: {hook_event}")

    # STEP 2: For Stop hooks — guard against infinite loops
    # if hook_event == "Stop" and hook_input.get("stop_hook_active"):
    #     print(json.dumps({}))
    #     return

    # STEP 3: Find project root (if needed)
    try:
        project_root = find_project_root(
            Path(__file__).parent,
            anchor_files=[".git", "package.json", "pyproject.toml"]
        )
    except FileNotFoundError as e:
        log(f"ERROR: {e}")
        block_posttooluse_or_stop(f"Validator configuration error: {e}")
        return

    # STEP 4: Pre-flight check
    missing = verify_project_root(project_root, [".claude"])
    if missing:
        block_posttooluse_or_stop(
            f"Validator config error!\n"
            f"Project root: {project_root}\n"
            f"Missing: {missing}\n"
            f"The validator needs fixing, not the code."
        )
        return

    # STEP 5: Run validation
    file_path_str = tool_input.get("file_path", "")
    if not file_path_str:
        print(json.dumps({}))
        return

    file_path = Path(file_path_str)
    errors = validate_your_condition(project_root, file_path)

    # STEP 6: Output decision — choose the right pattern for your event
    if errors:
        reason = "Fix these issues:\n" + "\n".join(f"  {e}" for e in errors)

        # For PreToolUse hooks:
        # block_pretooluse(reason)

        # For PostToolUse/Stop hooks:
        block_posttooluse_or_stop(reason)
    else:
        log("PASS")
        print(json.dumps({}))


if __name__ == "__main__":
    main()
