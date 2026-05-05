# openrouter-docs-skill

**Comprehensive OpenRouter API documentation with intelligent routing for 345+ AI models.**

## Overview

This skill provides access to complete OpenRouter API documentation, including:

- **345+ AI Models** from 15+ providers (Claude, GPT, Gemini, Llama, Mistral, and more)
- **Real-time Pricing** for all models
- **Complete API Reference** via OpenAPI specification
- **Smart Routing** across 3 documentation tiers

## Trigger Phrases

**API Documentation:**

- `openrouter api documentation`

**Model Documentation:**

- `openrouter model documentation`

**Update Documentation:**

- `update openrouter documentation`

**Total: 3 triggers**

**Note:** Singular "model" (not "models") keeps it specific to OpenRouter and avoids triggering on generic AI model discussions.

## How It Works

### 3-Tier Architecture

The skill uses a 3-tier hierarchy for efficient context usage:

**Tier 1: Quick Reference (8.5KB)**

- Authentication
- Common endpoints
- Basic examples
- Use when: Getting started, syntax lookups

**Tier 2: Models Reference (127KB)**

- All 345+ models grouped by provider
- Current pricing
- Context lengths and capabilities
- Use when: Choosing models, comparing options

**Tier 3: Complete API Spec (804KB)**

- Full OpenAPI specification (YAML format only)
- All endpoints with parameters
- Request/response schemas
- Use when: Detailed API parameters, error codes
- YAML chosen for grep-friendliness and LLM readability

## Installation

### 1. Install Skill

```bash
# From toolkit directory
cp -r skills/openrouter-docs-skill ~/.claude/skills/
```

### 2. Verify Installation

```bash
ls -la ~/.claude/skills/openrouter-docs-skill/
# Should show: SKILL.md, references/, scripts/
```

### 3. Test Skill

Start a new Claude Code session and test:

```
"What OpenRouter API models are available?"
"How do I authenticate with OpenRouter?"
"Compare pricing for Claude vs GPT-4"
```

## Updating Documentation

### Update All Documentation (Recommended)

```bash
cd skills/openrouter-docs-skill/scripts
./update-openrouter-docs.sh
```

This downloads:

- OpenAPI specification (YAML only - grep-friendly)
- Complete models list from API
- Generates quick reference and models reference

**Duration:** ~40 seconds
**Recommended frequency:** Weekly (models and pricing change frequently)

### Update Models Only (Fast)

```bash
cd skills/openrouter-docs-skill/scripts
./update-openrouter-docs.sh --models
```

**Duration:** ~10 seconds
**Recommended frequency:** Daily

### Reinstall After Updates

```bash
# Copy updated files to global installation
cp -r skills/openrouter-docs-skill ~/.claude/skills/
```

## File Structure

```
openrouter-docs-skill/
├── README.md                   # This file
├── SKILL.md                    # Skill configuration
├── references/
│   ├── quick-reference.md      # Tier 1 (auto-generated)
│   ├── models-reference.md     # Tier 2 (127KB, auto-generated)
│   ├── models.json             # Raw models data (471KB)
│   └── openapi.yaml            # Tier 3 (804KB, YAML only)
└── scripts/
    ├── update-openrouter-docs.sh
    └── create_models_reference.py
```

## Usage Examples

### API Queries

```
"How do I use the OpenRouter API?"
→ Tier 1: Authentication and basic examples

"What's the completions endpoint format?"
→ Tier 1: Quick reference for common endpoints

"What parameters does streaming support?"
→ Tier 3: OpenAPI spec (completions endpoint)
```

### Models Queries

```
"What Claude models are on OpenRouter?"
→ Tier 2: Models reference (Anthropic section)

"Compare pricing for all GPT-4 variants"
→ Tier 2: Models reference (OpenAI section)

"What's the cheapest model with 100k context?"
→ Tier 2: Models reference (filter by context + pricing)

"Which models support function calling?"
→ Tier 2: Models reference (capabilities)
```

## Coverage

### Supported Providers ✅

- **Anthropic** - Claude Opus, Sonnet, Haiku
- **OpenAI** - GPT-4, GPT-4 Turbo, GPT-3.5
- **Google** - Gemini Pro, Flash, Ultra
- **Meta** - Llama 2, Llama 3
- **Mistral** - Large, Medium, Small
- **Cohere** - Command R, Command R+
- **And 10+ more providers**

### Features ✅

- Chat completions
- Streaming responses
- Function/tool calling
- Vision (multimodal)
- JSON mode
- Context caching (where supported)

### Not Covered ❌

- OpenRouter dashboard/UI
- Account management and billing
- API key creation (do via openrouter.ai)
- Model training or fine-tuning

## Common Queries

### "How do I authenticate?"

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### "What's the difference between OpenRouter and direct API?"

OpenRouter provides:

- Single API for 345+ models from 15+ providers
- Automatic failover and load balancing
- Unified pricing and billing
- No need for multiple API keys

### "How often does pricing change?"

Pricing updates frequently (weekly to monthly). Run `./update-openrouter-docs.sh --models` to get latest pricing.

## Best Practices

### DO ✅

- Start with quick reference for basic queries
- Use models reference for selection and pricing
- Update models list weekly (pricing changes)
- Compare models before recommending
- Include pricing context in responses

### DON'T ❌

- Load entire OpenAPI spec (use grep/sed)
- Answer pricing from memory (check current docs)
- Skip model comparison when relevant
- Forget to cite sources

## Troubleshooting

### Skill Not Triggering

**Symptom:** Claude Code doesn't invoke openrouter-docs-skill

**Solution:**

```bash
# Check installation
ls ~/.claude/skills/openrouter-docs-skill/SKILL.md

# If missing, install:
cp -r skills/openrouter-docs-skill ~/.claude/skills/
```

### Documentation Out of Date

**Symptom:** Pricing or models don't match openrouter.ai

**Solution:**

```bash
cd skills/openrouter-docs-skill/scripts
./update-openrouter-docs.sh

# Reinstall
cp -r ../. ~/.claude/skills/openrouter-docs-skill/
```

### Update Script Fails

**Symptom:** Error downloading files

**Solutions:**

- Check internet connection
- Verify openrouter.ai is accessible
- Try again (temporary network issues)
- Check if jq is installed: `brew install jq` (optional but recommended)

## Maintenance

### Update Schedule

| Update Type | Frequency | Command                                |
| ----------- | --------- | -------------------------------------- |
| Full update | Weekly    | `./update-openrouter-docs.sh`          |
| Models only | Daily     | `./update-openrouter-docs.sh --models` |

**Why frequent updates:**

- New models added 2-3 times per week
- Pricing changes monthly
- New features and capabilities

### Version Information

- **Skill Version:** 1.0.0
- **OpenAPI Source:** https://openrouter.ai/openapi.yaml
- **Models Source:** https://openrouter.ai/api/v1/models
- **Last Updated:** 2026-01-24

## Contributing

When modifying the skill:

1. Edit `skills/openrouter-docs-skill/SKILL.md` in toolkit repo
2. Test changes locally
3. Install to global skills: `cp -r skills/openrouter-docs-skill ~/.claude/skills/`
4. Verify in new Claude Code session
5. Commit changes to toolkit repo

## License

Part of the claude-toolkit project.
