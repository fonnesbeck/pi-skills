# pi-skills

Oh My Pi package with reusable skills, extension commands, and theme source files.

## What it includes

- Skills for code simplification, skill auditing, lesson capture, Nushell usage, plan visualization, Slidev presentations, and Todoist time blocking.
- Extension commands for `/simplify`, `/simplify-auto`, `/simplify-status`, and Nushell-backed `!` commands.
- `themes/cobalt2.json`, an archived theme source file that can be copied into OMP's theme directory.

## Requirements

- OMP.
- Nushell (`nu`) for `extensions/nu-user-bash.ts`.

## Install

```bash
omp install /path/to/pi-skills
```

## Verify

```bash
omp --extension /path/to/pi-skills -p '/extensions'
```

## Theme activation

OMP discovers custom themes from `~/.omp/agent/themes/<name>.json`, not plugin-root `themes/`. To use `cobalt2`, copy `themes/cobalt2.json` to `~/.omp/agent/themes/cobalt2.json` and select it from OMP settings.
