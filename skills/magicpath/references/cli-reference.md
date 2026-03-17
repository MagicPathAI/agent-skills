# MagicPath CLI Reference

> **IMPORTANT:** Always pass `-y` to skip interactive prompts when running from an agent context. Use `-o json` for structured output.

## Commands

### `info` — Project and auth context

```bash
magicpath-ai info              # human-readable
magicpath-ai info -o json      # structured JSON
```

Returns auth status, user info, projects, and CLI version.

### `login` — Authenticate

```bash
magicpath-ai login                    # one-click browser login (auto-completes)
magicpath-ai login --code <code>      # exchange auth code directly (headless fallback)
```

Opens the browser and completes login automatically when the user authorizes.

| Flag | Description |
|------|-------------|
| `--code <code>` | Exchange a browser authorization code directly (headless fallback) |

### `whoami` — Check authentication

```bash
magicpath-ai whoami
magicpath-ai whoami -o json
```

### `search` — Search components across all projects

```bash
magicpath-ai search "input"
magicpath-ai search "button" -o json
magicpath-ai search "card" --limit 5
```

Fuzzy searches component names across all projects. Returns matches with project context. Each result includes `previewImageUrl` — use `list-components` or search results to get preview images when visual context is needed.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | 20 |

### `list-projects` — List all projects

```bash
magicpath-ai list-projects
magicpath-ai list-projects -o json
magicpath-ai list-projects -o json --limit 10
```

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | all |
| `--offset <n>` | Skip first N results | 0 |

JSON output: `{ projects, pagination: { total, limit, offset, hasMore } }`

### `list-components` — List components in a project

```bash
magicpath-ai list-components <projectId>
magicpath-ai list-components <projectId> -o json
magicpath-ai list-components <projectId> -o json --limit 20
magicpath-ai list-components <projectId> -o json --after <lastId>
```

Uses cursor-based pagination. To get the next page, pass `pagination.lastId` as `--after`.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results per page | 100 |
| `--after <id>` | Cursor: fetch after this component ID | none |
| `--sort-by <field>` | Sort by `name` or `createdAt` | name |
| `--order <dir>` | Sort direction: `asc` or `desc` | asc |

JSON output: `{ components, pagination: { limit, hasNext, lastId } }`. Each component includes `previewImageUrl` (string or null) — a screenshot of the component's latest revision.

### `view` — Preview a component

```bash
magicpath-ai view <generatedName>
magicpath-ai view-component <generatedName>    # alias
```

Opens the component preview URL in the default browser. In JSON mode, returns the URL without opening.

### `inspect` — View component source code

```bash
magicpath-ai inspect <generatedName>              # human-readable with file contents
magicpath-ai inspect <generatedName> -o json      # structured JSON with source code
```

Shows the component's source code, dependencies, and import info without installing anything. This is read-only — no files are written, no package.json is required.

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--debug` | `-d` | Enable debug logging | false |

**JSON output** includes `{ component, generatedName, files: [{ path, name, content }], dependencies, importStatement?, usage? }`.

### `add` — Add a component to your project

> **IMPORTANT:** Only use `add` when you intend to import the component afterward. To inspect source code without installing, use `magicpath-ai inspect`. After adding, always import and use the component — never add and then manually replicate its styles.

```bash
magicpath-ai add <generatedName>
magicpath-ai add <generatedName> -y              # skip prompts
magicpath-ai add <generatedName> --dry-run       # preview file list only
magicpath-ai add <generatedName> -y --overwrite  # replace existing
```

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--yes` | `-y` | Skip confirmation prompts | false |
| `--overwrite` | | Overwrite existing files | false |
| `--path <path>` | `-p` | Custom component path | src/components/magicpath |
| `--dry-run` | | Preview file list without writing | false |
| `--debug` | `-d` | Enable debug logging | false |

**JSON output** (`-o json`) automatically implies `-y` (no prompts).

### `setup-skills` — Set up for AI agents

```bash
magicpath-ai setup-skills     # installs MagicPath skills for supported AI agents via npx skills add
```

### `schema` — Output JSON schemas

```bash
magicpath-ai schema            # list available schemas
magicpath-ai schema add        # schema for add command
magicpath-ai schema inspect    # schema for inspect command
```
