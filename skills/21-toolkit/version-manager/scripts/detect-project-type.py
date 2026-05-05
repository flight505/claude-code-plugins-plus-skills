#!/usr/bin/env python3
"""
Detect project type and version file location.

Returns JSON with project type, version file path, and current version.
Exit code 0 on success, 1 if no supported project found.
"""

import json
import sys
from pathlib import Path
import re
from typing import Optional


def detect_project_type(project_dir: str = ".") -> Optional[dict]:
    """
    Detect project type by checking for version files in priority order.

    Priority:
    1. Claude Code Plugin
    2. Node.js/JavaScript
    3. Python (modern)
    4. Rust
    5. Go
    6. Python (legacy)

    Returns:
        dict with keys: type, version_file, current_version
    """
    project_path = Path(project_dir).resolve()

    # 1. Claude Code Plugin
    plugin_json = project_path / ".claude-plugin" / "plugin.json"
    if plugin_json.exists():
        try:
            with open(plugin_json) as f:
                data = json.load(f)
                version = data.get("version", "0.0.0")
            return {
                "type": "claude-plugin",
                "version_file": str(plugin_json.relative_to(project_path)),
                "current_version": version,
                "field_path": ".version"
            }
        except (json.JSONDecodeError, OSError):
            pass

    # 2. Node.js/JavaScript
    package_json = project_path / "package.json"
    if package_json.exists():
        try:
            with open(package_json) as f:
                data = json.load(f)
                version = data.get("version", "0.0.0")
            return {
                "type": "nodejs",
                "version_file": str(package_json.relative_to(project_path)),
                "current_version": version,
                "field_path": ".version"
            }
        except (json.JSONDecodeError, OSError):
            pass

    # 3. Python (modern - pyproject.toml)
    pyproject_toml = project_path / "pyproject.toml"
    if pyproject_toml.exists():
        try:
            with open(pyproject_toml) as f:
                content = f.read()
                # Look for version in [project] section
                match = re.search(r'\[project\].*?version\s*=\s*["\']([^"\']+)["\']', content, re.DOTALL)
                if match:
                    version = match.group(1)
                    return {
                        "type": "python-modern",
                        "version_file": str(pyproject_toml.relative_to(project_path)),
                        "current_version": version,
                        "field_path": "[project].version"
                    }
        except OSError:
            pass

    # 4. Rust
    cargo_toml = project_path / "Cargo.toml"
    if cargo_toml.exists():
        try:
            with open(cargo_toml) as f:
                content = f.read()
                # Look for version in [package] section
                match = re.search(r'\[package\].*?version\s*=\s*["\']([^"\']+)["\']', content, re.DOTALL)
                if match:
                    version = match.group(1)
                    return {
                        "type": "rust",
                        "version_file": str(cargo_toml.relative_to(project_path)),
                        "current_version": version,
                        "field_path": "[package].version"
                    }
        except OSError:
            pass

    # 5. Go
    go_mod = project_path / "go.mod"
    if go_mod.exists():
        try:
            with open(go_mod) as f:
                content = f.read()
                # Go modules don't have explicit version in go.mod
                # Version comes from git tags
                return {
                    "type": "go",
                    "version_file": str(go_mod.relative_to(project_path)),
                    "current_version": "git-tag-based",
                    "field_path": "git-tag"
                }
        except OSError:
            pass

    # 6. Python (legacy - setup.py)
    setup_py = project_path / "setup.py"
    if setup_py.exists():
        try:
            with open(setup_py) as f:
                content = f.read()
                # Look for version= argument
                match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', content)
                if match:
                    version = match.group(1)
                    return {
                        "type": "python-legacy",
                        "version_file": str(setup_py.relative_to(project_path)),
                        "current_version": version,
                        "field_path": "version="
                    }
        except OSError:
            pass

    # No supported project type found
    return None


def main():
    project_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    result = detect_project_type(project_dir)

    if result is None:
        print(json.dumps({
            "error": "No supported project type found",
            "supported_files": [
                ".claude-plugin/plugin.json",
                "package.json",
                "pyproject.toml",
                "Cargo.toml",
                "go.mod",
                "setup.py"
            ]
        }), file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
