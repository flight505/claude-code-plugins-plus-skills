#!/usr/bin/env bash
#
# Claude LLM-Optimized Documentation Updater
# Downloads LLM-optimized files from platform.claude.com
#
# Usage: ./update-llms.sh [--primer | --full | --changelog | --all]
#
# Options:
#   --primer     Update primer.md only
#   --full       Update llms-full.txt only
#   --changelog  Update changelog.md only
#   --all        Update all files (default)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFS_DIR="${SCRIPT_DIR}/../references"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# URLs for LLM-optimized docs
PRIMER_URL="https://platform.claude.com/docs/en/claude_api_primer.md"
FULL_URL="https://platform.claude.com/llms-full.txt"
CHANGELOG_URL="https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"

download_primer() {
    log_info "=== Downloading API Primer ==="

    local output="${REFS_DIR}/primer.md"

    if curl -sfL "$PRIMER_URL" -o "$output"; then
        local lines=$(wc -l < "$output")
        local size=$(ls -lh "$output" | awk '{print $5}')
        log_info "Downloaded primer.md: ${size}, ${lines} lines"
        return 0
    else
        log_error "Failed to download primer.md"
        return 1
    fi
}

download_full() {
    log_info "=== Downloading Complete Documentation ==="
    log_warn "This is a large file (~28MB). Download may take 30-60 seconds..."

    local output="${REFS_DIR}/llms-full.txt"

    if curl -sfL "$FULL_URL" -o "$output"; then
        local lines=$(wc -l < "$output")
        local size=$(ls -lh "$output" | awk '{print $5}')
        log_info "Downloaded llms-full.txt: ${size}, ${lines} lines"
        return 0
    else
        log_error "Failed to download llms-full.txt"
        return 1
    fi
}

download_changelog() {
    log_info "=== Downloading Claude Code Changelog ==="

    local output="${REFS_DIR}/changelog.md"

    # Try multiple methods
    local downloaded=false

    # Method 1: Direct raw.githubusercontent.com
    if curl -sfL "$CHANGELOG_URL" -o "$output" 2>/dev/null; then
        log_info "Downloaded via raw.githubusercontent.com"
        downloaded=true
    fi

    # Method 2: GitHub API (if method 1 fails)
    if [ "$downloaded" = false ]; then
        log_info "Trying GitHub API..."
        local api_url="https://api.github.com/repos/anthropics/claude-code/contents/CHANGELOG.md"
        local api_response=$(curl -sfL "$api_url" 2>/dev/null)
        if [ -n "$api_response" ]; then
            echo "$api_response" | python3 -c "
import sys, json, base64
try:
    data = json.load(sys.stdin)
    content = base64.b64decode(data['content']).decode('utf-8')
    print(content)
except:
    sys.exit(1)
" > "$output" 2>/dev/null && downloaded=true && log_info "Downloaded via GitHub API"
        fi
    fi

    # Method 3: gh CLI (if available and methods 1-2 fail)
    if [ "$downloaded" = false ] && command -v gh &> /dev/null; then
        log_info "Trying gh CLI..."
        if gh api repos/anthropics/claude-code/contents/CHANGELOG.md --jq '.content' 2>/dev/null | base64 -d > "$output" 2>/dev/null; then
            downloaded=true
            log_info "Downloaded via gh CLI"
        fi
    fi

    if [ "$downloaded" = false ]; then
        log_error "Failed to download changelog - all methods failed"
        log_warn "Manually download from: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md"

        # Create placeholder
        cat > "$output" << EOF
# Claude Code Changelog

_Unable to auto-download. Please manually update._

Download from: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
EOF
        return 1
    fi

    # Filter to v2.0.0+ entries (changelog is newest-first, so print until we hit 1.x)
    local temp_file=$(mktemp)
    awk '
        /^## \[?[01]\./ { exit }
        { print }
    ' "$output" > "$temp_file"

    # If filtering worked, add header
    if [ -s "$temp_file" ]; then
        local final_file=$(mktemp)
        cat > "$final_file" << EOF
# Claude Code Changelog (v2.0.0+)

_Last updated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')_

---

EOF
        cat "$temp_file" >> "$final_file"
        mv "$final_file" "$output"
        rm -f "$temp_file"

        local lines=$(wc -l < "$output")
        log_info "Filtered changelog: ${lines} lines (v2.0.0+)"
    else
        rm -f "$temp_file"
        log_warn "Could not filter changelog - keeping full version"
    fi

    return 0
}

show_help() {
    cat << EOF
Claude LLM-Optimized Documentation Updater

Updates documentation from Anthropic's LLM-optimized sources:
- primer.md: Concise API primer (18KB)
- llms-full.txt: Complete documentation (28MB)
- changelog.md: Claude Code changelog

Usage: $0 [OPTIONS]

Options:
  --primer     Update primer.md only
  --full       Update llms-full.txt only
  --changelog  Update changelog.md only
  --all        Update all files (default)
  --help       Show this help message

Examples:
  $0                 # Update all files
  $0 --all           # Update all files
  $0 --primer        # Quick update of API primer only
  $0 --changelog     # Update changelog only

Recommended Schedule:
  - Weekly: --all (comprehensive update)
  - Daily: --changelog (track recent changes)
EOF
}

main() {
    local do_primer=false
    local do_full=false
    local do_changelog=false

    # Default: update all
    if [ $# -eq 0 ]; then
        do_primer=true
        do_full=true
        do_changelog=true
    fi

    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --primer)
                do_primer=true
                ;;
            --full)
                do_full=true
                ;;
            --changelog)
                do_changelog=true
                ;;
            --all)
                do_primer=true
                do_full=true
                do_changelog=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done

    # Create references directory if it doesn't exist
    mkdir -p "$REFS_DIR"

    # Track failures
    local failed=0

    # Download requested files
    if [ "$do_primer" = true ]; then
        download_primer || ((failed++))
    fi

    if [ "$do_full" = true ]; then
        download_full || ((failed++))
    fi

    if [ "$do_changelog" = true ]; then
        download_changelog || ((failed++))
    fi

    echo ""
    if [ $failed -eq 0 ]; then
        log_info "=== All downloads successful ==="
        log_info "Documentation updated in: ${REFS_DIR}/"
    else
        log_warn "=== Downloads completed with ${failed} failure(s) ==="
        log_warn "Check error messages above"
        exit 1
    fi
}

main "$@"
