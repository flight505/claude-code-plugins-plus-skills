#!/usr/bin/env python3
"""
Install a skill from the claude-toolkit catalog to <workspace>/.claude/skills/

Skills are installed as symlinks to the toolkit source, avoiding duplication
of large reference files (doc skills are 24MB+). Updates to the toolkit
propagate to all linked projects instantly.

Usage:
    python install-skill.py <skill-name>

Example:
    python install-skill.py hooks-mastery
"""

import json
import subprocess
import sys
from pathlib import Path


def load_catalog(catalog_path: Path) -> dict:
    """Load and parse the skill catalog."""
    with open(catalog_path, 'r') as f:
        return json.load(f)


def find_skill_in_catalog(catalog: dict, skill_name: str) -> dict | None:
    """Find a skill by name in the catalog."""
    for skill in catalog.get('skills', []):
        if skill['name'] == skill_name:
            return skill
    return None


def get_skill_source_path(skill: dict, catalog_dir: Path) -> Path:
    """Resolve the source path for a skill."""
    if skill['source'] == 'local':
        path_str = skill['path']

        # Check if path is already absolute
        path = Path(path_str)
        if path.is_absolute():
            return path

        # Otherwise treat as relative to catalog.json location
        relative_path = path_str.lstrip('./')
        return catalog_dir / relative_path
    else:
        raise ValueError(f"Unsupported source type: {skill['source']}")


def install_skill(skill_name: str, source_path: Path, target_dir: Path,
                   force: bool = False) -> bool:
    """
    Install a skill by creating a symlink from target to source.

    Args:
        force: If True, reinstall without prompting (for non-interactive use by Claude).

    Returns True if successful, False otherwise.
    """
    target_path = target_dir / skill_name

    # Check if already installed
    if target_path.exists() or target_path.is_symlink():
        if target_path.is_symlink():
            current_target = target_path.resolve()
            print(f"⚠️  Skill '{skill_name}' is already symlinked → {current_target}")
        else:
            print(f"⚠️  Skill '{skill_name}' exists as a directory at {target_path}")

        if force:
            print("Force reinstalling...")
        else:
            try:
                response = input("Reinstall? (y/n): ").strip().lower()
            except EOFError:
                # Non-interactive mode — treat as force
                print("Non-interactive mode detected, reinstalling...")
                response = 'y'
            if response != 'y':
                print("Installation cancelled")
                return False
        # Remove existing (symlink or directory)
        if target_path.is_symlink():
            target_path.unlink()
        else:
            import shutil
            shutil.rmtree(target_path)

    # Create target directory if it doesn't exist
    target_dir.mkdir(parents=True, exist_ok=True)

    # Create symlink
    resolved_source = source_path.resolve()
    try:
        target_path.symlink_to(resolved_source)
        print(f"✓ Symlinked {target_path} → {resolved_source}")
    except Exception as e:
        print(f"❌ Failed to create symlink: {e}")
        return False

    # Validate installation
    skill_md = target_path / "SKILL.md"
    if not skill_md.exists():
        print(f"❌ Validation failed: SKILL.md not reachable via {target_path}")
        return False

    return True


def find_catalog() -> Path | None:
    """
    Find catalog.json in multiple possible locations.

    Supports both:
    1. Source location: claude-toolkit/skills/catalog.json
    2. Installed location: ~/.claude/skills/catalog.json

    Returns:
        Path to catalog.json, or None if not found
    """
    script_path = Path(__file__).resolve()
    skill_manager_dir = script_path.parent.parent  # skill-manager/

    # Location 1: Source (claude-toolkit/skills/catalog.json)
    source_catalog = skill_manager_dir.parent / "catalog.json"
    if source_catalog.exists():
        return source_catalog

    # Location 2: Installed (~/.claude/skills/catalog.json)
    installed_catalog = Path.home() / ".claude" / "skills" / "catalog.json"
    if installed_catalog.exists():
        return installed_catalog

    return None


def get_workspace_root() -> Path:
    """Get the workspace root via git, falling back to cwd."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True
        )
        return Path(result.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError):
        return Path.cwd()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Install a skill from claude-toolkit")
    parser.add_argument("skill_name", help="Name of the skill to install")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Reinstall without prompting (for non-interactive use)")
    args = parser.parse_args()

    skill_name = args.skill_name
    workspace_root = get_workspace_root()
    target_dir = workspace_root / ".claude" / "skills"
    print(f"Workspace: {workspace_root}")
    print(f"Target: {target_dir}")

    # Find catalog
    catalog_path = find_catalog()
    if not catalog_path:
        print("❌ Catalog not found in expected locations:")
        print("   - claude-toolkit/skills/catalog.json (source)")
        print("   - ~/.claude/skills/catalog.json (installed)")
        sys.exit(1)

    print(f"Using catalog: {catalog_path}")

    # Load catalog
    catalog = load_catalog(catalog_path)

    # Find skill
    skill = find_skill_in_catalog(catalog, skill_name)
    if not skill:
        print(f"❌ Skill '{skill_name}' not found in catalog")
        print("\nAvailable skills:")
        for s in catalog.get('skills', []):
            print(f"  - {s['name']}: {s['description']}")
        sys.exit(1)

    # Get source path
    catalog_dir = catalog_path.parent
    source_path = get_skill_source_path(skill, catalog_dir)

    if not source_path.exists():
        print(f"❌ Skill source not found at {source_path}")
        sys.exit(1)

    # Install as symlink
    print(f"Symlinking '{skill_name}' from {source_path}")
    success = install_skill(skill_name, source_path, target_dir, force=args.force)

    if success:
        print(f"\n✅ Successfully installed '{skill_name}'")
        print(f"   {target_dir / skill_name} → {source_path.resolve()}")
        print(f"📝 Skill is immediately available (Claude Code hot-reload)")
        sys.exit(0)
    else:
        print(f"\n❌ Failed to install '{skill_name}'")
        sys.exit(1)


if __name__ == "__main__":
    main()
