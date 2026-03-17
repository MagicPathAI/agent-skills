# MagicPath CLI Reference

Always pass `-y` to skip interactive prompts when running from an agent context. Use `-o json` for structured output.

## `info`

```bash
magicpath-ai info
magicpath-ai info -o json
```

Returns auth status, user info, projects, and CLI version.

## `login`

```bash
magicpath-ai login
magicpath-ai login --code <code>
```

Opens the browser and completes login automatically when the user authorizes.

## `whoami`

```bash
magicpath-ai whoami
magicpath-ai whoami -o json
```

## `search`

```bash
magicpath-ai search "input"
magicpath-ai search "button" -o json
magicpath-ai search "card" --limit 5
```

Searches components across all projects. Results include project context and may include `previewImageUrl`.

Flags:

- `--limit <n>`: maximum results, default `20`

## `list-projects`

```bash
magicpath-ai list-projects
magicpath-ai list-projects -o json
magicpath-ai list-projects -o json --limit 10
```

Flags:

- `--limit <n>`: maximum results, default `all`
- `--offset <n>`: skip first `N` results, default `0`

JSON output: `{ projects, pagination: { total, limit, offset, hasMore } }`

## `list-components`

```bash
magicpath-ai list-components <projectId>
magicpath-ai list-components <projectId> -o json
magicpath-ai list-components <projectId> -o json --limit 20
magicpath-ai list-components <projectId> -o json --after <lastId>
```

Uses cursor-based pagination.

Flags:

- `--limit <n>`: maximum results per page, default `100`
- `--after <id>`: fetch after this component ID
- `--sort-by <field>`: `name` or `createdAt`, default `name`
- `--order <dir>`: `asc` or `desc`, default `asc`

JSON output: `{ components, pagination: { limit, hasNext, lastId } }`

## `view`

```bash
magicpath-ai view <generatedName>
magicpath-ai view-component <generatedName>
```

Opens the component preview URL in the default browser. In JSON mode, returns the URL without opening.

## `add`

Only use `add` when you intend to import the component afterward. To inspect source code without installing, use `add --inspect`.

```bash
magicpath-ai add <generatedName>
magicpath-ai add <generatedName> -y
magicpath-ai add <generatedName> --inspect
magicpath-ai add <generatedName> --dry-run
magicpath-ai add <generatedName> -y --overwrite
```

Flags:

- `--yes`, `-y`: skip confirmation prompts
- `--overwrite`: overwrite existing files
- `--path <path>`, `-p`: custom component path, default `src/components/magicpath`
- `--dry-run`: preview file list without writing
- `--inspect`: show full source code without installing
- `--debug`, `-d`: enable debug logging

`--inspect` implies `--dry-run`. In JSON mode, both include file contents. JSON output also implies non-interactive mode.

## `integrate`

```bash
magicpath-ai integrate <generatedName> --target <file> --no-review -o json
magicpath-ai integrate <generatedName> --target <file> --dry-run -o json
```

Returns modified file contents but does not write them. The agent must write each `modifiedFiles[].content` to its `path`.

Flags:

- `--target <file>`, `-t`: target file, required in JSON mode
- `--no-review`: apply without interactive review
- `--dry-run`: preview without writing
- `--debug`, `-d`: enable debug logging

## `setup-skills`

```bash
magicpath-ai setup-skills
```

Writes local editor rules for Claude Code, Cursor, and GitHub Copilot.

## `schema`

```bash
magicpath-ai schema
magicpath-ai schema add
```

Outputs JSON schemas for CLI responses.
