# cleanup-cli

Scan a directory tree and delete matching folders (e.g. `node_modules`) up to a configurable depth — reclaim disk space without hunting through every project by hand.

## Features

- 🔍 Recursively scans a directory tree up to a max depth
- 🎯 Finds any folder by name (defaults to `node_modules`)
- 📦 Reports how much disk space each match — and the total — takes up
- 🧪 `--dry-run` mode to preview matches before deleting anything
- ✅ Confirmation prompt before deleting (skip it with `-y`)
- 🚫 Never descends into a matched folder, so it won't waste time scanning what it's about to delete

## Installation

Install globally to use the `cleanup` command anywhere:

```bash
npm install -g cleanup-cli
```

Or run it without installing, via `npx`:

```bash
npx cleanup-cli -d ./my-projects
```

## Usage

```bash
cleanup -d <path> [options]
```

`-d, --dir <path>` is required — it's the root directory to scan.

### Examples

Preview all `node_modules` folders up to 3 levels deep (no deletion):

```bash
cleanup -d ~/code --dry-run
```

Delete them, with a confirmation prompt:

```bash
cleanup -d ~/code
```

Skip the confirmation prompt (useful in scripts):

```bash
cleanup -d ~/code -y
```

Clean up a different folder, e.g. `dist` build output, scanning deeper:

```bash
cleanup -d ~/code -t dist -l 5
```

## Options

| Flag | Alias | Description | Default |
| --- | --- | --- | --- |
| `--dir <path>` | `-d` | Root directory to scan (required) | — |
| `--target-dir <name>` | `-t` | Folder name to find/delete | `node_modules` |
| `--level <number>` | `-l` | Max depth to scan (root = level 1) | `3` |
| `--dry-run` | | List matches without deleting anything | `false` |
| `--yes` | `-y` | Skip the confirmation prompt | `false` |
| `--version` | `-V` | Print the version number | |
| `--help` | `-h` | Print usage information | |

## How it works

1. `cleanup` always runs a dry-run pass first, printing every match it finds along with its size and a running total.
2. If no matches are found, it exits — nothing else happens.
3. If `--dry-run` was passed, it stops here.
4. Otherwise, it asks for confirmation (unless `-y` was passed), then deletes each matched folder and reports how much space was freed.

Matched folders are never scanned recursively — once `cleanup` finds a `node_modules` (or whatever `--target-dir` you set), it stops descending into it.

## Safety notes

- Always run with `--dry-run` first if you're unsure what will be matched.
- Deletion is permanent — folders are removed with `fs.rmSync` and are **not** sent to the trash/recycle bin.
- The `--level` option limits how deep the scan goes, counting the root directory itself as level 1.

## License

MIT
