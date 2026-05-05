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


def find_project_root(start_path: Path, anchor_files: list[str]) -> Path:
    """
    Walk up directory tree until finding a directory with an anchor file.

    Use this if you need to validate files relative to project root.

    Args:
        start_path: Starting point (usually Path(__file__).parent)
        anchor_files: Files indicating project root (e.g., [".git", "package.json"])

    Returns:
        Path to project root

    Raises:
        FileNotFoundError: If no anchor found within max_depth
    """
    current = start_path.resolve()
    max_depth = 10

    for _ in range(max_depth):
        # Check if any anchor file exists at this level
        for anchor in anchor_files:
            if (current / anchor).exists():
                log(f"Found project root at {current} (anchor: {anchor})")
                return current

        # Move up one level
        if current.parent == current:  # Reached filesystem root
            break
        current = current.parent

    raise FileNotFoundError(
        f"Could not find project root from {start_path}. "
        f"Searched for anchor files: {anchor_files}"
    )


def validate_file_content(file_path: Path, project_root: Path | None = None) -> list[str]:
    """
    Validate file content.

    Args:
        file_path: Path to the file to validate
        project_root: Optional project root path (if validation needs it)

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
                data = json.loads(content)

                # Example: Validate JSON structure relative to project
                # if project_root:
                #     # Check for required fields
                #     if "name" not in data:
                #         errors.append("Missing required field: name")
                #
                #     # Check files referenced in JSON exist
                #     if "main" in data:
                #         main_file = project_root / data["main"]
                #         if not main_file.exists():
                #             errors.append(f"Referenced file not found: {data['main']}")

            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in {file_path.name}: {e}")

        # Example: Validate YAML syntax
        # if file_path.suffix in [".yaml", ".yml"]:
        #     import yaml
        #     try:
        #         yaml.safe_load(content)
        #     except yaml.YAMLError as e:
        #         errors.append(f"Invalid YAML in {file_path.name}: {e}")

        # Example: Check file location is correct (using project_root)
        # if project_root:
        #     # Verify file is in expected location
        #     relative_path = file_path.relative_to(project_root)
        #     if not str(relative_path).startswith("src/"):
        #         errors.append(f"File should be in src/ directory, found in {relative_path.parent}")

        # Add your custom validation logic here

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

    # Optional: Find project root if validation needs it
    # Uncomment if you need to validate files relative to project structure:
    # try:
    #     project_root = find_project_root(
    #         Path(__file__).parent,
    #         anchor_files=[".git", "package.json", "pyproject.toml"]
    #     )
    #     log(f"Project root: {project_root}")
    # except FileNotFoundError as e:
    #     log(f"WARNING: Could not find project root: {e}")
    #     project_root = None

    # Perform validation
    errors = validate_file_content(file_path)
    # Or with project_root: errors = validate_file_content(file_path, project_root)

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
