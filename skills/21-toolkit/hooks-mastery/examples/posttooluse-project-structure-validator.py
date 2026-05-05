#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
PostToolUse Hook: Project Structure Validator

Demonstrates robust path resolution pattern for validators that need to
validate files relative to project structure.

Example use case: Validate that plugin.json files in a marketplace have
correct structure and reference files that actually exist.

Key patterns demonstrated:
1. Anchor-based project root finding (no fragile .parent counting)
2. Pre-flight sanity checks (verify expected project structure)
3. Clear separation of validator bugs vs validation failures
4. Comprehensive error messages

Usage in .claude/settings.json or command frontmatter:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/validators/project-structure-validator.py"
"""

import json
import sys
from pathlib import Path
from datetime import datetime

LOG_FILE = Path(__file__).parent / "project-structure-validator.log"


def log(message: str):
    """Log message to file for debugging."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def find_project_root(start_path: Path, anchor_files: list[str]) -> Path:
    """
    Walk up directory tree until finding a directory with an anchor file.

    This is MUCH more robust than counting .parent calls, because:
    - Works regardless of validator depth in directory tree
    - Self-documents what defines a project root
    - Fails fast with clear error if project structure is unexpected

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


def verify_project_root(project_root: Path, expected_paths: list[str]) -> list[str]:
    """
    Verify resolved project root has expected structure.

    This catches path resolution bugs BEFORE they cause false positive errors.
    If expected paths are missing, it's a VALIDATOR BUG, not a validation failure.

    Args:
        project_root: The resolved project root path
        expected_paths: Paths that should exist (relative to root)

    Returns:
        List of missing paths (empty list = all verified)
    """
    missing = []
    for path in expected_paths:
        full_path = project_root / path
        if not full_path.exists():
            missing.append(path)
            log(f"  ✗ Missing expected path: {full_path}")
        else:
            log(f"  ✓ Found expected path: {full_path}")
    return missing


def validate_plugin_manifest(file_path: Path, project_root: Path) -> list[str]:
    """
    Validate a plugin.json manifest file.

    Example validation that checks:
    - JSON is valid
    - Required fields exist
    - Files referenced in manifest actually exist in project

    Args:
        file_path: Path to plugin.json
        project_root: Project root (for resolving relative paths)

    Returns:
        List of error messages (empty list if valid)
    """
    errors = []

    # Parse JSON
    try:
        with open(file_path) as f:
            manifest = json.load(f)
    except json.JSONDecodeError as e:
        return [f"Invalid JSON in {file_path.name}: {e}"]
    except Exception as e:
        return [f"Error reading {file_path.name}: {e}"]

    # Check required fields
    required_fields = ["name", "version", "description"]
    for field in required_fields:
        if field not in manifest:
            errors.append(f"{file_path.name}: Missing required field '{field}'")

    # Example: Verify referenced files exist
    # If manifest has a "main" field, check that file exists
    if "main" in manifest:
        # Resolve relative to the plugin directory (parent of plugin.json)
        plugin_dir = file_path.parent
        main_file = plugin_dir / manifest["main"]

        if not main_file.exists():
            errors.append(
                f"{file_path.name}: Referenced main file not found: {manifest['main']}"
            )

    # Example: Check version format
    if "version" in manifest:
        version = manifest["version"]
        # Simple check: should have at least one dot (e.g., "1.0")
        if "." not in str(version):
            errors.append(f"{file_path.name}: Version should be in X.Y format, got: {version}")

    return errors


def main():
    log("=" * 50)
    log("PROJECT STRUCTURE VALIDATOR (PostToolUse)")

    # STEP 1: Read hook input from stdin
    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception as e:
        log(f"ERROR: Failed to parse hook input: {e}")
        sys.exit(1)

    # Extract file path
    tool_input = hook_input.get("tool_input", {})
    file_path_str = tool_input.get("file_path")

    if not file_path_str:
        log("SKIP: No file_path in tool_input")
        print(json.dumps({}))
        return

    file_path = Path(file_path_str)
    log(f"File: {file_path}")

    # Only validate plugin.json files
    if file_path.name != "plugin.json":
        log(f"SKIP: Not a plugin.json file (name: {file_path.name})")
        print(json.dumps({}))
        return

    # STEP 2: Find project root using anchor-based search
    # This is ROBUST - works regardless of validator location depth
    try:
        project_root = find_project_root(
            Path(__file__).parent,
            anchor_files=[
                ".git",           # Most common anchor
                "README.md",      # Fallback
                "package.json",   # For npm projects
            ]
        )
        log(f"Project root: {project_root}")
    except FileNotFoundError as e:
        # Could not find project root - this is a validator configuration error
        log(f"ERROR: {e}")
        print(json.dumps({
            "decision": "block",
            "reason": (
                f"Validator configuration error: Could not find project root.\n\n"
                f"{e}\n\n"
                f"This indicates the validator's anchor files need adjustment."
            )
        }))
        return

    # STEP 3: Pre-flight check - verify expected project structure
    # This catches path resolution bugs BEFORE they create false positives
    log("Verifying project structure...")
    missing = verify_project_root(project_root, [
        ".claude",    # Should have .claude folder
        # Add other expected directories/files for your project type
        # For example, in a plugin marketplace:
        # "plugins",
        # "README.md",
    ])

    if missing:
        # This is a VALIDATOR BUG, not a validation failure
        log(f"ERROR: Validator config error - missing paths: {missing}")
        print(json.dumps({
            "decision": "block",
            "reason": (
                f"Validator configuration error!\n\n"
                f"Project root resolved to: {project_root}\n"
                f"But missing expected paths: {missing}\n\n"
                f"This indicates the validator's path resolution or project structure "
                f"assumptions are incorrect. The validator needs to be fixed, not the code."
            )
        }))
        return

    # STEP 4: Run validation logic
    log(f"Validating: {file_path.name}")
    errors = validate_plugin_manifest(file_path, project_root)

    # STEP 5: Output decision
    if errors:
        log(f"BLOCK: Found {len(errors)} error(s)")
        for error in errors:
            log(f"  - {error}")

        error_message = f"Plugin manifest validation failed:\n\n"
        error_message += "\n".join(f"• {e}" for e in errors)

        print(json.dumps({
            "decision": "block",
            "reason": error_message
        }))
    else:
        log(f"PASS: {file_path.name} validated successfully")
        print(json.dumps({}))


if __name__ == "__main__":
    main()
