---
name: magicpath
description: Search, preview, inspect, and install MagicPath UI components with the magicpath-ai CLI. Use when the user mentions MagicPath, wants to browse or search MagicPath components, preview one, or add one to their project. Also use when the user refers to "designs" — in MagicPath, designs are created and stored as components. Also use when the user mentions themes or theming — MagicPath themes (design systems) contain CSS variables, fonts, and styling instructions. Also use when the user asks about MagicPath teams, members, or who worked on something — MagicPath supports teams with shared projects, team members, and attribution tracking.
compatibility: Requires the magicpath-ai CLI on PATH, network access to MagicPath, and browser access for login or preview flows.
metadata:
  author: MagicPathAI
  source: https://github.com/MagicPathAI/agent-skills
allowed-tools: Bash(magicpath-ai *)
user-invocable: true
---

# MagicPath

A platform for building, sharing, and installing UI components via AI. Components are added as source code to the user's project via the `magicpath-ai` CLI.

> **Terminology:** Users often refer to MagicPath components as "designs" — the two terms are interchangeable. When a user says "design," "my designs," or "that design," treat it as meaning a MagicPath component. Search, inspect, and install accordingly.
>
> Users also refer to MagicPath design systems as "themes." When a user says "theme," "my themes," or "use the X theme," they mean a MagicPath design system — a set of CSS variables, fonts, and styling instructions. Use `list-themes` and `get-theme` to work with them.
>
> Users may belong to **teams** (also called "workspaces"). When a user says "the team's designs," "our team's components," or mentions a team name like "Acme Inc," they mean the projects and components owned by that team. Use `list-teams`, `--team`, and `--personal` flags to navigate between personal and team workspaces.

## First Step

Run `magicpath-ai info -o json` to check auth status, project context, and CLI availability.

- If the CLI is missing, invoke it with `npx magicpath-ai`.
- If `auth.authenticated` is false, run `magicpath-ai login`, wait for browser auth to finish, then verify with `magicpath-ai whoami -o json`.

## Working with Teams

Users may belong to teams that own shared projects and themes. By default, `list-projects` and `search` return results from **all** workspaces (personal + every team the user belongs to). Use filtering flags to narrow scope.

### Discovering Teams

Run `magicpath-ai list-teams -o json` to see the user's teams:
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

Run `magicpath-ai list-members --team "Acme Inc" -o json` to see who's on a team:
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

> **Always use `-o json`** for all data-returning commands (`search`, `list-projects`, `list-components`, `list-teams`, `list-themes`, `get-theme`, `selection`, `info`, `add`, `inspect`, `code context`, `code submit`, `code create`, `code status`). This gives you structured output to work with instead of human-readable tables.

### Phase 1: Discover

1. **Check auth** — run `magicpath-ai whoami -o json` to verify authentication.
2. **Check current selection** — if the user references "the selected component," "what I have open," or "the current design," run `magicpath-ai selection -o json`. If it returns components, use them directly — skip the search/confirm flow and proceed with the returned `generatedName`(s).
3. **Find components** — use `magicpath-ai search <query> -o json` to search across all projects, or `list-projects -o json` then `list-components <projectId> -o json` to browse.
3. **Understand components visually** — `search` and `list-components` results include a `previewImageUrl` field. Download and analyze these images to understand what each component looks like before recommending it. Preview images are for your own understanding — use the `view` command when the user needs to see a component.
4. **Confirm with the user (STOP and wait)** — unless the user specified an exact generatedName, tell the user what you found (name, generatedName, project), open a browser preview with `magicpath-ai view <generatedName>`, and ask if it's the right component. If multiple matches, list them all and ask which one. **This is a STOP point — end your response here and wait for the user to reply. Do NOT proceed until the user explicitly confirms.** Do not run `add` or `inspect` yet.

### Phase 2: Understand the Target Context

> **This phase is critical.** Before installing anything, you MUST understand where the component is going and what it needs to do there. Skipping this leads to components that look right but behave wrong.

5. **Inspect the MagicPath component source** — use `magicpath-ai inspect <generatedName> -o json` to read the source code. Identify what it renders, what props it expects, and what assumptions it makes about layout (fixed widths, absolute positioning, etc.).
6. **Read the target codebase context** — before installing, read the file(s) where the component will live. Understand:
   - **Existing functionality**: If replacing a component, what does the current one do? What callbacks, state, API calls, navigation, validation, or side effects does it handle? Every piece of existing behavior must be preserved or consciously addressed.
   - **Layout context**: What is the parent layout? Is it a flex/grid container? What are the responsive breakpoints? How does spacing work? A component that looks perfect in isolation can break a layout if its sizing assumptions don't match.
   - **Data flow**: What props, context, or state does the surrounding code provide? What does it expect back (callbacks, form data, events)?
   - **Design system**: What styling patterns does the project use (Tailwind, CSS modules, theme tokens)? The MagicPath component's styles need to harmonize, not clash.

### Applying a Theme (if applicable)

If the user has a theme they want applied, or references a brand/design system by name:

1. **List available themes** — run `magicpath-ai list-themes -o json` to see all themes.
2. **Get the theme definition** — run `magicpath-ai get-theme <id-or-name> -o json` to fetch the full definition.
3. **Read the `prompt` field** — if present, this contains natural-language styling instructions from the designer (e.g., "use rounded corners, prefer shadows over borders, use the brand blue for CTAs"). Follow these instructions when adapting components.
4. **Apply CSS variables** — the theme's `light` and `dark` objects map CSS variable names to values (e.g., `--background: #ffffff`, `--primary: #3b82f6`). When adapting MagicPath components, use these CSS variables instead of hardcoded colors: `bg-[var(--background)]`, `text-[var(--primary)]`, etc. Ensure the component respects `defaultTheme` (light or dark).
5. **Handle fonts** — if the theme includes `fonts`, ensure the project loads these fonts (Google Fonts link or `@font-face` declarations for custom fonts) and that components reference them via the theme's font CSS variables (e.g., `font-family: var(--font-body)`).
6. **Non-React/JS projects** — theme data is a reference, not a stylesheet. Translate CSS variables into the target platform's equivalent: SwiftUI `Color` assets, Android theme XML, Python template context, etc. The `prompt` field and color/font values express platform-agnostic design intent — map them to native patterns rather than using CSS directly.

### Phase 3: Install and Adapt

7. **Add to project** — use `magicpath-ai add <generatedName> -y` to install component files. Always pass `-y` in non-interactive contexts. If this is a **non-React project** (Swift, Python, etc.), **do not run `add`** — use `magicpath-ai inspect <generatedName> -o json` to read the source as a reference, then recreate the component in the target language and framework.
8. **Adapt the component for production use** — MagicPath components are design artifacts: they capture visual intent and structure, but they are often not production-ready out of the box. After adding, you MUST edit the component files to:
   - **Make it responsive**: Replace any hardcoded widths/heights (e.g., `w-[300px]`) with responsive utilities (`w-full max-w-sm`, responsive breakpoints like `md:w-64 lg:w-80`). A design may show a single viewport — your job is to make it work across all viewports.
   - **Add real interactivity**: Replace static/placeholder content with actual props, state, and event handlers. A MagicPath button that says "Submit" needs an `onClick` prop and loading state. A form needs validation and `onSubmit`.
   - **Wire up data flow**: Connect the component to the app's actual data — props from parents, context providers, API calls, router state. Don't leave mock data in place.
   - **Preserve existing functionality**: When replacing an existing component, audit every feature the old one provided (form submission, error handling, loading states, accessibility, keyboard navigation, analytics events) and ensure the new component handles all of them.
   - **Match the project's patterns**: Use the same state management, error handling, and styling approaches as the rest of the codebase.

### Phase 4: Integrate into the Page

9. **Import and render** — import the component using the `importStatement` from the add output. Pass the props you've defined.
10. **Verify layout fit** — after placing the component, review the parent layout to ensure it integrates cleanly. Check that the component doesn't overflow, create unexpected gaps, or break the responsive flow of the page.

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
2. Inspect the MagicPath component source with `magicpath-ai inspect <generatedName> -o json`
3. Install the MagicPath component with `magicpath-ai add <generatedName> -y`
4. Edit the MagicPath component to accept all the same props/callbacks
5. Ensure every feature from the old component exists in the new one
6. Swap the import in the parent — the parent code should barely change

**Building a new page from a MagicPath design library**:
1. Browse the project's components with `list-components`
2. Plan the page layout first — identify which MagicPath components map to which sections
3. Install needed components one at a time with `magicpath-ai add <generatedName> -y`
4. Build the page layout, importing each component
5. Adapt each component: responsive sizing, real data, proper routing, state management
6. Ensure consistent spacing, typography, and color usage across all components

**Using a single MagicPath component as inspiration**:
1. Inspect the source with `magicpath-ai inspect <generatedName> -o json`
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

## Quick Reference

```bash
# Auth
magicpath-ai login                    # one-click browser login
magicpath-ai whoami -o json           # check auth status
magicpath-ai info -o json             # full project context

# Teams and people
magicpath-ai list-teams -o json                  # list teams you belong to
magicpath-ai list-members --team "Acme" -o json  # list members of a team

# Find components (always use -o json)
magicpath-ai search "input box" -o json          # search across all workspaces
magicpath-ai search "button" --team "Acme" -o json   # search within a team
magicpath-ai list-projects -o json               # list all projects (personal + team)
magicpath-ai list-projects --team "Acme" -o json     # list only team projects
magicpath-ai list-projects --personal -o json        # list only personal projects
magicpath-ai list-components <id> -o json      # list components in a project
magicpath-ai list-components <id> --created-by <userId> -o json  # filter by person

# Inspect components
magicpath-ai view <generatedName>              # preview in browser
magicpath-ai inspect <generatedName> -o json   # show source code (no install)
magicpath-ai add <generatedName> --dry-run     # show what would be installed

# Install and use components
magicpath-ai add <generatedName> -y         # add to project (no prompts)

# Themes (design systems)
magicpath-ai list-themes -o json                 # list personal themes
magicpath-ai list-themes --team "Acme" -o json   # list team themes
magicpath-ai get-theme <id-or-name> -o json    # get theme CSS vars, fonts, prompt

# Current canvas selection
magicpath-ai selection -o json                 # get currently selected component(s)

# Edit/create canvas components from code
magicpath-ai code context <componentId> --dir ./mp-work -o json
magicpath-ai code submit --dir ./mp-work --wait -o json
magicpath-ai code start --project <projectId> --dir ./mp-new --name "Component Name" -o json
magicpath-ai code submit --dir ./mp-new --wait -o json
magicpath-ai code status <jobId> -o json
```

## Key Concepts

- Each component has a **generatedName** (e.g., `wispy-river-5234`) — this is the identifier for all operations
- Components are added as source code to `src/components/magicpath/<name>/`
- The `add` command returns `importStatement` and `usage` — use these in code
- Use `inspect` to inspect source code without installing — don't use `add` just to read code
- MagicPath components are React/TypeScript source code — use `add` in JS/TS projects, use `inspect` + translate for other languages
- **Themes** (design systems) contain CSS variables (`light`/`dark` maps), optional `fonts`, and an optional `prompt` with styling instructions for agents. "Theme" and "design system" are interchangeable. Use `list-themes` to browse, `get-theme` to fetch the full definition

## Create/Edit MagicPath Canvas Components From Code

Use this workflow when the user wants you to modify a MagicPath canvas component itself, not install a MagicPath component into another app. These commands publish back to the MagicPath canvas through the external-agent revision pipeline.

**Strict code boundary:** only edit `src/App.tsx`, `src/index.css`, and `src/components/generated/**` inside the code working directory. Do not edit `package.json`, `vite.config.*`, `src/main.tsx`, lockfiles, dependency files, or arbitrary project files for this workflow.

### Edit an existing canvas component

1. Fetch context: `magicpath-ai code context <componentId> --dir <workdir> -o json`
2. Edit only allowed files in `<workdir>`
3. Submit and wait: `magicpath-ai code submit --dir <workdir> --wait -o json`
4. If the result is `failed`, read the sanitized diagnostics, fix only allowed files, and run `code submit --wait` again
5. If there is a conflict/stale base, run `code context` again before editing

### Create a new canvas component

1. Immediately create the pending component/revision first: `magicpath-ai code start --project <projectId> --dir <workdir> --name "Component Name" -o json`
2. Then write `src/App.tsx`; optionally add `src/index.css` and `src/components/generated/**`
3. Submit and wait: `magicpath-ai code submit --dir <workdir> --wait -o json`
4. Check status later with `magicpath-ai code status <jobId> -o json`

**Do not use MagicPath AI flows, `add`, `inspect`, or `integrate` for this external-code workflow.** `add`/`inspect` are for reusable registry components; `code ...` is for editing components on the user's MagicPath canvas.

## Current Project Context

```json
!`magicpath-ai info --json 2>/dev/null || echo '{"error": "magicpath-ai not found. Install with: npm install -g magicpath-ai"}'`
```

The JSON above contains auth status, projects, and CLI version. If auth.authenticated is false, the user needs to log in before any other operations.

## References

- [CLI Reference](references/cli-reference.md)
