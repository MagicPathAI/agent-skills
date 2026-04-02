# MagicPath CLI Reference

> **IMPORTANT:** Always pass `-y` to skip interactive prompts when running from an agent context. Use `-o json` for structured output.

## Commands

### `info` — Project and auth context

```bash
magicpath-ai info              # human-readable
magicpath-ai info -o json      # structured JSON
```

Returns auth status, user info, organizations, projects (personal + org), and CLI version. The `organizations` array shows which orgs the user belongs to and their role. Use `list-members` for full member details of a specific org.

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

### `list-orgs` — List organizations

```bash
magicpath-ai list-orgs
magicpath-ai list-orgs -o json
```

Lists all organizations the user belongs to, with their role in each.

JSON output: `{ organizations: [{ id, name, role }] }`

### `list-members` — List members of an organization

```bash
magicpath-ai list-members --org "Acme Inc"
magicpath-ai list-members --org "Acme Inc" -o json
magicpath-ai list-members --org <orgId> -o json
```

Lists all members of the specified organization. The `--org` flag is required and accepts a name (case-insensitive) or ID.

JSON output: `{ organization: { id, name }, members: [{ id, displayName, email, role }] }`

Use `list-members` to resolve a person's name to their user ID, then use `--created-by <userId>` on `list-components` to find their work.

### `search` — Search components across all projects

```bash
magicpath-ai search "input"
magicpath-ai search "button" -o json
magicpath-ai search "card" --limit 5
magicpath-ai search "header" --org "Acme Inc" -o json
magicpath-ai search "nav" --personal -o json
```

Searches component names (case-insensitive substring match) across all accessible projects (personal + organization). Returns matches with project and workspace context. Each result includes `previewImageUrl` — use `list-components` or search results to get preview images when visual context is needed.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | 20 |
| `--org <nameOrId>` | Search only within a specific organization | all |
| `--personal` | Search only personal projects | false |

JSON output includes `ownerType` (`"personal"` or `"organization"`) and `ownerName` on each result.

### `list-projects` — List all projects

```bash
magicpath-ai list-projects
magicpath-ai list-projects -o json
magicpath-ai list-projects -o json --limit 10
magicpath-ai list-projects --org "Acme Inc" -o json
magicpath-ai list-projects --personal -o json
```

By default, lists all accessible projects (personal + all organizations). Use `--org` or `--personal` to filter.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | all |
| `--offset <n>` | Skip first N results | 0 |
| `--org <nameOrId>` | Filter to a specific organization (name or ID) | all |
| `--personal` | Show only personal projects | false |

JSON output: `{ projects, pagination: { total, limit, offset, hasMore } }`. Each project includes:
- `ownerType` (`"personal"` or `"organization"`) and `ownerName` (user email or org name)
- `createdBy` (object or null) — `{ id, displayName }` of the user who created this project

### `list-components` — List components in a project

```bash
magicpath-ai list-components <projectId>
magicpath-ai list-components <projectId> -o json
magicpath-ai list-components <projectId> -o json --limit 20
magicpath-ai list-components <projectId> -o json --after <lastId>
magicpath-ai list-components <projectId> --created-by <userId> -o json
magicpath-ai list-components <projectId> --created-by <userId> --sort-by createdAt --order desc -o json
```

Uses cursor-based pagination. To get the next page, pass `pagination.lastId` as `--after`.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results per page | 100 |
| `--after <id>` | Cursor: fetch after this component ID | none |
| `--sort-by <field>` | Sort by `name` or `createdAt` | name |
| `--order <dir>` | Sort direction: `asc` or `desc` | asc |
| `--created-by <userId>` | Filter to components created or edited by this user | none |

JSON output: `{ components, pagination: { limit, hasNext, lastId } }`. Each component includes:
- `previewImageUrl` (string or null) — a screenshot of the component's latest revision
- `lastEditedBy` (object or null) — `{ id, displayName }` of the user who last edited this component

### `list-themes` — List all themes (design systems)

```bash
magicpath-ai list-themes
magicpath-ai list-themes -o json
magicpath-ai list-themes --org "Acme Inc" -o json
```

Lists design systems (themes) for the current user, or for a specific organization with `--org`.

| Flag | Description | Default |
|------|-------------|---------|
| `--org <nameOrId>` | List themes for a specific organization | personal |

JSON output: `{ themes: [{ id, name, isPublic, createdAt, updatedAt }] }`

### `get-theme` — Get a theme definition

```bash
magicpath-ai get-theme <themeId>
magicpath-ai get-theme <themeId> -o json
magicpath-ai get-theme "My Brand Theme" -o json    # lookup by name
magicpath-ai get-theme "Brand" --org "Acme Inc" -o json  # lookup in org
```

Fetches the full theme definition including CSS variables, fonts, and styling prompt. Accepts a numeric ID or a theme name (case-insensitive match). Use `--org` to look up themes within a specific organization.

| Flag | Description | Default |
|------|-------------|---------|
| `--org <nameOrId>` | Look up theme within a specific organization | personal |

JSON output: `{ id, name, theme: { light: { "--var": "value", ... }, dark: { ... } }, defaultTheme, prompt?, fonts?, version }`

Key fields for agents:
- `theme.light` / `theme.dark` — CSS variable maps to apply to components
- `prompt` — Natural language styling instructions from the designer (e.g., "use rounded corners, prefer shadows over borders")
- `fonts` — Font metadata with source (`google` or `custom`) and weight URLs
- `defaultTheme` — Whether the theme defaults to `"light"` or `"dark"`

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

`inspect` works in any project type. For non-React projects (Swift, Python, etc.), use `inspect` to read MagicPath component source code as a reference for recreating the component in your target language.

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--debug` | `-d` | Enable debug logging | false |

**JSON output** includes `{ component, generatedName, files: [{ path, name, content }], dependencies, importStatement?, usage? }`.

### `add` — Add a component to your project

> **IMPORTANT:** Only use `add` in React/TypeScript projects where you intend to import the component afterward. For non-JS projects, use `magicpath-ai inspect` to read source code and translate it. After adding, always import and use the component — never add and then manually replicate its styles.

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

### `list-installed` — List installed MagicPath components

```bash
magicpath-ai list-installed
magicpath-ai list-installed -o json
magicpath-ai list-installed --path src/components/custom
```

Lists MagicPath components already installed in the current project by scanning the components directory. Useful for checking what's already been added before installing new components.

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--path <path>` | `-p` | Custom components directory | src/components/magicpath |

JSON output: `{ components: [{ name, folder, path, files, exportName, importStatement }], total, componentsPath }`

### `selection` — Get current canvas selection

```bash
magicpath-ai selection
magicpath-ai selection -o json
```

Returns the component(s) currently selected in the MagicPath web app canvas. Connects to the user's active canvas session in real-time to read selection state. Returns an empty list if the user has nothing selected or no canvas open.

JSON output: `{ components: [{ id, name, generatedName, clientId, projectId, projectName }] }`
