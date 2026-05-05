#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
Stop Hook: Ruff Linter Validator

Runs ruff linter when command/agent completes.
Blocks completion if linting fails.

Usage in command frontmatter or .claude/settings.json:
  Stop:
    - hooks:
        - type: command
          command: "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/ruff-validator.py"
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

LOG_FILE = Path(__file__).parent / "ruff-validator.log"


def log(message: str):
    """Log message to file for debugging."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def run_ruff(project_dir: Path) -> tuple[bool, str]:
    """
    Run ruff linter on the project directory.

    Returns:
        (success: bool, output: str)
    """
    try:
        result = subprocess.run(
            ["ruff", "check", str(project_dir)],
            capture_output=True,
            text=True,
            timeout=30
        )

        output = result.stdout + result.stderr

        # ruff returns 0 if no issues, non-zero if issues found
        success = result.returncode == 0

        return success, output

    except FileNotFoundError:
        return False, "ruff not found - install with: pip install ruff"
    except subprocess.TimeoutExpired:
        return False, "ruff check timed out after 30 seconds"
    except Exception as e:
        return False, f"Error running ruff: {e}"


def main():
    log("=" * 50)
    log("RUFF VALIDATOR (Stop)")

    # Read hook input from stdin
    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    # Get project directory from environment or fallback
    import os
    project_dir_str = os.environ.get("CLAUDE_PROJECT_DIR")

    if not project_dir_str:
        log("WARNING: CLAUDE_PROJECT_DIR not set, using current directory")
        project_dir = Path.cwd()
    else:
        project_dir = Path(project_dir_str)

    log(f"Project directory: {project_dir}")

    # Run ruff
    log("Running ruff linter...")
    success, output = run_ruff(project_dir)

    # Output decision
    if success:
        log("PASS: No linting issues found")
        print(json.dumps({}))  # Pass
    else:
        log("BLOCK: Linting issues found")
        log(f"Output:\n{output}")

        # Format error message for Claude
        error_message = "Ruff linting failed. Fix these issues:\n\n" + output

        print(json.dumps({
            "decision": "block",
            "reason": error_message
        }))


if __name__ == "__main__":
    main()
