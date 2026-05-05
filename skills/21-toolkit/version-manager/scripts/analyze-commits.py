#!/usr/bin/env python3
"""
Analyze git commits since last tag to recommend version bump type.

Parses conventional commit messages and recommends patch/minor/major based on:
- feat: → minor
- fix: → patch
- BREAKING CHANGE or !: → major
- chore/docs/style: → patch

Returns JSON with recommendation and analysis details.
"""

import json
import re
import subprocess
import sys
from typing import List, Dict, Optional, Any


def get_last_version_tag() -> Optional[str]:
    """
    Get the most recent version tag (vX.Y.Z format).

    Returns:
        Tag name (e.g., "v1.2.3") or None if no tags exist
    """
    try:
        result = subprocess.run(
            ["git", "tag", "--sort=-v:refname"],
            capture_output=True,
            text=True,
            check=True
        )
        tags = result.stdout.strip().split("\n")
        # Find first tag matching vX.Y.Z pattern
        for tag in tags:
            if re.match(r"^v?\d+\.\d+\.\d+$", tag):
                return tag
        return None
    except subprocess.CalledProcessError:
        return None


def get_commits_since_tag(tag: Optional[str]) -> List[str]:
    """
    Get commit messages since the specified tag (or all commits if no tag).

    Args:
        tag: Git tag to start from, or None for all commits

    Returns:
        List of commit message lines
    """
    try:
        if tag:
            cmd = ["git", "log", f"{tag}..HEAD", "--oneline"]
        else:
            cmd = ["git", "log", "--oneline"]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        commits = result.stdout.strip().split("\n")
        return [c for c in commits if c]  # Filter empty lines
    except subprocess.CalledProcessError:
        return []


def parse_conventional_commit(commit_msg: str) -> Dict[str, Any]:
    """
    Parse a conventional commit message and determine its type.

    Args:
        commit_msg: Commit message line (e.g., "abc1234 feat: add new feature")

    Returns:
        dict with: type, scope, description, breaking_change, bump_recommendation
    """
    # Remove commit hash (first word)
    parts = commit_msg.split(maxsplit=1)
    if len(parts) < 2:
        return {
            "type": "unknown",
            "bump_recommendation": "patch"
        }

    message = parts[1]

    # Check for breaking change indicator
    breaking_change = "!" in message.split(":")[0] or "BREAKING CHANGE" in message

    # Parse conventional commit pattern: type(scope): description
    match = re.match(r"^(\w+)(?:\(([^\)]+)\))?(!)?:\s*(.+)$", message)

    if not match:
        # Not a conventional commit
        return {
            "type": "unknown",
            "message": message,
            "bump_recommendation": "patch"
        }

    commit_type = match.group(1).lower()
    scope = match.group(2)
    has_bang = match.group(3) == "!"
    description = match.group(4)

    # Determine bump recommendation
    if breaking_change or has_bang:
        bump = "major"
    elif commit_type in ["feat", "feature"]:
        bump = "minor"
    elif commit_type in ["fix", "bugfix"]:
        bump = "patch"
    elif commit_type in ["chore", "docs", "style", "refactor", "test", "perf"]:
        bump = "patch"
    else:
        bump = "patch"

    return {
        "type": commit_type,
        "scope": scope,
        "description": description,
        "breaking_change": breaking_change or has_bang,
        "bump_recommendation": bump,
        "raw_message": message
    }


def analyze_commits() -> Dict[str, Any]:
    """
    Analyze all commits since last tag and recommend version bump.

    Returns:
        dict with: last_tag, commit_count, recommendation, analysis
    """
    last_tag = get_last_version_tag()
    commits = get_commits_since_tag(last_tag)

    if not commits:
        return {
            "last_tag": last_tag,
            "commit_count": 0,
            "recommendation": "patch",
            "reason": "No commits since last tag",
            "analysis": []
        }

    # Parse all commits
    parsed_commits = [parse_conventional_commit(c) for c in commits]

    # Count by type
    type_counts = {}
    for commit in parsed_commits:
        bump = commit["bump_recommendation"]
        type_counts[bump] = type_counts.get(bump, 0) + 1

    # Determine overall recommendation (highest severity wins)
    if type_counts.get("major", 0) > 0:
        recommendation = "major"
        reason = f"Found {type_counts['major']} breaking change(s)"
    elif type_counts.get("minor", 0) > 0:
        recommendation = "minor"
        reason = f"Found {type_counts['minor']} new feature(s)"
    else:
        recommendation = "patch"
        reason = f"Found {type_counts.get('patch', 0)} fix(es)/update(s)"

    return {
        "last_tag": last_tag,
        "commit_count": len(commits),
        "recommendation": recommendation,
        "reason": reason,
        "type_counts": type_counts,
        "analysis": parsed_commits[:5]  # First 5 commits for context
    }


def main():
    try:
        analysis = analyze_commits()
        print(json.dumps(analysis, indent=2))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "recommendation": "patch"  # Safe fallback
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
