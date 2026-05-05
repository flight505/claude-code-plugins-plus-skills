#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
File-Specific Validator Template

Template for validators that check specific file types (JSON, YAML, Python, etc.)

Usage:
1. Copy this file to .claude/hooks/validators/
2. Rename to describe your file type (e.g., json-validator.py)
3. Update FILE_EXTENSIONS list
4. Modify validate_file_content function
5. Add to PostToolUse hooks for Edit|Write
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# File extensions to validate (add your target extensions)
FILE_EXTENSIONS = [".json", ".yaml", ".yml"]

# Optional: Enable logging
ENABLE_LOGGING = True
LOG_FILE = Path(__file__).parent / "file-validator.log"


def log(message: str):
    """Log message to file for debugging."""
    if not ENABLE_LOGGING:
        return

    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def validate_file_content(file_path: Path) -> list[str]:
    """
    Validate file content.

    Args:
        file_path: Path to the file to validate

    Returns:
        List of error messages (empty list if valid)
    """
    errors = []

    # Check file exists
    if not file_path.exists():
        return [f"File not found: {file_path}"]

    try:
        content = file_path.read_text()

        # Example validations - replace with your own

        # Check file is not empty
        if not content.strip():
            errors.append(f"{file_path.name} is empty")

        # Example: Validate JSON syntax
        if file_path.suffix == ".json":
            try:
                json.loads(content)
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in {file_path.name}: {e}")

        # Example: Validate YAML syntax
        # if file_path.suffix in [".yaml", ".yml"]:
        #     import yaml
        #     try:
        #         yaml.safe_load(content)
        #     except yaml.YAMLError as e:
        #         errors.append(f"Invalid YAML in {file_path.name}: {e}")

        # Add your custom validation logic here
        # For example:
        # - Check required fields in JSON
        # - Validate schema
        # - Check formatting
        # - Verify constraints

    except Exception as e:
        errors.append(f"Error reading {file_path.name}: {e}")

    return errors


def main():
    log("=" * 50)
    log("FILE VALIDATOR (PostToolUse)")

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

    # Check if file extension matches our targets
    if file_path.suffix.lower() not in FILE_EXTENSIONS:
        log(f"SKIP: Not a target file type (suffix: {file_path.suffix})")
        log(f"Target extensions: {FILE_EXTENSIONS}")
        print(json.dumps({}))  # Pass
        return

    log(f"Validating {file_path.suffix} file...")

    # Perform validation
    errors = validate_file_content(file_path)

    # Output decision
    if errors:
        log(f"BLOCK: Found {len(errors)} error(s)")
        for error in errors:
            log(f"  - {error}")

        error_message = f"Validation failed for {file_path.name}:\n\n"
        error_message += "\n".join(f"• {e}" for e in errors)

        print(json.dumps({
            "decision": "block",
            "reason": error_message
        }))
    else:
        log("PASS: File validation successful")
        print(json.dumps({}))  # Pass


if __name__ == "__main__":
    main()
