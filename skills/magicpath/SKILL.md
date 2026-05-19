---
name: magicpath
description: Search, preview, inspect, and install MagicPath UI components with the magicpath-ai CLI. Use when the user mentions MagicPath, wants to browse or search MagicPath components, preview one, or add one to their project. Also use when the user wants to create a new MagicPath project (workspace for designs/components), including projects inside a team. Also use when the user refers to "designs" — in MagicPath, designs are created and stored as components. Also use when the user mentions themes or theming — MagicPath themes (design systems) contain CSS variables, fonts, and styling instructions. Also use when the user asks about MagicPath teams, members, or who worked on something — MagicPath supports teams with shared projects, team members, and attribution tracking.
compatibility: Requires Node.js (for npx), network access to MagicPath, and browser access for login or preview flows.
metadata:
  author: MagicPathAI
  source: https://github.com/MagicPathAI/agent-skills
allowed-tools: Bash(npx -y magicpath-ai *)
user-invocable: true
---

# MagicPath

A platform for building, sharing, and installing UI components via AI. Components are added as source code to the user's project via the `magicpath-ai` CLI.

MagicPath canvas components can also be created and edited directly from local code via the `npx -y magicpath-ai code ...` subcommands — see [Edit or create canvas components from code](#edit-or-create-canvas-components-from-code). That path is strict: only `src/App.tsx`, `src/index.css`, files under `src/components/generated/`, and temporary image assets under `assets/` in the code working directory are editable.

> **Terminology:** Users often refer to MagicPath components as "designs" — the two terms are interchangeable. When a user says "design," "my designs," or "that design," treat it as meaning a MagicPath component. Search, inspect, and install accordingly.
>
> Users also refer to MagicPath design systems as "themes." When a user says "theme," "my themes," or "use the X theme," they mean a MagicPath design system — a set of CSS variables, fonts, and styling instructions. Use `list-themes` and `get-theme` to work with them.
>
> Users may belong to **teams** (also called "workspaces"). When a user says "the team's designs," "our team's components," or mentions a team name like "Acme Inc," they mean the projects and components owned by that team. Use `list-teams`, `--team`, and `--personal` flags to navigate between personal and team workspaces.

## First Step

Run `npx -y magicpath-ai info -o json` to check auth status and project context. The first invocation may take a few seconds as `npx` downloads the package; subsequent calls are fast.

- If `auth.authenticated` is false, run `npx -y magicpath-ai login`, wait for browser auth to finish, then verify with `npx -y magicpath-ai whoami -o json`.

## Working with Teams

Users may belong to teams that own shared projects and themes. By default, `list-projects` and `search` return results from **all** workspaces (personal + every team the user belongs to). Use filtering flags to narrow scope.

### Discovering Teams

Run `npx -y magicpath-ai list-teams -o json` to see the user's teams:
```json
{ "teams": [{ "id": "123", "name": "Acme Inc", "role": "ADMIN" }] }
```

### Filtering by Team

- **Default (no flag)**: `list-projects`, `search` include both personal and all team projects — no extra flags needed for broad discovery.
- **`--team "Acme Inc"` or `--team <teamId>`**: Filter to a specific team. Works on `list-projects`, `search`, `list-themes`, and `get-theme`.
- **`--personal`**: Show only the user's personal projects/components. Works on `list-projects` and `search`.

### JSON Output

Projects and search results include `ownerType` (`"personal"` or `"team"`) and `ownerName` (user email or team name). Use these to tell the user where a component lives.

### Discovering People

Run `npx -y magicpath-ai list-members --team "Acme Inc" -o json` to see who's on a team:
```json
{ "team": { "id": "123", "name": "Acme Inc" }, "members": [{ "id": "456", "displayName": "Chloe Smith", "email": "chloe@acme.com", "role": "MEMBER" }] }
```

### Filtering by Person

- **`--created-by <userId>`** on `list-components`: Filter to components that a specific user has created or edited. Use this after resolving a person's name to their user ID via `list-members`.
- **`createdBy`** field on projects: Each project in `list-projects` includes `createdBy: { id, displayName }` showing who created it.
- **`lastEditedBy`** field on components: Each component in `list-components` includes `lastEditedBy: { id, displayName }` showing who last edited it.

**Important:** You can only see projects that the authenticated user has access to — your own personal projects and team projects you're a member of. You **cannot** access another user's personal projects. When looking for another person's work, only search **team projects** (`--team`), not personal projects. Personal projects are private to their owner unless someone is explicitly invited as a member.

### Common Patterns

- **"What was Chloe working on last?"** → `list-members --team "Acme Inc" -o json` to find Chloe's user ID → `list-projects --team "Acme Inc" -o json` to get **team projects only** → `list-components <projectId> --created-by <chloeId> --sort-by createdAt --order desc -o json` for each project. Report the most recent components. **Do not search personal projects for another user's work** — personal projects are private to their owner.
- **"Show me the team's designs"** or **"what has Acme Inc created?"** → `list-teams` to find the team, then `list-projects --team "Acme Inc" -o json`, then `list-components <projectId> -o json`.
- **"Show me the latest design from the team"** → same as above, but use `--sort-by createdAt --order desc --limit 1` on `list-components`.
- **"Who created this project/component?"** → check the `createdBy` field on projects or the `lastEditedBy` field on components from their respective list commands.
- **"My designs"** without mentioning a team → the default (all projects) is usually correct. Only use `--personal` if they explicitly want to exclude team projects.
- **"Use the team's theme"** → `list-themes --team "Acme Inc" -o json`, then `get-theme <name> --team "Acme Inc" -o json`.

## Workflow

> **Always use `-o json`** for all data-returning commands (`search`, `list-projects`, `list-components`, `list-teams`, `list-themes`, `get-theme`, `selection`, `active-project`, `info`, `add`, `inspect`, `code`). This gives you structured output to work with instead of human-readable tables.

### Phase 1: Discover

1. **Check auth** — run `npx -y magicpath-ai whoami -o json` to verify authentication.
2. **Check current selection** — if the user references "the selected component," "the selected image," "the design I have selected," or otherwise points at a *specific canvas selection*, run `npx -y magicpath-ai selection -o json`. If it returns components, use them directly — skip the search/confirm flow and proceed with the returned `generatedName`(s). Each returned component also includes `selectedRevisionId`, the revision currently shown for that component on the canvas. The response can also include selected `images`; when you subsequently run `code start`, those selected images are made available under `assets/selected/**` as described below. When a downstream command accepts a revision (such as `code context --revision`), pass this value through so the operation targets the version the user is looking at rather than whichever revision happens to be canonical in the database.
3. **Check the active project** — if the user references "the project I have open," "this project," "what I'm working on," or otherwise implies a working project context without naming a specific component, run `npx -y magicpath-ai active-project -o json`. It returns the project(s) the user currently has open in their browser, even when nothing is selected. If it returns one project, treat it as the working project and skip the project picker. If it returns multiple, list them and ask which one. If it returns an empty list, the user has no canvas open — reach for `list-projects` and ask the user. Pick the right command for what the user said: `selection` for a referenced component, `active-project` for a referenced project, `list-projects` + ask if neither. (Note that `selection` also returns the active projects in its output, so when the user references a component you already get the project for free — no separate `active-project` call needed.)
4. **Find components** — use `npx -y magicpath-ai search <query> -o json` to search across all projects, or `list-projects -o json` then `list-components <projectId> -o json` to browse. If `active-project` already gave you a project, scope your search to it via `list-components <projectId> -o json` instead of searching every workspace.
5. **Understand components visually** — `search` and `list-components` results include a `previewImageUrl` field. Download and analyze these images to understand what each component looks like before recommending it. Preview images are for your own understanding — use the `view` command when the user needs to see a component.
6. **Confirm with the user (STOP and wait)** — unless the user specified an exact generatedName, tell the user what you found (name, generatedName, project), open a browser preview with `npx -y magicpath-ai view <generatedName>`, and ask if it's the right component. If multiple matches, list them all and ask which one. **This is a STOP point — end your response here and wait for the user to reply. Do NOT proceed until the user explicitly confirms.** Do not run `add` or `inspect` yet.

### Phase 2: Understand the Target Context

> **This phase is critical.** Before installing anything, you MUST understand where the component is going and what it needs to do there. Skipping this leads to components that look right but behave wrong.

7. **Inspect the MagicPath component source** — use `npx -y magicpath-ai inspect <generatedName> -o json` to read the source code. Identify what it renders, what props it expects, and what assumptions it makes about layout (fixed widths, absolute positioning, etc.).
8. **Read the target codebase context** — before installing, read the file(s) where the component will live. Understand:
   - **Existing functionality**: If replacing a component, what does the current one do? What callbacks, state, API calls, navigation, validation, or side effects does it handle? Every piece of existing behavior must be preserved or consciously addressed.
   - **Layout context**: What is the parent layout? Is it a flex/grid container? What are the responsive breakpoints? How does spacing work? A component that looks perfect in isolation can break a layout if its sizing assumptions don't match.
   - **Data flow**: What props, context, or state does the surrounding code provide? What does it expect back (callbacks, form data, events)?
   - **Design system**: What styling patterns does the project use (Tailwind, CSS modules, theme tokens)? The MagicPath component's styles need to harmonize, not clash.

### Applying a Theme (if applicable)

If the user has a theme they want applied, or references a brand/design system by name:

1. **List available themes** — run `npx -y magicpath-ai list-themes -o json` to see all themes.
2. **Get the theme definition** — run `npx -y magicpath-ai get-theme <id-or-name> -o json` to fetch the full definition.
3. **Read the `prompt` field** — if present, this contains natural-language styling instructions from the designer (e.g., "use rounded corners, prefer shadows over borders, use the brand blue for CTAs"). Follow these instructions when adapting components.
4. **Apply CSS variables** — the theme's `light` and `dark` objects map CSS variable names to values (e.g., `--background: #ffffff`, `--primary: #3b82f6`). When adapting MagicPath components, use these CSS variables instead of hardcoded colors: `bg-[var(--background)]`, `text-[var(--primary)]`, etc. Ensure the component respects `defaultTheme` (light or dark).
5. **Handle fonts** — if the theme includes `fonts`, ensure the project loads these fonts (Google Fonts link or `@font-face` declarations for custom fonts) and that components reference them via the theme's font CSS variables (e.g., `font-family: var(--font-body)`).
6. **Non-React/JS projects** — theme data is a reference, not a stylesheet. Translate CSS variables into the target platform's equivalent: SwiftUI `Color` assets, Android theme XML, Python template context, etc. The `prompt` field and color/font values express platform-agnostic design intent — map them to native patterns rather than using CSS directly.

### Create or Edit Canvas Components From Code

Use this flow only when the user wants to author a MagicPath canvas component directly:

```bash
npx -y magicpath-ai code start --project <projectId> --dir . --name "Component Name" -o json
npx -y magicpath-ai code start --component <componentId> --dir . -o json
npx -y magicpath-ai code context <componentId> --dir . -o json  # read-only
npx -y magicpath-ai code submit --dir . --wait -o json
```

`code start` is the only command that begins a stateful coding session. Use `--project` to create a new component, or `--component` to edit an existing one. It writes editable files, creates or reuses a pending revision on the canvas, and shows agent presence.

`code context` is read-only. Use it only to inspect existing component source; it must not be used as the submit path.

Edit only these surfaces: `src/App.tsx`, `src/index.css`, `src/components/generated/**`, and temporary image assets under `assets/**`.

`src/App.tsx` is pre-wired to render the generated component. Only edit it to change theme or top-level container values.

If image shapes are selected on the canvas when you run `code start`, the JSON response may include `selectedImages`. The CLI downloads those short-lived image URLs into `assets/selected/**`. Use the local `assetPath` from the response in TSX/CSS, and never paste the temporary `accessUrl` into component source because it expires.

#### Tailwind v4 Rules

The MagicPath template uses Tailwind v4. Style this way:

- `src/index.css` must contain `@import 'tailwindcss';`, not `@tailwind base;`, `@tailwind components;`, or `@tailwind utilities;`.
- Theme tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) are wired via the `@theme inline { ... }` block in `index.css`. Do not remove it.
- The `:root` and `.dark` blocks define the actual token values. Do not remove them.
- To add custom utility classes, append them to `index.css` instead of replacing existing content.
- There is no `tailwind.config.js`. Configuration lives in `index.css` via Tailwind v4's `@theme` directive.

### Phase 3: Install and Adapt

9. **Add to project** — use `npx -y magicpath-ai add <generatedName> -y` to install component files. Always pass `-y` in non-interactive contexts. If this is a **non-React project** (Swift, Python, etc.), **do not run `add`** — use `npx -y magicpath-ai inspect <generatedName> -o json` to read the source as a reference, then recreate the component in the target language and framework.
10. **Adapt the component for production use** — MagicPath components are design artifacts: they capture visual intent and structure, but they are often not production-ready out of the box. After adding, you MUST edit the component files to:
   - **Make it responsive**: Replace any hardcoded widths/heights (e.g., `w-[300px]`) with responsive utilities (`w-full max-w-sm`, responsive breakpoints like `md:w-64 lg:w-80`). A design may show a single viewport — your job is to make it work across all viewports.
   - **Add real interactivity**: Replace static/placeholder content with actual props, state, and event handlers. A MagicPath button that says "Submit" needs an `onClick` prop and loading state. A form needs validation and `onSubmit`.
   - **Wire up data flow**: Connect the component to the app's actual data — props from parents, context providers, API calls, router state. Don't leave mock data in place.
   - **Preserve existing functionality**: When replacing an existing component, audit every feature the old one provided (form submission, error handling, loading states, accessibility, keyboard navigation, analytics events) and ensure the new component handles all of them.
   - **Match the project's patterns**: Use the same state management, error handling, and styling approaches as the rest of the codebase.

### Phase 4: Integrate into the Page

11. **Import and render** — import the component using the `importStatement` from the add output. Pass the props you've defined.
12. **Verify layout fit** — after placing the component, review the parent layout to ensure it integrates cleanly. Check that the component doesn't overflow, create unexpected gaps, or break the responsive flow of the page.

## Design-to-Production Mindset

**MagicPath is a design tool.** Components from MagicPath represent what something should look like and how it should be structured — they are the design spec expressed as code. But a design comp and a production component are different things:

| Design artifact | Your job as the agent |
|---|---|
| Fixed width `w-[400px]` | Make it responsive: `w-full max-w-md` or breakpoint-based |
| Static text "John Doe" | Replace with dynamic prop: `{user.name}` |
| Placeholder `onClick={() => {}}` | Wire to real handler: `onClick={handleSubmit}` |
| Hardcoded list of 3 items | Map over real data: `{items.map(…)}` |
| No error/loading states | Add loading spinners, error boundaries, empty states |
| No accessibility attributes | Add `aria-label`, `role`, keyboard handlers, focus management |
| Desktop-only layout | Add responsive breakpoints, mobile navigation patterns |
| Decorative images with `src="/photo.jpg"` | Use real assets or proper placeholders from the project |

**The golden rule: a MagicPath component tells you WHAT to build. Your job is to make it WORK — responsively, accessibly, and fully wired into the application.**

### Common Scenarios

**Replacing an existing component** (e.g., swapping an old login form for a MagicPath design):
1. Read the old component thoroughly — list every prop, callback, validation rule, and side effect
2. Inspect the MagicPath component source with `npx -y magicpath-ai inspect <generatedName> -o json`
3. Install the MagicPath component with `npx -y magicpath-ai add <generatedName> -y`
4. Edit the MagicPath component to accept all the same props/callbacks
5. Ensure every feature from the old component exists in the new one
6. Swap the import in the parent — the parent code should barely change

**Building a new page from a MagicPath design library**:
1. Browse the project's components with `list-components`
2. Plan the page layout first — identify which MagicPath components map to which sections
3. Install needed components one at a time with `npx -y magicpath-ai add <generatedName> -y`
4. Build the page layout, importing each component
5. Adapt each component: responsive sizing, real data, proper routing, state management
6. Ensure consistent spacing, typography, and color usage across all components

**Using a single MagicPath component as inspiration**:
1. Inspect the source with `npx -y magicpath-ai inspect <generatedName> -o json`
2. Understand the design intent — colors, spacing, layout structure, typography
3. Install and adapt it, or use it as a reference to build something custom that follows the same design language

## Critical Rules

- **`add` means install-to-use.** Only run `add` when you intend to import and render the installed component. If you just want to read the source code, use `inspect` instead.
- **After `add`, always import the component.** The whole point of `add` is to get source files you then import. Never add a component and then copy its styles/markup into another file — import and render the component directly.
- **MagicPath components are source code you own.** After `add`, the component files live in your project at `src/components/magicpath/<name>/`. You can and should edit them directly to add props, change behavior, adjust styles, or integrate with your app's state.
- **When a component needs integration:** (1) `add` the component, (2) edit the component file to accept the props you need (e.g., `onSubmit`, `placeholder`, `className`), (3) import it from the parent and pass those props. Do NOT copy the component's JSX/styles into the parent file.
- **Never just drop a component in.** Always read the surrounding code, understand the layout constraints, and adapt the component to fit. A MagicPath component placed without adaptation is a bug, not a feature.
- **`inspect` is read-only.** Shows full source code without writing any files. Use this when deciding whether a component fits your needs before committing to install.
- **`add` is for React/TypeScript projects only.** The `add` command writes `.tsx` files to `src/components/magicpath/` and installs npm dependencies. Only use `add` in JavaScript/TypeScript projects. For non-JS projects (Swift, Python, etc.), use `inspect` to read the component source, then translate the design and behavior into the project's language and framework.
- **Never run `view` commands in parallel.** The `view` command opens a browser window for the user. Only open one preview at a time.

## Creating a project

A **project** is the workspace that holds designs/components. Use this when the user explicitly asks to create a project ("make a new project called …", "create a project for …"), or when they ask for a new design but no project context exists yet and a fresh project is the right home for it.

### Picking the workspace

Before creating, decide whether the project is **personal** or belongs to a **team**:

- If the user names a team ("create a project in Acme Inc"), resolve that team and pass it through.
- If the user says "create a personal project" or doesn't mention a team and has no teams, default to personal.
- If the user is ambiguous and belongs to one or more teams, run `npx -y magicpath-ai list-teams -o json` and ask which workspace — personal or one of the teams. Don't guess. **STOP and wait for the user to reply.**

### Running the command

```bash
npx -y magicpath-ai create-project --name "My Stuff" -o json                       # personal
npx -y magicpath-ai create-project --name "My Stuff" --team "Acme Inc" -o json     # team
```

- `--name` is optional. If omitted, the project gets an auto-generated placeholder name. Always pass `--name` when the user told you what to call the project.
- `--team` accepts a team name or team ID. Resolve the user's intent to one of the teams returned by `list-teams`.
- JSON output: `{ project: { id, name, ownerType, ownerName, ... } }`. The `id` is what subsequent commands need.

### After the project exists

If the user also asked for a design inside the new project, take the `id` from the response and continue with the existing canvas-component creation flow described in the next section (`code start --project <id> --name "..."`, fill in the scaffolded files, `code submit --wait`). Do not re-create the project per design — one project holds many components.

## Edit or create canvas components from code

Use this workflow when the user wants you to author or modify a MagicPath canvas component itself — not install an existing component into a separate application. The `code` subcommands operate on a working directory and a small manifest file (`magicpath-code.json`) that tracks which component and revision the directory belongs to.

**Editable file boundary.** The `code` API only accepts full-file replacements for:

- `src/App.tsx`
- `src/index.css`
- `src/components/generated/**`
- `assets/**` for temporary image assets only

Never edit or submit `package.json`, `vite.config.*`, `src/main.tsx`, lockfiles, or any other file — they will be rejected.

**Image assets.** Put local image files in `<workdir>/assets/` and reference them from code or CSS, for example `../../../assets/hero.png`, `/assets/hero.png`, or `url("../../assets/hero.png")`. MagicPath uploads these temporary assets, rewrites references to stable public asset URLs, and removes the `assets/` staging folder before build. Do not inline `data:image/...;base64,...`; if you encounter base64 image data, move it into an asset file instead.

**Selected canvas images.** When the user has selected image shapes on the canvas before `code start`, the CLI includes them in `selectedImages` and downloads each one into `assets/selected/**` using a short-lived access URL. Use the downloaded `assetPath` in imports or CSS. Do not use `accessUrl` directly because it expires.

**Deleting and renaming source files is supported in edit mode.** To delete an editable source file, just remove it from `<workdir>` — `code submit` detects the deletion and propagates it. A rename is a delete + a write in the same submit. Assets are temporary staging inputs and are not deleted from the server by removing local files. In create mode, there's nothing to delete; just don't write the file.

**Do not use `add` or `inspect` for this workflow.** `add`/`inspect` are for installing reusable registry components into another app. `code ...` is for editing components on the user's MagicPath canvas — they are separate flows and must not be mixed.

### Edit an existing component

1. Run `npx -y magicpath-ai code start --component <componentId> --dir <workdir> -o json`. This creates or reuses a pending edit revision, shows agent presence on the canvas, writes the editable files, and writes `magicpath-code.json` into `<workdir>`. By default, the CLI starts from the component's currently selected revision. To start from a specific revision instead, pass `--revision <revisionId>` — useful when the user is viewing or referring to a non-current revision (e.g. a value carried through from `npx -y magicpath-ai selection`).
2. Edit, add, or delete allowed files inside `<workdir>` (see the boundary above). Put any new images under `<workdir>/assets/` and reference them from the generated component or CSS. When you remove the last usage of a sub-component file, delete its source file too — don't leave orphan files in the revision. Renames are delete-plus-write.
3. Run `npx -y magicpath-ai code submit --dir <workdir> --wait -o json`. If your edit changes the intended canvas size, pass both `--width <px>` and `--height <px>` on submit.
4. If the job result is `failed`, read the returned sanitized diagnostics, fix only allowed files, and submit again. Do not create a new component to work around a build failure.
5. If the submission reports a conflict or stale base, run `npx -y magicpath-ai code start --component <componentId> --dir <workdir> -o json` again to refresh the stateful edit session before re-applying your edits.

### Create a new component

**Important experiential rule:** always run `code start` *before* writing component files. This registers the pending component on the canvas so the user sees your work-in-progress presence, not a silent agent.

**Expected file structure.** A MagicPath component has a slim `src/App.tsx` that imports and renders a top-level component from `src/components/generated/`. The actual implementation lives in `src/components/generated/<ComponentName>.tsx` (PascalCase filename, named export). Larger components should be split into additional sibling files under `src/components/generated/`, each importing what it needs. This is how every existing MagicPath component is structured — compare against what `code context` returns for any existing component.

**The CLI scaffolds this structure for you on `code start`.** After `code start` returns, the working directory already contains a pre-wired `src/App.tsx` and a stub `src/components/generated/<ComponentName>.tsx`. The component filename matches the PascalCase form of `--name` (e.g. `--name "Hero Card"` → `HeroCard.tsx`). Your job is to fill in the stub — **do not rewrite `App.tsx`**, it's already correct. The only reasons to edit `App.tsx` are to change the `theme` (`'light'`/`'dark'`) or `container` (`'centered'`/`'none'`) values at the top.

Steps:
1. Run `npx -y magicpath-ai code start --project <projectId> --dir <workdir> --name "Component Name" --width <px> --height <px> -o json`. Choose dimensions that fit the component you plan to build instead of relying on the default canvas size. Creates the pending component, scaffolds the slim `App.tsx` + stub, and writes `magicpath-code.json`.
2. Fill in `<workdir>/src/components/generated/<ComponentName>.tsx` with the component implementation. Split into additional files in the same directory if the component is substantial.
3. Optionally edit `<workdir>/src/index.css` for custom styles. Put image files in `<workdir>/assets/` and reference them from TSX or CSS instead of embedding base64.
4. Run `npx -y magicpath-ai code submit --dir <workdir> --wait -o json`. If the final implementation needs a different canvas size than you chose at start, pass both `--width <px>` and `--height <px>` here.
5. If the build fails, fix the component files and re-run `code submit --wait`. Do not start a second component unless the user explicitly asks.

> The `code create` command is a convenience that combines `start` and `submit` in one call. Prefer the explicit two-step flow — it makes your progress visible on the canvas while files are still being written, and it gives you the scaffolded starting point to work from.

### Polling a job separately

If you need to check job status after the fact (for example, after submitting without `--wait`), use `npx -y magicpath-ai code status <jobId> -o json`. It returns one of `pending`, `processing`, `completed`, `failed`, or `cancelled`.

## Quick Reference

```bash
# Auth
npx -y magicpath-ai login                    # one-click browser login
npx -y magicpath-ai whoami -o json           # check auth status
npx -y magicpath-ai info -o json             # full project context

# Teams and people
npx -y magicpath-ai list-teams -o json                  # list teams you belong to
npx -y magicpath-ai list-members --team "Acme" -o json  # list members of a team

# Create a new project
npx -y magicpath-ai create-project --name "My Stuff" -o json                    # personal
npx -y magicpath-ai create-project --name "My Stuff" --team "Acme" -o json      # team

# Find components (always use -o json)
npx -y magicpath-ai search "input box" -o json          # search across all workspaces
npx -y magicpath-ai search "button" --team "Acme" -o json   # search within a team
npx -y magicpath-ai list-projects -o json               # list all projects (personal + team)
npx -y magicpath-ai list-projects --team "Acme" -o json     # list only team projects
npx -y magicpath-ai list-projects --personal -o json        # list only personal projects
npx -y magicpath-ai list-components <id> -o json      # list components in a project
npx -y magicpath-ai list-components <id> --created-by <userId> -o json  # filter by person

# Inspect components
npx -y magicpath-ai view <generatedName>              # preview in browser
npx -y magicpath-ai share <generatedName> -o json     # print a shareable URL for a component (no browser open)
npx -y magicpath-ai inspect <generatedName> -o json   # show source code (no install)
npx -y magicpath-ai add <generatedName> --dry-run     # show what would be installed

# Install and use components
npx -y magicpath-ai add <generatedName> -y         # add to project (no prompts)

# Themes (design systems)
npx -y magicpath-ai list-themes -o json                 # list personal themes
npx -y magicpath-ai list-themes --team "Acme" -o json   # list team themes
npx -y magicpath-ai get-theme <id-or-name> -o json    # get theme CSS vars, fonts, prompt

# Current canvas context
npx -y magicpath-ai selection -o json                 # get currently selected component(s)
npx -y magicpath-ai active-project -o json            # get the project(s) the user has open

# Author/edit canvas components from code (external-agent)
npx -y magicpath-ai code start --project <projectId> --dir <workdir> --name "Name" --width <px> --height <px> -o json # start a new pending component with chosen canvas size
npx -y magicpath-ai code start --component <componentId> --dir <workdir> -o json                 # start editing an existing component
npx -y magicpath-ai code start --component <componentId> --revision <revisionId> --dir <workdir> -o json # start editing a specific revision
npx -y magicpath-ai code context <componentId> --dir <workdir> -o json                           # read-only source fetch; not for submit
npx -y magicpath-ai code submit --dir <workdir> --width <px> --height <px> --wait -o json         # submit edits/size + wait for build
npx -y magicpath-ai code status <jobId> -o json                                                  # poll a build job
```

## Key Concepts

- Each component has a **generatedName** (e.g., `wispy-river-5234`) — this is the identifier for all operations
- Components are added as source code to `src/components/magicpath/<name>/`
- The `add` command returns `importStatement` and `usage` — use these in code
- Use `inspect` to inspect source code without installing — don't use `add` just to read code
- MagicPath components are React/TypeScript source code — use `add` in JS/TS projects, use `inspect` + translate for other languages
- **Themes** (design systems) contain CSS variables (`light`/`dark` maps), optional `fonts`, and an optional `prompt` with styling instructions for agents. "Theme" and "design system" are interchangeable. Use `list-themes` to browse, `get-theme` to fetch the full definition
- The `code` subcommands are for canvas-component source workflows, not app installation. Use `code start` + `code submit` to publish edits back to the MagicPath canvas; `code context` is read-only inspection. They are unrelated to `add`/`inspect`, which install reusable component source into an app.

## Current Project Context

```json
!`npx -y magicpath-ai info -o json 2>/dev/null || echo '{"error": "Could not run magicpath-ai via npx. Ensure Node.js is installed and the registry is reachable."}'`
```

The JSON above contains auth status, projects, and CLI version. If auth.authenticated is false, the user needs to log in before any other operations.

## References

- [CLI Reference](references/cli-reference.md)