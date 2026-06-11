# Teams and People — Workspaces, Attribution, Privacy

Users may belong to teams (also called workspaces) that own shared projects and themes. By default, `search` and `project list` return results from **all** workspaces — personal plus every team. Narrow with flags when the user names a workspace.

## Discovering teams and people

```bash
npx -y magicpath-ai@experimental team list                 # {teams: [{id, name, role}]}
npx -y magicpath-ai@experimental team members "Acme Inc"   # {team, members: [{id, displayName, email, role}]}
```

`context` also returns the user's teams — if you just ran it, don't run `team list` again.

## Scoping flags

- **No flag (default)**: personal + all team workspaces. Usually correct for "my designs".
- **`--team <nameOrId>`**: a specific team. Works on `search`, `project list`, `theme list`, `theme get`.
- **`--personal`**: only personal projects. Use only when the user explicitly excludes team work.

Projects and search results include `ownerType` (`"personal"` | `"team"`) and `ownerName` — use these to tell the user where something lives.

## Attribution fields

- `project list` items include `createdBy: {id, displayName}`.
- `component list <projectId>` items include `lastEditedBy: {id, displayName}`.
- `component list <projectId> --created-by <userId>` filters to one person's components — resolve names to user IDs via `team members` first.

## Privacy (hard rule)

You can only access the authenticated user's own personal projects and the team projects they belong to. **You cannot see another user's personal projects.** When asked about a colleague's work, search **team projects only** (`--team`) — never imply someone's personal projects were searched or are visible.

## Common patterns

- **"What was Chloe working on last?"** → `team members "Acme Inc"` to get Chloe's user id → `project list --team "Acme Inc"` → for each project, `component list <projectId> --created-by <chloeId> --sort-by createdAt --order desc --limit 5`. Report the most recent components (with preview images if helpful).
- **"Show me the team's designs"** → `project list --team "Acme Inc"` → `component list <projectId>`.
- **"The latest design from the team"** → same, with `--sort-by createdAt --order desc --limit 1`.
- **"Who created this project / design?"** → `createdBy` on the project, `lastEditedBy` on the component.
- **"Use the team's theme"** → `theme list --team "Acme Inc"` → `theme get <name> --team "Acme Inc"`.
- **Creating into a workspace** → `project create --name "…" --team "Acme Inc"`; if the user is ambiguous and belongs to teams, list the options and **stop and wait** — don't guess the workspace.
- **Moving a project to a team** → `project move <id> --team "Acme Inc"` (personal → team only; moving back to personal isn't supported).
