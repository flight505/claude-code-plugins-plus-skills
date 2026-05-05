#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
PreToolUse Hook: Deletion Guard

Prevents deletion of critical files/directories.
Blocks dangerous rm/trash commands before execution.

Usage in .claude/settings.json:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          if: "Bash(rm *)|Bash(trash *)"
          command: "uv run \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validators/deletion-guard.py"
"""

import json
import sys
import re
from pathlib import Path
from datetime import datetime

LOG_FILE = Path(__file__).parent / "deletion-guard.log"

# Critical paths that should never be deleted
PROTECTED_PATHS = [
    ".git",
    ".claude",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    ".env",
]


def log(message: str):
    """Log message to file for debugging."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def is_deletion_command(command: str) -> bool:
    """Check if command is a deletion command."""
    deletion_patterns = [
        r'\brm\s+',
        r'\btrash\s+',
        r'\brm\b.*-rf\b',
        r'\brm\b.*-fr\b',
    ]
    return any(re.search(p, command) for p in deletion_patterns)


def extract_deletion_targets(command: str) -> list[str]:
    """Extract file/directory paths from deletion command."""
    parts = command.split()
    targets = []
    for part in parts:
        if part.startswith('-'):
            continue
        if part in ['rm', 'trash', 'sudo']:
            continue
        if '/' in part or '.' in part:
            targets.append(part)
    return targets


def check_protected_paths(targets: list[str]) -> list[str]:
    """Check if any targets are protected paths."""
    violations = []
    for target in targets:
        target_path = Path(target)
        if target_path.name in PROTECTED_PATHS:
            violations.append(target)
            continue
        for protected in PROTECTED_PATHS:
            protected_path = Path(protected)
            try:
                if protected_path in target_path.parents or target_path == protected_path:
                    violations.append(f"{target} (contains {protected})")
                    break
            except ValueError:
                pass
    return violations


def main():
    log("=" * 50)
    log("DELETION GUARD (PreToolUse)")

    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    tool_name = hook_input.get("tool_name", "")
    if tool_name != "Bash":
        print(json.dumps({}))
        return

    command = hook_input.get("tool_input", {}).get("command", "")
    log(f"Command: {command}")

    if not is_deletion_command(command):
        log("PASS: Not a deletion command")
        print(json.dumps({}))
        return

    log("WARNING: Deletion command detected")
    targets = extract_deletion_targets(command)
    violations = check_protected_paths(targets)

    if violations:
        log(f"BLOCK: Protected paths: {violations}")
        reason = "Deletion of protected paths blocked:\n\n"
        reason += "\n".join(f"  {v}" for v in violations)
        reason += "\n\nProtected: " + ", ".join(PROTECTED_PATHS)
        reason += "\n\nDelete these manually if needed."

        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason
            }
        }))
    else:
        log("PASS: No protected paths affected")
        print(json.dumps({}))


if __name__ == "__main__":
    main()
