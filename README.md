# pi-skills

A reusable skills package for oh-my-pi, including skills, extension commands,
and archived theme source files.

## Skills

| Skill | Use when |
| --- | --- |
| `audit-skills` | Auditing a skills directory for visibility, determinism, composability, and cross-skill hygiene. |
| `code-simplifier` | Cleaning up recently edited code while preserving exact behavior; also backs the `/simplify` workflow. |
| `lessons-learned` | Updating a skill after a rough interaction so the correction is captured in the skill itself. |
| `nushell` | Writing or running Nushell commands, scripts, structured-data pipelines, or `.nu` files. |
| `plan-viz` | Turning an implementation plan, roadmap, or architecture notes into a self-contained HTML visual overview. |
| `slidev` | Building, editing, reviewing, or exporting technical presentations with Slidev. |
| `todoist-time-blocking` | Planning or reviewing daily and weekly work using Todoist time blocks and calendar context. |

## Extensions

- `/simplify`, `/simplify-auto`, and `/simplify-status` for invoking the code
  simplifier workflow from an omp session.
- Nushell-backed `!` command handling via `extensions/nu-user-bash.ts`.

## Theme source

`themes/cobalt2.json` is archived here for convenience. omp discovers custom
themes from `~/.omp/agent/themes/<name>.json`, not from a plugin's `themes/`
directory. To use it, copy `themes/cobalt2.json` to
`~/.omp/agent/themes/cobalt2.json` and select it from omp settings.

## Requirements

- omp.
- Nushell (`nu`) for `extensions/nu-user-bash.ts`.

## Install

```bash
git clone https://github.com/fonnesbeck/pi-skills.git
cd pi-skills
omp install .
```

For a local path, `omp install .` links this directory into omp's plugin
directory, so later edits are picked up from the checkout.

## Verify

```bash
omp plugin list
omp read skill://code-simplifier
omp --no-session -p '/simplify-status'
```

`omp plugin list` should show `pi-skills@1.0.0`. `omp read
skill://code-simplifier` verifies skill discovery, and `/simplify-status`
verifies the extension command is registered. Do not use `omp --extension
/path/to/pi-skills -p '/extensions'`; `--extension` is for loading extension
entry points for a single run, not for confirming an installed plugin package.
