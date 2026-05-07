#!/usr/bin/env bash
#
# refresh-all-docs.sh — Update all doc-skill references in skill-forge.
#
# Runs each doc skill's update script in sequence. Designed to be called
# by launchd every 12h, but works standalone too.
#
# Usage: ./refresh-all-docs.sh [--quiet] [--skip-full]
#
# Options:
#   --quiet      Suppress progress output (for launchd)
#   --skip-full  Skip llms-full.txt download (28MB, rarely changes)
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="${REPO_ROOT}/skills/21-toolkit"
LOG_FILE="${REPO_ROOT}/logs/refresh-docs.log"

QUIET=false
SKIP_FULL=false

while [ $# -gt 0 ]; do
    case "$1" in
        --quiet|-q) QUIET=true ;;
        --skip-full) SKIP_FULL=true ;;
        --help|-h)
            head -14 "$0" | tail -11
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" >> "$LOG_FILE"
    if [ "$QUIET" = false ]; then
        echo "$msg"
    fi
}

log_error() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo "$msg" >> "$LOG_FILE"
    echo "$msg" >&2
}

TOTAL=0
PASSED=0
FAILED=0

run_update() {
    local name="$1"
    local script="$2"
    shift 2

    ((TOTAL++)) || true

    if [ ! -x "$script" ]; then
        log_error "${name}: script not found or not executable: ${script}"
        ((FAILED++)) || true
        return
    fi

    log "${name}: starting..."
    if "$script" "$@" >> "$LOG_FILE" 2>&1; then
        log "${name}: done"
        ((PASSED++)) || true
    else
        log_error "${name}: failed (exit $?)"
        ((FAILED++)) || true
    fi
}

log "=== Doc refresh started ==="

# 1. Claude API docs (primer + changelog always; full only if remote is newer)
run_update "claude-api-primer" \
    "${SKILLS_DIR}/claude-docs-skill/scripts/update-llms.sh" --primer
run_update "claude-api-changelog" \
    "${SKILLS_DIR}/claude-docs-skill/scripts/update-llms.sh" --changelog

if [ "$SKIP_FULL" = false ]; then
    local_file="${SKILLS_DIR}/claude-docs-skill/references/llms-full.txt"
    should_download=true

    if [ -f "$local_file" ]; then
        remote_last_modified=$(curl -sI "https://platform.claude.com/llms-full.txt" 2>/dev/null \
            | grep -i "^last-modified:" | sed 's/^[Ll]ast-[Mm]odified: //')
        if [ -n "$remote_last_modified" ]; then
            remote_epoch=$(date -j -f "%a, %d %b %Y %H:%M:%S %Z" "$remote_last_modified" "+%s" 2>/dev/null || echo 0)
            local_epoch=$(stat -f "%m" "$local_file" 2>/dev/null || echo 0)
            if [ "$remote_epoch" -le "$local_epoch" ] 2>/dev/null; then
                log "claude-api-full: skipped (remote unchanged since $(echo "$remote_last_modified" | cut -d' ' -f2-4))"
                should_download=false
            fi
        fi
    fi

    if [ "$should_download" = true ]; then
        run_update "claude-api-full" \
            "${SKILLS_DIR}/claude-docs-skill/scripts/update-llms.sh" --full
    fi
fi

# 2. Claude CLI docs (via shared doc-builder)
run_update "claude-cli-docs" \
    "${SKILLS_DIR}/claude-docs-skill/scripts/update-cli-docs.sh"

# 3. OpenRouter docs (models + OpenAPI)
run_update "openrouter-docs" \
    "${SKILLS_DIR}/openrouter-docs-skill/scripts/update-openrouter-docs.sh"

# 4. Warp docs (via shared doc-builder)
run_update "warp-docs" \
    "${SKILLS_DIR}/warp-docs-skill/scripts/update-docs.sh"

# 5. Gemini docs (via shared doc-builder)
run_update "gemini-docs" \
    "${SKILLS_DIR}/gemini-docs-skill/scripts/update-docs.sh"

log "=== Doc refresh complete: ${PASSED}/${TOTAL} succeeded, ${FAILED} failed ==="

# Trim log to last 500 lines
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt 500 ]; then
    tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

exit "$FAILED"
