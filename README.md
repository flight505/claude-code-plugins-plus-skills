# claude-code-plugins-plus-skills

Personal fork — local development environment for `ccpi` (Claude Code plugin & skills CLI).

## What's here

| Directory         | Purpose                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `packages/cli/`   | `ccpi` CLI source (TypeScript, builds to `dist/`)                                          |
| `skills/`         | 519 skills across 21 categories                                                            |
| `plugins/`        | Plugin catalog for `ccpi link`                                                             |
| `tutorials/`      | 11 Jupyter notebooks                                                                       |
| `templates/`      | Plugin scaffolding templates                                                               |
| `.claude-plugin/` | Marketplace catalog (`marketplace.json`)                                                   |
| `scripts/`        | `validate-skills-schema.py`, `batch-remediate.py`, `quick-test.sh`, `sync-marketplace.cjs` |

## Setup

```bash
cd packages/cli && pnpm build
ln -sf "$(pwd)/dist/index.js" ~/.local/bin/ccpi
```

See `packages/cli/QUICKGUIDE.md` for full usage.
