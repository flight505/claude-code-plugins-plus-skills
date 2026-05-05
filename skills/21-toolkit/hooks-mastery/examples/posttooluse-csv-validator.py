#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pandas"]
# ///

"""
PostToolUse Hook: CSV Validator

Validates CSV files after Edit|Write operations.
Ensures CSVs are parseable and non-empty.

Usage in .claude/settings.json or command frontmatter:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/csv-validator.py"
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd

LOG_FILE = Path(__file__).parent / "csv-validator.log"


def log(message: str):
    """Log message to file for debugging."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def validate_csv_parseable(file_path: Path) -> list[str]:
    """
    Validate that a CSV file can be parsed and is not empty.

    Returns:
        List of error messages (empty list if valid)
    """
    errors = []

    # Check file exists
    if not file_path.exists():
        return [f"File not found: {file_path}"]

    # Try to parse CSV
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return [f"Failed to parse CSV {file_path.name}: {e}"]

    # Check if empty
    if len(df) == 0:
        errors.append(f"{file_path.name}: CSV file is empty (no rows)")

    # Check if has columns
    if len(df.columns) == 0:
        errors.append(f"{file_path.name}: CSV has no columns")

    return errors


def main():
    log("=" * 50)
    log("CSV VALIDATOR (PostToolUse)")

    # Read hook input from stdin
    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    # Extract file path
    tool_input = hook_input.get("tool_input", {})
    file_path_str = tool_input.get("file_path")

    if not file_path_str:
        log("WARNING: No file_path in tool_input, skipping validation")
        print(json.dumps({}))  # Pass
        return

    file_path = Path(file_path_str)
    log(f"File: {file_path}")

    # Only validate CSV files
    if file_path.suffix.lower() != ".csv":
        log(f"SKIP: Not a CSV file (suffix: {file_path.suffix})")
        print(json.dumps({}))  # Pass
        return

    log("Validating CSV structure...")

    # Perform validation
    errors = validate_csv_parseable(file_path)

    # Output decision
    if errors:
        log(f"BLOCK: Found {len(errors)} error(s)")
        for error in errors:
            log(f"  - {error}")

        print(json.dumps({
            "decision": "block",
            "reason": f"Resolve CSV errors in {file_path.name}:\n" + "\n".join(f"• {e}" for e in errors)
        }))
    else:
        log("PASS: CSV validation successful")
        print(json.dumps({}))  # Pass


if __name__ == "__main__":
    main()
