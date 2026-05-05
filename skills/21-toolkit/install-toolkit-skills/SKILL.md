---
name: install-toolkit-skills
description: Install skills from claude-toolkit to the current project via interactive selection. Use when the user asks to add toolkit skills, browse the skill catalog, or says "install toolkit skills".
---

# Install Toolkit Skills

**Install skills from claude-toolkit to the current project.**

## Skill Catalog

**IMPORTANT:** This catalog lists ALL available skills in claude-toolkit. If a user asks for something that matches a skill below but that skill is NOT installed in the current project, inform them and offer to install it.

| Skill                        | Triggers                                                                                                                                                                                                                                                                                                                                                                                                                  | Description                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| claude-docs-skill            | Claude API, CLI, hooks, plugins, skills, subagents, MCP, SDKs, deployment                                                                                                                                                                                                                                                                                                                                                 | Complete local Claude docs — use instead of web search                                                                                                                                                     |
| openrouter-docs-skill        | OpenRouter API, model routing, pricing, providers                                                                                                                                                                                                                                                                                                                                                                         | Complete local OpenRouter docs — use instead of web search                                                                                                                                                 |
| warp-docs-skill              | Warp terminal, agents, AI features, configuration                                                                                                                                                                                                                                                                                                                                                                         | Complete local Warp docs — use instead of web search                                                                                                                                                       |
| gemini-docs-skill            | Gemini API, models, function calling, structured output, Live API, pricing, SDKs                                                                                                                                                                                                                                                                                                                                          | Complete local Gemini docs — use instead of web search                                                                                                                                                     |
| hooks-mastery                | "create hook", "build validator", "setup hooks", "automatic validation"                                                                                                                                                                                                                                                                                                                                                   | Hook patterns and validator templates                                                                                                                                                                      |
| project-bootstrapper         | "initialize project", "setup claude folder", "bootstrap project"                                                                                                                                                                                                                                                                                                                                                          | Initialize .claude folders with templates                                                                                                                                                                  |
| version-manager              | "version bump", "bump version", "semantic versioning"                                                                                                                                                                                                                                                                                                                                                                     | Semantic versioning with conventional commits                                                                                                                                                              |
| marketplace-manager          | "marketplace sync", "sync marketplace", "marketplace validate"                                                                                                                                                                                                                                                                                                                                                            | Plugin marketplace synchronization                                                                                                                                                                         |
| skill-manager                | "install skill", "remove skill", "list skills"                                                                                                                                                                                                                                                                                                                                                                            | Dynamic skill installation and management                                                                                                                                                                  |
| perplexity-search            | "search the web", "perplexity search"                                                                                                                                                                                                                                                                                                                                                                                     | Strategy guide for Perplexity MCP tools — query crafting and tool selection                                                                                                                                |
| design-md                    | "apply design", "use [brand] design", "DESIGN.md", "make it look like linear/stripe/claude", "list design systems"                                                                                                                                                                                                                                                                                                        | 71 DESIGN.md design-system files (Claude, Linear, Stripe, Vercel, Apple, Figma, Tesla, …) — drop-in UI reference for AI agents                                                                             |
| ai-startup-advisor           | "is this idea defensible", "startup idea", "product strategy", "competitive positioning", "should I build X"                                                                                                                                                                                                                                                                                                              | Strategic advisor — defensibility scorecard, opportunity generation, AI landscape positioning                                                                                                              |
| fusion360-scripting          | Fusion 360, adsk.core, adsk.fusion, Fusion API, Fusion add-in, parametric modeling script                                                                                                                                                                                                                                                                                                                                 | Expert Fusion 360 API scripting — verified patterns, local docs, prevents hallucinated methods                                                                                                             |
| applescript                  | "AppleScript", "JXA", "osascript", "automate macOS app", "do shell script", "tell application"                                                                                                                                                                                                                                                                                                                            | AppleScript and JXA on macOS — secure execution, safe interpolation, application dictionaries                                                                                                              |
| app-onboarding-questionnaire | "design onboarding", "build onboarding flow", "questionnaire onboarding", "Headspace style", "Noom style", "subscription app onboarding"                                                                                                                                                                                                                                                                                  | 5-phase onboarding designer (Discovery → Transformation → Blueprint → Content → Implementation), platform-agnostic                                                                                         |
| apple                        | iOS, macOS, watchOS, Swift, SwiftUI, StoreKit, "App Store", "ASO keywords", "App Store screenshots", "cinematic onboarding", "AXUIElement", "macOS accessibility", "review response", "Apple Intelligence", "Core ML", "Liquid Glass", "generate Swift code", "add paywall", "grow my app", "privacy policy", "GDPR", "security", "Keychain", "TDD iOS", "watchOS", "app PRD", "pre-submission review", "monetize my app" | Full Apple platform toolkit — 20 sub-skills: iOS, macOS, watchOS, Swift, design, generators, ASO screenshots, cinematic onboarding, accessibility, legal, security, testing, growth, monetization, product |
| webapp-testing               | "test web app", "Playwright", "browser testing", "frontend testing", "UI testing"                                                                                                                                                                                                                                                                                                                                         | Web app testing with Playwright — frontend verification, UI debugging, browser screenshots                                                                                                                 |

## Trigger Matching

When a user request matches a trigger phrase above:

1. **Check if the skill is installed** in `<workspace>/.claude/skills/`
2. **If installed** → The skill handles the request (do nothing here)
3. **If NOT installed** → Tell the user: "That requires the `{skill_name}` skill which isn't installed in this project. Want me to install it?"
4. **If user says yes** → Run the installation workflow below

## Installation Workflow

### Step 1: Find Workspace Root

```bash
WORKSPACE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
```

### Step 2: Show Available Skills

Check which skills are already installed, then present a numbered table showing
status and description. Let the user pick by number, name, or category — no
multiSelect needed.

```
## Available Skills (17 project-local)

Already installed skills are marked with ✓.

 #  | Skill                          | Status | Description
----|--------------------------------|--------|-------------------------------------------
 1  | claude-docs-skill              | ✓      | Claude API + CLI docs
 2  | openrouter-docs-skill          |        | OpenRouter API + models docs
 3  | warp-docs-skill                |        | Warp terminal docs
 4  | gemini-docs-skill              | ✓      | Gemini API docs
 5  | hooks-mastery                  |        | Hook patterns and validators
 6  | project-bootstrapper           |        | Initialize .claude folders
 7  | version-manager                |        | Semantic versioning
 8  | marketplace-manager            |        | Plugin marketplace sync
 9  | skill-manager                  |        | Dynamic skill management
10  | perplexity-search              |        | Perplexity MCP strategy guide
11  | design-md                      |        | 71 DESIGN.md files (Claude, Linear, Stripe, …)
12  | ai-startup-advisor             |        | AI startup defensibility advisor
13  | fusion360-scripting            |        | Fusion 360 API scripting expert
14  | applescript                    |        | AppleScript + JXA on macOS
15  | app-onboarding-questionnaire   |        | 5-phase onboarding flow designer (any platform)
16  | apple                          |        | Full Apple toolkit — iOS, macOS, watchOS, Swift, ASO, legal, security… (20 sub-skills)
17  | webapp-testing                 |        | Web app testing with Playwright

Which skills would you like to install? (numbers, names, "all", or "docs" for all doc skills)
```

Check installation status by looking for `$WORKSPACE_ROOT/.claude/skills/<name>/SKILL.md`.

Handle common shortcuts:

- **"all"** → install everything not already installed
- **"docs"** → install all 4 doc skills
- **"1, 3, 5"** or **"1-5"** → install by number
- **skill names** → install by name

### Step 3: Install Selected Skills

Skills are installed as **symlinks** via the `ccpi` CLI (Claude Code Plugins + Skills):

```bash
# Project-local install (recommended)
ccpi skills install {skill_name} --surface project

# Global install (available in every project)
ccpi skills install {skill_name} --surface claude

# Install multiple
ccpi skills install hooks-mastery version-manager --surface project
```

If `ccpi` is not installed, use the raw symlink fallback:

```bash
TOOLKIT_DIR="$HOME/Projects/Dev_projects/Claude_SDK/claude-code-plugins-plus-skills/skills/21-toolkit"
ln -sfn "$TOOLKIT_DIR/{skill_name}" "$WORKSPACE_ROOT/.claude/skills/{skill_name}"
```

### Step 4: Report Results

```markdown
## Skills Installed

**Workspace:** {workspace_root}
**Method:** symlinked from claude-code-plugins-plus-skills/skills/21-toolkit

### Installed:

- {list of installed skills}

Skills are immediately available via Claude Code hot-reload.
To uninstall: `ccpi skills remove {skill_name} --surface project`
```

## Notes

- Skills are **symlinked** to `<workspace>/.claude/skills/` — NOT copied
- Symlinks point to: `~/Projects/Dev_projects/Claude_SDK/claude-code-plugins-plus-skills/skills/21-toolkit/`
- Only 2 global skills exist: `install-and-maintain` and `install-toolkit-skills`
- Claude Code discovers skills in `.claude/skills/` automatically (hot-reload, no restart)
- Doc skills have large reference files (24MB+) — symlinks prevent duplication
- To list all skills: `ccpi skills list`
- To uninstall: `ccpi skills remove <skill-name> --surface project`
- This does NOT generate justfile or hooks (use "generate justfile setup" for that)
