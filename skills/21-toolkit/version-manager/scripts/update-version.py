#!/usr/bin/env python3
"""
Update version in project file and README badges.

Takes current version, new version, and project info as input.
Updates the version file and any shields.io badges in README.md.

Usage:
    python update-version.py <project-type> <version-file> <current-version> <new-version>
"""

import json
import re
import sys
from pathlib import Path
from typing import Optional


def update_json_version(file_path: Path, new_version: str) -> bool:
    """Update version in JSON file (package.json, plugin.json)."""
    try:
        with open(file_path) as f:
            data = json.load(f)

        data["version"] = new_version

        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")  # Add trailing newline

        return True
    except Exception as e:
        print(f"Error updating {file_path}: {e}", file=sys.stderr)
        return False


def update_toml_version(file_path: Path, new_version: str, section: str = "project") -> bool:
    """Update version in TOML file (pyproject.toml, Cargo.toml)."""
    try:
        with open(file_path) as f:
            content = f.read()

        # Find version line in specified section
        pattern = rf'(\[{section}\].*?version\s*=\s*["\'])[^"\']+(["\'])'
        replacement = rf'\g<1>{new_version}\g<2>'

        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

        if updated_content == content:
            print(f"Warning: Version not found in [{section}] section", file=sys.stderr)
            return False

        with open(file_path, "w") as f:
            f.write(updated_content)

        return True
    except Exception as e:
        print(f"Error updating {file_path}: {e}", file=sys.stderr)
        return False


def update_setup_py_version(file_path: Path, new_version: str) -> bool:
    """Update version in setup.py."""
    try:
        with open(file_path) as f:
            content = f.read()

        # Find version= argument
        pattern = r'(version\s*=\s*["\'])[^"\']+(["\'])'
        replacement = rf'\g<1>{new_version}\g<2>'

        updated_content = re.sub(pattern, replacement, content)

        if updated_content == content:
            print("Warning: version= argument not found", file=sys.stderr)
            return False

        with open(file_path, "w") as f:
            f.write(updated_content)

        return True
    except Exception as e:
        print(f"Error updating {file_path}: {e}", file=sys.stderr)
        return False


def update_readme_badges(readme_path: Path, current_version: str, new_version: str) -> bool:
    """
    Update shields.io version badges in README.

    Patterns matched:
    - shields.io/badge/version-X.Y.Z-blue
    - shields.io/badge/v-X.Y.Z-blue
    """
    if not readme_path.exists():
        print(f"README not found at {readme_path}", file=sys.stderr)
        return False

    try:
        with open(readme_path) as f:
            content = f.read()

        # Pattern: shields.io/badge/(version|v)-X.Y.Z-color
        # Matches with or without markdown link syntax
        pattern = rf'(shields\.io/badge/(?:version|v)-)({re.escape(current_version)})([-\w]+)'
        replacement = rf'\g<1>{new_version}\g<3>'

        updated_content = re.sub(pattern, replacement, content)

        # Count how many badges were updated
        matches_before = len(re.findall(pattern, content))

        if matches_before == 0:
            print(f"No version badges found for {current_version} in README", file=sys.stderr)
            return False

        with open(readme_path, "w") as f:
            f.write(updated_content)

        print(f"Updated {matches_before} badge(s) in README")
        return True

    except Exception as e:
        print(f"Error updating README badges: {e}", file=sys.stderr)
        return False


def update_version(
    project_type: str,
    version_file: str,
    current_version: str,
    new_version: str,
    project_dir: str = "."
) -> dict:
    """
    Update version in project file and README.

    Returns:
        dict with success status and updated files
    """
    project_path = Path(project_dir).resolve()
    version_file_path = project_path / version_file
    readme_path = project_path / "README.md"

    updated_files = []
    errors = []

    # Update version file based on project type
    if project_type in ["claude-plugin", "nodejs"]:
        success = update_json_version(version_file_path, new_version)
    elif project_type == "python-modern":
        success = update_toml_version(version_file_path, new_version, section="project")
    elif project_type == "rust":
        success = update_toml_version(version_file_path, new_version, section="package")
    elif project_type == "python-legacy":
        success = update_setup_py_version(version_file_path, new_version)
    elif project_type == "go":
        # Go modules use git tags, no file update needed
        success = True
        print("Go modules use git tags for versioning", file=sys.stderr)
    else:
        success = False
        errors.append(f"Unsupported project type: {project_type}")

    if success:
        updated_files.append(version_file)
    else:
        errors.append(f"Failed to update {version_file}")

    # Update README badges
    if readme_path.exists():
        badge_success = update_readme_badges(readme_path, current_version, new_version)
        if badge_success:
            updated_files.append("README.md")
    else:
        print("README.md not found, skipping badge update", file=sys.stderr)

    return {
        "success": success,
        "updated_files": updated_files,
        "errors": errors,
        "new_version": new_version
    }


def main():
    if len(sys.argv) < 5:
        print("Usage: update-version.py <project-type> <version-file> <current-version> <new-version>", file=sys.stderr)
        sys.exit(1)

    project_type = sys.argv[1]
    version_file = sys.argv[2]
    current_version = sys.argv[3]
    new_version = sys.argv[4]
    project_dir = sys.argv[5] if len(sys.argv) > 5 else "."

    result = update_version(project_type, version_file, current_version, new_version, project_dir)

    print(json.dumps(result, indent=2))

    if result["success"]:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
