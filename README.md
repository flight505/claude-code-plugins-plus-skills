# skill-forge

Personal fork of the Tons of Skills catalog — 519 skills + 426 plugins indexed at `.claude-plugin/marketplace.json` and consumed by [`forge`](https://github.com/flight505/forge).

## What's here

| Directory         | Purpose                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `skills/`         | 519 skills across 21 categories                                                            |
| `plugins/`        | 426 plugins (mix of internal + upstream third-party)                                       |
| `tutorials/`      | 11 Jupyter notebooks (`pnpm tutorials` to list / open)                                     |
| `templates/`      | Plugin scaffolding templates                                                               |
| `.claude-plugin/` | Marketplace catalog (`marketplace.json` + `marketplace.extended.json` source of truth)     |
| `site/`           | Static HTML catalog browser built by `pnpm site`                                           |
| `scripts/`        | `validate-skills-schema.py`, `batch-remediate.py`, `tutorials.mjs`, `sync-marketplace.cjs` |

## Consuming this catalog

Install [`forge`](https://github.com/flight505/forge) and it picks up this repo as a local source automatically:

```bash
forge                              # open TUI
forge install <name>               # install to auto-detected surface
forge search "<query>"
forge suggest "<task>"
```

## Maintainer commands (this repo only)

```bash
pnpm install
pnpm site                          # build + open the catalog HTML browser
pnpm site:build                    # build only
pnpm tutorials                     # list notebooks
pnpm tutorials <n>                 # open notebook N
pnpm sync-marketplace              # regenerate marketplace.json from extended.json
pnpm lint && pnpm test && pnpm typecheck

python3 scripts/validate-skills-schema.py --verbose
```

Plugin dev loop:

```bash
forge install <plugin> --method link    # symlink into Claude Code for live reload
forge remove <plugin>                   # unlink
forge links                             # list active link installs
```

After `link`/`remove`, run `/reload-plugins` in Claude Code.

See [CLAUDE.md](./CLAUDE.md) for full repo conventions.
