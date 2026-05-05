#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
PreToolUse Hook: Git Policy

Blocks force-pushes and pushes to main/master.
Demonstrates the `if` field for efficient filtering.

Usage in .claude/settings.json:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          if: "Bash(git *)"
          command: "uv run \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validators/git-policy.py"

The `if: "Bash(git *)"` ensures this script only spawns for git commands,
not every Bash call. Without it, every `ls`, `npm test`, etc. would spawn
this process just to exit immediately.
"""

import json
import sys
import re
from datetime import datetime
from pathlib import Path

LOG_FILE = Path(__file__).parent / "git-policy.log"


def log(message: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def check_git_policy(command: str) -> str | None:
    """
    Check git command against policy rules.

    Returns:
        Error message if blocked, None if allowed.
    """
    # Block force-push
    if re.search(r'\bpush\b.*--force\b', command) or re.search(r'\bpush\b.*-f\b', command):
        return "Force-push is blocked by project policy. Use --force-with-lease instead."

    # Block push to main/master
    if re.search(r'\bpush\b.*\b(origin\s+)?(main|master)\b', command):
        return "Direct push to main/master is blocked. Use a feature branch and create a PR."

    # Block reset --hard on tracked branches
    if re.search(r'\breset\b.*--hard\b', command):
        return "git reset --hard is blocked. Use git stash or git checkout -- <file> instead."

    return None


def main():
    log("=" * 50)
    log("GIT POLICY (PreToolUse)")

    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    command = hook_input.get("tool_input", {}).get("command", "")
    log(f"Command: {command}")

    violation = check_git_policy(command)

    if violation:
        log(f"BLOCK: {violation}")
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": violation
            }
        }))
    else:
        log("PASS: Git command allowed")
        print(json.dumps({}))


if __name__ == "__main__":
    main()
