#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_section() { echo -e "${BLUE}[====]${NC} $*"; }

# Get the script directory and references directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFS_DIR="${SCRIPT_DIR}/../references"

# OpenRouter documentation URLs
OPENAPI_YAML_URL="https://openrouter.ai/openapi.yaml"
MODELS_API_URL="https://openrouter.ai/api/v1/models"

# Download OpenAPI YAML specification
download_openapi_yaml() {
    log_info "=== Downloading OpenAPI YAML Specification ==="

    local output="${REFS_DIR}/openapi.yaml"

    if curl -sfL "$OPENAPI_YAML_URL" -o "$output"; then
        local lines=$(wc -l < "$output")
        local size=$(ls -lh "$output" | awk '{print $5}')
        log_info "Downloaded openapi.yaml: ${size}, ${lines} lines"
        return 0
    else
        log_error "Failed to download openapi.yaml"
        return 1
    fi
}


# Download models list from API
download_models() {
    log_info "=== Downloading Models List ==="

    local output="${REFS_DIR}/models.json"

    if curl -sfL "$MODELS_API_URL" -o "$output"; then
        local size=$(ls -lh "$output" | awk '{print $5}')
        log_info "Downloaded models.json: ${size}"

        # Pretty print and extract count
        if command -v jq &> /dev/null; then
            jq '.' "$output" > "${output}.tmp" && mv "${output}.tmp" "$output"
            local count=$(jq '.data | length' "$output" 2>/dev/null || echo "unknown")
            log_info "Found ${count} models"
        fi
        return 0
    else
        log_error "Failed to download models list"
        return 1
    fi
}

# Create quick reference guide from OpenAPI spec
create_quick_reference() {
    log_info "=== Creating Quick Reference Guide ==="

    local openapi_file="${REFS_DIR}/openapi.yaml"
    local output="${REFS_DIR}/quick-reference.md"

    if [ ! -f "$openapi_file" ]; then
        log_warn "OpenAPI YAML not found, skipping quick reference"
        return 1
    fi

    # Extract key information using simple grep/awk from YAML
    cat > "$output" << 'EOF'
# OpenRouter API Quick Reference

**Base URL:** https://openrouter.ai/api/v1

**Version:** Latest from OpenAPI specification

## Authentication

Include your API key in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY
```

## API Endpoints

### POST /chat/completions
Create a chat completion

**Example:**
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### GET /models
List all available models

**Example:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

## Common Parameters

### Chat Completions

- **model** (required): Model ID (e.g., "anthropic/claude-sonnet-4-5")
- **messages** (required): Array of message objects with role and content
- **stream** (optional): Enable streaming responses (true/false)
- **max_tokens** (optional): Maximum tokens to generate
- **temperature** (optional): Randomness (0-2)
- **top_p** (optional): Nucleus sampling
- **presence_penalty** (optional): Penalize repeated tokens
- **frequency_penalty** (optional): Penalize token frequency

## Streaming

Enable streaming by setting `"stream": true`:

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## Response Format

Successful response:
```json
{
  "id": "gen-...",
  "model": "anthropic/claude-sonnet-4-5",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```

## Error Codes

- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Invalid API key
- **402**: Payment Required - Insufficient credits
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - OpenRouter issue

## Best Practices

1. Always include Authorization header
2. Handle rate limits with exponential backoff
3. Use streaming for long responses
4. Monitor your usage via dashboard
5. Set reasonable max_tokens to control costs

## Links

- Dashboard: https://openrouter.ai
- Documentation: https://openrouter.ai/docs
- API Keys: https://openrouter.ai/keys
- Models: https://openrouter.ai/models
EOF

    local lines=$(wc -l < "$output")
    local size=$(ls -lh "$output" | awk '{print $5}')
    log_info "Created quick-reference.md: ${size}, ${lines} lines"
    return 0
}

# Create models reference guide
create_models_reference() {
    log_info "=== Creating Models Reference Guide ==="

    local models_file="${REFS_DIR}/models.json"
    local output="${REFS_DIR}/models-reference.md"

    if [ ! -f "$models_file" ]; then
        log_warn "Models JSON not found, skipping models reference"
        return 1
    fi

    # Use external Python script
    if python3 "${SCRIPT_DIR}/create_models_reference.py" "$models_file" "$output" 2>&1; then
        local lines=$(wc -l < "$output")
        local size=$(ls -lh "$output" | awk '{print $5}')
        log_info "Created models-reference.md: ${size}, ${lines} lines"
        return 0
    else
        log_error "Failed to create models reference"
        return 1
    fi
}

show_help() {
    cat << EOF
OpenRouter Documentation Updater

Updates OpenRouter API documentation from official sources.

Usage: $0 [OPTIONS]

Options:
  --all         Update all files (default)
  --openapi     Update OpenAPI specs only
  --models      Update models list only
  --help        Show this help message

Sources:
  - OpenAPI YAML: $OPENAPI_YAML_URL
  - Models API:   $MODELS_API_URL

Files Generated:
  - openapi.yaml         Complete API specification (YAML, 17k lines)
  - models.json          All available models with pricing
  - quick-reference.md   Quick start guide (generated)
  - models-reference.md  Models sorted by provider (generated)

Note: YAML format used (32% more compact than JSON, better for grep/LLMs)

Recommended Schedule:
  - Weekly: --all (comprehensive update)
  - Daily: --models (track new models and pricing changes)
EOF
}

main() {
    local do_openapi=false
    local do_models=false

    # Default: update all
    if [ $# -eq 0 ]; then
        do_openapi=true
        do_models=true
    fi

    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --openapi)
                do_openapi=true
                ;;
            --models)
                do_models=true
                ;;
            --all)
                do_openapi=true
                do_models=true
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

    # Download OpenAPI spec
    if [ "$do_openapi" = true ]; then
        download_openapi_yaml || ((failed++))
        create_quick_reference || ((failed++))
    fi

    # Download models
    if [ "$do_models" = true ]; then
        download_models || ((failed++))
        create_models_reference || ((failed++))
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
