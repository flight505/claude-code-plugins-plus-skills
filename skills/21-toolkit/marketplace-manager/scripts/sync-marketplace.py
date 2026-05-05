#!/usr/bin/env -S uv run --quiet --script
# /// script
# dependencies = []
# ///
"""
Sync plugin versions from submodules to marketplace.json.

Usage:
    python sync-marketplace.py <plugin-name>       # Sync one plugin
    python sync-marketplace.py --all               # Sync all changed submodules
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Dict


# Known plugins in marketplace
KNOWN_PLUGINS = [
    "sdk-bridge",
    "storybook-assistant",
    "claude-project-planner",
    "nano-banana"
]


def check_marketplace_root() -> bool:
    """Verify we're in marketplace root directory."""
    marketplace_json = Path(".claude-plugin/marketplace.json")
    return marketplace_json.exists()


def get_plugin_version(plugin_name: str) -> Optional[str]:
    """
    Read version from plugin's plugin.json file.

    Args:
        plugin_name: Plugin directory name

    Returns:
        Version string or None if not found
    """
    plugin_json_path = Path(plugin_name) / ".claude-plugin" / "plugin.json"

    if not plugin_json_path.exists():
        print(f"Error: Plugin manifest not found: {plugin_json_path}", file=sys.stderr)
        return None

    try:
        with open(plugin_json_path) as f:
            data = json.load(f)
            return data.get("version")
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error reading {plugin_json_path}: {e}", file=sys.stderr)
        return None


def get_changed_submodules() -> List[str]:
    """
    Detect submodules with uncommitted pointer changes.

    Returns:
        List of submodule directory names
    """
    try:
        result = subprocess.run(
            ["git", "diff", "--submodule"],
            capture_output=True,
            text=True,
            check=True
        )

        # Parse output for "Submodule <name>" lines with "new commits"
        changed = []
        for line in result.stdout.split("\n"):
            if line.startswith("Submodule ") and "new commits" in line:
                # Extract submodule name
                parts = line.split()
                if len(parts) >= 2:
                    submodule = parts[1]
                    changed.append(submodule)

        return changed
    except subprocess.CalledProcessError as e:
        print(f"Error detecting changed submodules: {e}", file=sys.stderr)
        return []


def update_marketplace_json(plugin_updates: Dict[str, str]) -> Optional[str]:
    """
    Update marketplace.json with new plugin versions and bump marketplace version.

    Args:
        plugin_updates: Dict of {plugin_name: new_version}

    Returns:
        New marketplace version or None on error
    """
    marketplace_path = Path(".claude-plugin/marketplace.json")

    try:
        with open(marketplace_path) as f:
            data = json.load(f)

        # Update plugin versions
        for plugin_name, new_version in plugin_updates.items():
            found = False
            for plugin in data.get("plugins", []):
                if plugin.get("name") == plugin_name:
                    plugin["version"] = new_version
                    found = True
                    print(f"✓ Updated {plugin_name} to {new_version}")
                    break

            if not found:
                print(f"Warning: Plugin {plugin_name} not found in marketplace.json", file=sys.stderr)

        # Bump marketplace patch version
        current_version = data.get("version", "0.0.0")
        parts = current_version.split(".")
        if len(parts) == 3:
            major, minor, patch = parts
            new_patch = int(patch) + 1
            new_version = f"{major}.{minor}.{new_patch}"
            data["version"] = new_version
            print(f"✓ Bumped marketplace version: {current_version} → {new_version}")
        else:
            print(f"Warning: Invalid marketplace version format: {current_version}", file=sys.stderr)
            new_version = current_version

        # Write back to file
        with open(marketplace_path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")  # Add trailing newline

        return new_version

    except (json.JSONDecodeError, OSError) as e:
        print(f"Error updating marketplace.json: {e}", file=sys.stderr)
        return None


def git_commit_and_push(plugin_updates: Dict[str, str], marketplace_version: str) -> bool:
    """
    Commit changes and push to origin.

    Args:
        plugin_updates: Dict of {plugin_name: new_version}
        marketplace_version: New marketplace version

    Returns:
        True on success, False on error
    """
    try:
        # Stage marketplace.json and submodule pointers
        files_to_add = [".claude-plugin/marketplace.json"]
        files_to_add.extend(plugin_updates.keys())

        subprocess.run(["git", "add"] + files_to_add, check=True)

        # Create commit message
        if len(plugin_updates) == 1:
            plugin_name = list(plugin_updates.keys())[0]
            plugin_version = plugin_updates[plugin_name]
            commit_msg = f"chore: sync {plugin_name} to v{plugin_version}, bump marketplace to v{marketplace_version}"
        else:
            plugin_list = ", ".join([f"{name} v{ver}" for name, ver in plugin_updates.items()])
            commit_msg = f"chore: sync {len(plugin_updates)} plugins, bump marketplace to v{marketplace_version}\n\n{plugin_list}"

        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        print("✓ Committed changes")

        # Push to origin
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("✓ Pushed to origin")

        return True

    except subprocess.CalledProcessError as e:
        print(f"Error committing/pushing: {e}", file=sys.stderr)
        return False


def sync_plugin(plugin_name: str) -> bool:
    """
    Sync one plugin to marketplace.

    Args:
        plugin_name: Plugin to sync

    Returns:
        True on success, False on error
    """
    if plugin_name not in KNOWN_PLUGINS:
        print(f"Error: Unknown plugin '{plugin_name}'", file=sys.stderr)
        print(f"Available plugins: {', '.join(KNOWN_PLUGINS)}", file=sys.stderr)
        return False

    # Read plugin version
    version = get_plugin_version(plugin_name)
    if version is None:
        return False

    print(f"✓ Read {plugin_name} version: {version}")

    # Update marketplace.json
    marketplace_version = update_marketplace_json({plugin_name: version})
    if marketplace_version is None:
        return False

    # Commit and push
    if not git_commit_and_push({plugin_name: version}, marketplace_version):
        return False

    print(f"\n✓ Synced {plugin_name} v{version} to marketplace v{marketplace_version}")
    return True


def sync_all() -> bool:
    """
    Sync all changed submodules to marketplace.

    Returns:
        True on success, False on error
    """
    # Detect changed submodules
    changed = get_changed_submodules()

    if not changed:
        print("No submodule changes detected")
        print("All plugins already synchronized")
        return True

    print(f"Detected changed submodules: {', '.join(changed)}")

    # Read versions for all changed plugins
    plugin_updates = {}
    for plugin_name in changed:
        if plugin_name in KNOWN_PLUGINS:
            version = get_plugin_version(plugin_name)
            if version:
                plugin_updates[plugin_name] = version
                print(f"✓ Read {plugin_name} version: {version}")
            else:
                print(f"Warning: Could not read version for {plugin_name}, skipping", file=sys.stderr)

    if not plugin_updates:
        print("Error: No valid plugin versions found", file=sys.stderr)
        return False

    # Update marketplace.json
    marketplace_version = update_marketplace_json(plugin_updates)
    if marketplace_version is None:
        return False

    # Commit and push
    if not git_commit_and_push(plugin_updates, marketplace_version):
        return False

    plugin_list = ", ".join([f"{name} v{ver}" for name, ver in plugin_updates.items()])
    print(f"\n✓ Synced {len(plugin_updates)} plugins: {plugin_list} to marketplace v{marketplace_version}")
    return True


def main():
    # Check we're in marketplace root
    if not check_marketplace_root():
        print("Error: marketplace-manager can only run from marketplace root", file=sys.stderr)
        print("Expected: .claude-plugin/marketplace.json", file=sys.stderr)
        print(f"Current directory: {Path.cwd()}", file=sys.stderr)
        sys.exit(1)

    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage: sync-marketplace.py <plugin-name> | --all", file=sys.stderr)
        print(f"Available plugins: {', '.join(KNOWN_PLUGINS)}", file=sys.stderr)
        sys.exit(1)

    arg = sys.argv[1]

    if arg == "--all":
        success = sync_all()
    else:
        success = sync_plugin(arg)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
