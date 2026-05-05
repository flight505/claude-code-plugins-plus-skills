# Install and Maintain Skill

Analyze any codebase and generate workspace-aware Claude Code configuration with justfile, hooks, and project-local skills.

## What It Does

When invoked in any project, this skill:

1. **Analyzes the codebase** - Detects tech stack, workspace type, structure
2. **Generates configuration** - justfile, hooks, commands tailored to the project
3. **Installs skills** - Copies selected skills from claude-toolkit to project
4. **Enables three execution modes** - Deterministic, Agentic, Interactive

## Usage

```bash
# Navigate to any project
cd ~/Projects/my-project

# Start Claude and invoke the skill
claude
> "Set up this project with install-and-maintain"
```

## Generated Files

```
my-project/
├── justfile                          # Setup/maintain commands
├── .claude/
│   ├── settings.json                 # Hook configuration
│   ├── hooks/
│   │   ├── setup_init.py             # Project-specific setup
│   │   └── setup_maintenance.py      # Project-specific maintenance
│   ├── commands/
│   │   ├── setup.md                  # Agentic setup analysis
│   │   ├── setup-guide.md            # Interactive setup
│   │   └── maintain.md               # Maintenance analysis
│   └── skills/                       # Project-local skills
│       └── [selected skills]
└── setup_docs/
    └── codebase_analysis.md          # Analysis results
```

## Three Execution Modes

| Command             | Mode          | Description                            |
| ------------------- | ------------- | -------------------------------------- |
| `just setup`        | Deterministic | Fast, CI-friendly, runs hooks only     |
| `just setup-report` | Agentic       | Hooks + agent analysis + status report |
| `just setup-guide`  | Interactive   | Hooks + user questions + guided setup  |

## Tech Stack Detection

| Stack      | Indicators                   | Setup Command                     |
| ---------- | ---------------------------- | --------------------------------- |
| Python/uv  | `pyproject.toml` + `uv.lock` | `uv sync`                         |
| Python/pip | `requirements.txt`           | `pip install -r requirements.txt` |
| Node/pnpm  | `pnpm-lock.yaml`             | `pnpm install`                    |
| Node/npm   | `package-lock.json`          | `npm install`                     |
| Node/bun   | `bun.lockb`                  | `bun install`                     |
| Rust       | `Cargo.toml`                 | `cargo build`                     |
| Go         | `go.mod`                     | `go mod download`                 |
| Tauri      | `src-tauri/`                 | Rust + Node hybrid                |

## Workspace-Aware

All generated commands work from any subdirectory:

```just
# Always finds workspace root
WORKSPACE_ROOT := `git rev-parse --show-toplevel`

setup:
    cd {{WORKSPACE_ROOT}} && claude --dangerously-skip-permissions --init
```

## Trigger Phrase

- `"generate justfile setup"`

## Templates

Templates are in `templates/`:

- `justfile.template` - Command runner
- `setup_init.py.template` - Init hook
- `setup_maintenance.py.template` - Maintenance hook
- `settings.json.template` - Claude settings
- `commands/*.template` - Slash commands

## Credits

Inspired by [disler/install-and-maintain](https://github.com/disler/install-and-maintain)
