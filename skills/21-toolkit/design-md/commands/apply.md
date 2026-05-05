---
description: Apply a DESIGN.md template from the design-md library into the current project.
argument-hint: <brand> [--force]
---

Apply the `{{args}}` DESIGN.md template into the current working directory.

Run:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/apply.sh" {{args}}
```

After the template is installed, confirm the file path, briefly note the style (color/typography signature from the manifest), and tell the user they can now ask Claude to build UI that follows the DESIGN.md in this project.

If the brand slug is unknown, run `list.sh` and suggest closest matches. Do not invent tokens or hex codes for brands that aren't in the catalog.
