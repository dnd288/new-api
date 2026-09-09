---
name: napi-spec-workflow
description: >-
  OpenSpec propose→specify→design→tasks→apply→verify→archive loop for new-api
---

# napi-spec-workflow

## When

Any non-trivial change: new feature, architectural change, new relay adapter, billing change,
database migration, or any change spanning more than one directory.

Copy fixes, obvious defects, and config/docs-only changes go straight to a PR.

## OpenSpec setup

- **Config**: `openspec/config.yaml`
- **Schemas**: `openspec/schemas/napi/` (feature/improvement) and `openspec/schemas/bugfix/` (defect)
- **Changes**: `openspec/changes/<name>/` (active work)
- **Specs**: `openspec/specs/` (archived, merged specifications)
- **Validation**: `openspec validate --all` (runs in guard checks and CI)

## Schemas

| Schema | For | Artifacts |
|--------|-----|-----------|
| `napi` | Feature, improvement, relay adapter, billing change | proposal → specs → design → tasks → verification → decision |
| `bugfix` | Defect whose cause is not obvious | report → diagnosis → tasks → verification |

```bash
# Feature (default schema)
npx openspec change new <id>

# Defect
npx openspec change new <id> --schema bugfix
```

**Always pass `--schema` for bugfix.**

## Loop

### 1. Create

```bash
npx openspec change new <id>
```

### 2. Propose

Fill proposal.md with what the change does and why. For relay adapters: which provider, which
endpoints, what format conversion. For billing: which quantities, which ratios, overflow analysis.

```bash
npx openspec propose <id>
```

### 3. Specify

Fill specs.md with scenarios and expected behavior. Each scenario maps to a test. Lines starting
with `*Test:*` become test cases.

### 4. Design

Fill design.md with the implementation approach: which packages, which files, which interfaces.
For relay adapters: the adapter struct, the format conversion, stream support.

### 5. Tasks

Fill tasks.md with ordered implementation steps. Test-first: write the failing test before the
implementation. Dependency order: model → service → controller → relay → frontend.

### 6. Apply

```bash
npx openspec apply <id>
```

Implement following the task list. Run `./scripts/guard.sh --static-only` after each significant
change.

### 7. Verify

Fill verification.md with evidence. Paste the RED test output, then the GREEN output.
Name what was not tested and why.

### 8. Archive

```bash
npx openspec archive <id>
```

Folds specs into `openspec/specs/`.

## End-to-End Flow with GitHub Issues

Use `/opsx:flow` for the full workflow that syncs with GitHub Issues. See the command at
`.claude/commands/opsx/flow.md`.

## Commands

| Command | What it does |
|---------|-------------|
| `npx openspec change new <id>` | Create a new change |
| `npx openspec propose <id>` | Generate/update proposal |
| `npx openspec apply <id>` | Mark change as applying |
| `npx openspec archive <id>` | Archive completed change |
| `npx openspec validate --all` | Validate all changes and specs |
| `npx openspec list` | List active changes |
| `npx openspec status --change <id>` | Show change status |
| `npx openspec doctor` | Check OpenSpec health |
