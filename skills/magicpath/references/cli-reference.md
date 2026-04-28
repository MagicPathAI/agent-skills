# MagicPath CLI Reference

> **IMPORTANT:** Always pass `-y` to skip interactive prompts when running from an agent context. Use `-o json` for structured output.

## Commands

### `info` — Project and auth context

```bash
magicpath-ai info              # human-readable
magicpath-ai info -o json      # structured JSON
```

Returns auth status, user info, teams, projects (personal + team), and CLI version. The `teams` array shows which teams the user belongs to and their role. Use `list-members` for full member details of a specific team.

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

### `list-teams` — List teams

```bash
magicpath-ai list-teams
magicpath-ai list-teams -o json
```

Lists all teams the user belongs to, with their role in each.

JSON output: `{ teams: [{ id, name, role }] }`

### `list-members` — List members of a team

```bash
magicpath-ai list-members --team "Acme Inc"
magicpath-ai list-members --team "Acme Inc" -o json
magicpath-ai list-members --team <teamId> -o json
```

Lists all members of the specified team. The `--team` flag is required and accepts a name (case-insensitive) or ID.

JSON output: `{ team: { id, name }, members: [{ id, displayName, email, role }] }`

Use `list-members` to resolve a person's name to their user ID, then use `--created-by <userId>` on `list-components` to find their work.

### `search` — Search components across all projects

```bash
magicpath-ai search "input"
magicpath-ai search "button" -o json
magicpath-ai search "card" --limit 5
magicpath-ai search "header" --team "Acme Inc" -o json
magicpath-ai search "nav" --personal -o json
```

Searches component names (case-insensitive substring match) across all accessible projects (personal + team). Returns matches with project and workspace context. Each result includes `previewImageUrl` — use `list-components` or search results to get preview images when visual context is needed.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | 20 |
| `--team <nameOrId>` | Search only within a specific team | all |
| `--personal` | Search only personal projects | false |

JSON output includes `ownerType` (`"personal"` or `"team"`) and `ownerName` on each result.

### `list-projects` — List all projects

```bash
magicpath-ai list-projects
magicpath-ai list-projects -o json
magicpath-ai list-projects -o json --limit 10
magicpath-ai list-projects --team "Acme Inc" -o json
magicpath-ai list-projects --personal -o json
```

By default, lists all accessible projects (personal + all teams). Use `--team` or `--personal` to filter.

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Max results | all |
| `--offset <n>` | Skip first N results | 0 |
| `--team <nameOrId>` | Filter to a specific team (name or ID) | all |
| `--personal` | Show only personal projects | false |

JSON output: `{ projects, pagination: { total, limit, offset, hasMore } }`. Each project includes:
- `ownerType` (`"personal"` or `"team"`) and `ownerName` (user email or team name)
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
magicpath-ai list-themes --team "Acme Inc" -o json
```

Lists design systems (themes) for the current user, or for a specific team with `--team`.

| Flag | Description | Default |
|------|-------------|---------|
| `--team <nameOrId>` | List themes for a specific team | personal |

JSON output: `{ themes: [{ id, name, isPublic, createdAt, updatedAt }] }`

### `get-theme` — Get a theme definition

```bash
magicpath-ai get-theme <themeId>
magicpath-ai get-theme <themeId> -o json
magicpath-ai get-theme "My Brand Theme" -o json    # lookup by name
magicpath-ai get-theme "Brand" --team "Acme Inc" -o json  # lookup in team
```

Fetches the full theme definition including CSS variables, fonts, and styling prompt. Accepts a numeric ID or a theme name (case-insensitive match). Use `--team` to look up themes within a specific team.

| Flag | Description | Default |
|------|-------------|---------|
| `--team <nameOrId>` | Look up theme within a specific team | personal |

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

Returns the component(s) currently selected in the MagicPath web app canvas, along with the project(s) the user has open. Returns empty `components` if the user has nothing selected, and empty `projects` if no canvas is open.

JSON output: `{ projects: [{ id, name, ownerType, ownerName }], components: [{ id, name, generatedName, clientId, projectId, projectName }] }`

Notes:
- `projects` is the same shape returned by `active-project` — calling `selection` gives you both signals in one round-trip.
- `components` may be empty while `projects` is non-empty (project open, nothing selected). Use that to decide whether to fall back to listing or searching components.
- If only the open project is needed (not the selection), prefer `active-project` — it is faster than `selection`.

### `active-project` — Get the project(s) the user currently has open

```bash
magicpath-ai active-project
magicpath-ai active-project -o json
```

Returns the project(s) the user currently has open in the MagicPath web app. Use this when you need the user's working project but no specific component has been selected. Returns an empty list if the user has no active canvas session.

JSON output: `{ projects: [{ id, name, ownerType, ownerName }] }`

Notes:
- Multiple projects can be returned if the user has multiple tabs open.
- `active-project` is the lighter of the two commands — it returns only the open project(s), while `selection` returns those *plus* any selected components and is more expensive. Prefer `selection` when the user references a component; use `active-project` when they only need the project.
- If a project is open but cannot be resolved against the user's accessible projects, the entry is returned with `name`, `ownerType`, and `ownerName` set to `null` and only the `id` populated.

### `code` — Create/edit canvas components from local code

The `code` subcommands let an external agent author or edit a MagicPath canvas component's source files locally, then submit them back to the platform. This is unrelated to `add`/`inspect`, which install reusable component source into an application.

All `code` subcommands operate against a working directory and persist state in `<dir>/magicpath-code.json` (written by `start`, `context`, and `create`; read by `submit`).

#### Editable file boundary

The `code` API only accepts full-file replacements for:

- `src/App.tsx`
- `src/index.css`
- `src/components/generated/**`

It does **not** accept dependency installation, `package.json` edits, `src/main.tsx`, Vite config changes, lockfile edits, raw patches, or arbitrary repo files.

#### `code start` — Create a pending component before writing code

```bash
magicpath-ai code start --project <projectId> --dir ./mp-new --name "Hero Card" -o json
```

Creates a component and pending revision on the canvas immediately, enables external-agent canvas presence (Liveblocks cursor), and **scaffolds the starting file structure** into `<dir>`:

- `magicpath-code.json` — manifest with component/revision IDs
- `src/App.tsx` — pre-wired slim entry file that imports and renders the top-level component from `src/components/generated/<ComponentName>`
- `src/components/generated/<ComponentName>.tsx` — stub named-export component ready to fill in

The component filename is derived from `--name` (PascalCase, e.g. `"Hero Card"` → `HeroCard`). JSON output includes `scaffoldedPaths` listing the files that were written.

Run this before generating files for a new canvas component — do not write files first and `create` after.

| Flag | Description | Default |
|------|-------------|---------|
| `--project <projectId>` | Target MagicPath project ID (required) | — |
| `--dir <dir>` | Working directory to initialize | `.` |
| `--name <name>` | Component name | `External Agent Component` |

#### `code context` — Checkout an existing component's editable files

```bash
magicpath-ai code context <componentId> --dir ./mp-work -o json
```

Writes `src/App.tsx`, `src/index.css`, `src/components/generated/**`, and `magicpath-code.json` into `<dir>`. Use this to edit an existing component.

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <dir>` | Working directory to write into | `.` |

#### `code submit` — Submit local edits

```bash
magicpath-ai code submit --dir ./mp-work --wait -o json
```

Reads `magicpath-code.json`, computes both the set of changed editable files and any files that were removed from `<dir>` since the last `context`/`start`/successful `submit`, and submits them together (changes as full-file replacements, removals as `deletedPaths`). Prints the resulting job/revision. Use `--wait` when the agent should fix build failures in the same turn.

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <dir>` | Working directory containing `magicpath-code.json` | `.` |
| `--wait` | Wait for the build job to finish | false |
| `--interval <ms>` | Polling interval when `--wait` is set | `2000` |

To delete a file, just remove it from `<dir>` before running `submit` — the deletion is inferred from the manifest baseline. Deletion propagation is active only in edit mode; in create mode, simply don't write the file. The JSON output includes `deletedPaths: [...]` listing what was removed.

If no editable files have changed and nothing has been deleted, returns `{ status: "unchanged", componentId, revisionId }` without submitting.

#### `code create` — Create a new component from already-written files (convenience)

```bash
magicpath-ai code create --project <projectId> --dir ./mp-new --name "Hero Card" --wait -o json
```

Convenience wrapper: internally runs `code start` and then uploads the files from `<dir>`. **Prefer explicit `code start` followed by `code submit`** — the split gives better canvas feedback (the pending component is visible while the agent is still writing code). `<dir>` must include `src/App.tsx`.

| Flag | Description | Default |
|------|-------------|---------|
| `--project <projectId>` | Target MagicPath project ID (required) | — |
| `--dir <dir>` | Working directory containing `src/App.tsx` | `.` |
| `--name <name>` | Component name | `External Agent Component` |
| `--wait` | Wait for the build job to finish | false |

#### `code status` — Poll an external-agent build job

```bash
magicpath-ai code status <jobId> -o json
```

Returns `pending`, `processing`, `completed`, `failed`, or `cancelled`. Failed jobs include sanitized build diagnostics when available.
