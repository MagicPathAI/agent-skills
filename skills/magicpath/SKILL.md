---
name: magicpath
description: Work with MagicPath (a design-to-code canvas) through the magicpath-ai CLI. Find, preview, and install UI components ("designs") into apps; author or edit interactive designs on the canvas from code; import UI from existing repos; manage projects, themes (design systems), revisions, canvas images, and team workspaces. Trigger on any mention of MagicPath, designs, themes, or canvas work.
compatibility: Requires Node.js (for npx), network access to MagicPath, and browser access for login or preview flows.
metadata:
  author: MagicPathAI
  source: https://github.com/MagicPathAI/agent-skills
allowed-tools: Bash(npx -y magicpath-ai@experimental *)
user-invocable: true
---

# MagicPath

MagicPath is a visual canvas where designs are React components. The `magicpath-ai` CLI is built for agents: every command returns a JSON envelope (`{ok, data, meta}` on stdout; `{ok: false, error: {code, message, suggestion}}` on stderr), prompts are skipped automatically, and no command opens a browser on its own. You never need `-o json` or `-y`. On errors, read `error.suggestion` — it states the recovery step.

> **Terminology:** users say **"design"** for a MagicPath component, **"theme"** for a design system, and **"team"** or **"workspace"** for an organization. Each component has a **generatedName** (e.g. `wispy-river-5234`) — the identifier used by most commands.

## First step

Run `npx -y magicpath-ai@experimental context` — one call returns auth status, the user, their teams, the project(s) open on their canvas, and any components/images they have selected. The first `npx` invocation may take a few seconds to download the package.

- If `auth.authenticated` is false, ask the user to run `npx -y magicpath-ai@experimental auth login` in their terminal, then re-check with `context`.
- If the user referenced "the selected design" or "this project", the answer is already in `context`'s `selection` / `activeProjects` — don't search for it.

## Picking the workflow

| The user wants to… | Do this |
|---|---|
| Install a MagicPath design into their app and adapt it | Read [Install flow](references/install-flow.md) — `search`/`component list` → `inspect` → confirm → `install` → adapt |
| Create or edit a design on the MagicPath canvas | Read [Canvas authoring](references/canvas-authoring.md) — `code start` → edit files → `code submit` |
| Bring UI from an existing repo onto the canvas | Read [Working with repositories](references/working-with-repositories.md) |
| Know who made what / team activity / people | Read [Teams and people](references/teams-and-people.md) |
| Work in a host with an embedded browser (Codex, Cursor) | Read [Working with embedded browsers](references/working-with-embedded-browsers.md) |
| See what's on a project canvas | `npx -y magicpath-ai@experimental project canvas <projectId>` — every design and image with positions and `previewImageUrl`s |
| Exact flags for any command | [CLI reference](references/cli-reference.md) or `npx -y magicpath-ai@experimental <command> --help` |

## Critical rules

1. **Verify visually.** After every `code submit` and `component select-revision`, the result includes a `previewImageUrl`. Download and look at it before declaring success. Preview images are for your own understanding — don't navigate browsers to them.
2. **Rollback recipe.** When the user rejects a revision ("go back and try again"): `component revisions <id>` → `component select-revision <id> --revision <previousRevisionId>` (the canvas visibly reverts immediately) → `code start --component <id> --revision <thatRevisionId>` → fix → `code submit`. Full detail in [Canvas authoring](references/canvas-authoring.md).
3. **`install` means install-to-use.** Only run it when you intend to import and render the component. To read source, use `inspect`. After `install`, always import the component — never copy its JSX into another file. Installed files live in `src/components/magicpath/<name>/` and are yours to edit.
4. **`install` is for React/TypeScript projects only.** For other stacks (Swift, Python, …), `inspect` the source and recreate it in the target language.
5. **Confirm before installing.** Unless the user gave an exact generatedName, present what you found (name, generatedName, project, preview) and **stop and wait** for confirmation before `install`.
6. **Two directions, never mixed.** `install`/`inspect` pull MagicPath designs into an app. `code start`/`code submit` author designs on the canvas. `code read` is read-only canvas source — never a path to submit.
7. **Canvas file boundary.** In `code` working directories, only `src/App.tsx`, `src/index.css`, `src/components/generated/**`, and `assets/**` are editable. Never touch `package.json`, `vite.config.*`, `src/main.tsx`, or lockfiles.
8. **Browsers are explicit.** `open <target>` returns a URL without opening anything when an agent runs it; pass `--browser` only when the user asked to open their browser. Never open more than one target at a time.
9. **Privacy.** You can only see the user's own projects and team projects they belong to. Another person's work lives only in **team** projects — never report personal projects as someone else's.
10. **Workspaces.** `search` and `project list` cover personal + all teams by default; scope with `--team <nameOrId>` or `--personal` when the user names a workspace.
11. **Destructive commands** (`project delete`, `component delete`, `image delete`, `theme delete`) are permanent — confirm with the user first unless they explicitly asked for the deletion.

## Command map

- `context` — auth, user, teams, open canvas projects, current selection (start here)
- `auth login | logout | status` — authentication
- `project list | get | create | rename | delete | duplicate | move | canvas | share-link` — projects (a project holds many designs)
- `component …` (alias `design`) `list | get | rename | delete | duplicate | copy-to | revisions | select-revision | screenshot` — designs and their version history
- `theme list | get | create | update | delete` — design systems (CSS variables, fonts, styling prompt)
- `team list | members` — workspaces and people (read-only)
- `image add | list | delete | duplicate | url` — images on a project canvas
- `search <query>` — find designs by name across all accessible projects
- `code start | read | submit | status` — author/edit canvas designs from local code
- `install <generatedName>` / `inspect <generatedName>` / `installed` — bring designs into the user's app
- `open <target>` — resolve a project/design URL (or open the user's browser with `--browser`)

Paginated commands accept `--limit` and `--cursor`; follow `meta.page.nextCursor` until `hasMore` is false.

## References

- [Install flow](references/install-flow.md) — discover, confirm, install, and adapt designs into production code
- [Canvas authoring](references/canvas-authoring.md) — the `code` flow, Design Defaults, revision rollback, visual verification
- [Working with repositories](references/working-with-repositories.md) — recreate UI from a local or online repo on the canvas
- [Teams and people](references/teams-and-people.md) — workspace navigation, attribution, privacy
- [Working with embedded browsers](references/working-with-embedded-browsers.md) — keep a project canvas open beside the agent
- [CLI reference](references/cli-reference.md) — generated command documentation
