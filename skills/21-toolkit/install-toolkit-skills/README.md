# Install Toolkit Skills

Interactively select and install skills from claude-toolkit to any project.

## What It Does

A lightweight alternative to `install-and-maintain` when you only want to install skills (no justfile/hooks generation):

1. **Finds workspace root** - Works from any subdirectory
2. **Shows skill options** - Interactive multi-select via AskUserQuestion
3. **Symlinks skills** - From toolkit source to project's `.claude/skills/`

## Usage

```bash
cd ~/Projects/my-project
claude
# Say: "install toolkit skills"
```

## Available Skills

| Skill                       | Description                                      |
| --------------------------- | ------------------------------------------------ |
| claude-docs-skill           | Claude API and CLI documentation (59 pages)      |
| openrouter-docs-skill       | OpenRouter 343+ models and pricing documentation |
| warp-docs-skill             | Warp terminal documentation (92 pages)           |
| gemini-docs-skill           | Google Gemini API documentation (64 pages)       |
| hooks-mastery               | Hook patterns and validator templates            |
| prompt-engineering-patterns | Advanced LLM prompt optimization techniques      |
| project-bootstrapper        | Initialize .claude folders with templates        |
| version-manager             | Semantic versioning with conventional commits    |
| marketplace-manager         | Plugin marketplace synchronization               |
| skill-manager               | Dynamic skill installation and management        |
| perplexity-search           | Strategy guide for Perplexity MCP tools          |

## When to Use

- **Use this skill** when you want to add specific skills to a project
- **Use `install-and-maintain`** when you want full setup (justfile, hooks, skills)

## Trigger Phrase

- `"install toolkit skills"`

## Global Installation

This skill must be installed globally to work from any project:

```bash
cp -r claude-toolkit/skills/install-toolkit-skills ~/.claude/skills/
```
