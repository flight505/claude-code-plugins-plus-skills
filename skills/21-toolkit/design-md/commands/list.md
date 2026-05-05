---
description: List all DESIGN.md templates in the design-md library.
argument-hint: [--search TERM] [--category NAME] [--flat]
---

Show the available DESIGN.md templates.

Run:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/list.sh" {{args}}
```

By default, templates are grouped by category (AI & LLM, Developer Tools, Fintech, etc.). Use `--flat` for an alphabetical list, `--search <term>` to filter by substring, or `--category <name>` to filter by group.

After showing the list, if the user named a specific brand, offer to apply it via `/design-md:apply <brand>`.
