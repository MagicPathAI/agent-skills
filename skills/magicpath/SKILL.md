---
name: magicpath
description: Search, preview, inspect, and install MagicPath UI components with the magicpath-ai CLI. Use when the user mentions MagicPath, wants to browse or search MagicPath components, preview one, or add one to their project.
compatibility: Requires the magicpath-ai CLI on PATH, network access to MagicPath, and browser access for login or preview flows.
metadata:
  author: MagicPathAI
  source: https://github.com/MagicPathAI/agent-skills
allowed-tools: Bash(magicpath-ai *)
user-invocable: true
---

# MagicPath

A platform for building, sharing, and installing UI components via AI. Components are added as source code to the user's project via the `magicpath-ai` CLI.

## First Step

Run `magicpath-ai info -o json` to check auth status, project context, and CLI availability.

- If the CLI is missing, install it with `npm install -g magicpath-ai` or invoke it with `npx magicpath-ai@latest`.
- If `auth.authenticated` is false, run `magicpath-ai login`, wait for browser auth to finish, then verify with `magicpath-ai whoami -o json`.

## Workflow

> **Always use `-o json`** for all data-returning commands (`search`, `list-projects`, `list-components`, `info`, `add`, `inspect`). This gives you structured output to work with instead of human-readable tables.

1. **Check auth** — run `magicpath-ai whoami -o json` to verify authentication.
2. **Find components** — use `magicpath-ai search <query> -o json` to search across all projects, or `list-projects -o json` then `list-components <projectId> -o json` to browse.
3. **Understand components visually** — `search` and `list-components` results include a `previewImageUrl` field. Download and analyze these images to understand what each component looks like before recommending it. Preview images are for your own understanding — use the `view` command when the user needs to see a component.
4. **Confirm with the user (STOP and wait)** — unless the user specified an exact generatedName, tell the user what you found (name, generatedName, project), open a browser preview with `magicpath-ai view <generatedName>`, and ask if it's the right component. If multiple matches, list them all and ask which one. **This is a STOP point — end your response here and wait for the user to reply. Do NOT proceed to steps 5-7 until the user explicitly confirms.** Do not run `add` or `inspect` yet.
5. **Inspect source** — only after the user confirms in step 4, use `magicpath-ai inspect <generatedName> -o json` to see the component's source code without installing. Decide how it needs to be adapted (props to add, behavior to wire up).
6. **Add to project** — use `magicpath-ai add <generatedName> -y` to install component files. Always pass `-y` in non-interactive contexts.
7. **Use the component** — after adding, import the component from `@/components/magicpath/<name>/` using the `importStatement` from the add output. Edit the component file to add props as needed, then render it from the parent.

## Critical Rules

- **`add` means install-to-use.** Only run `add` when you intend to import and render the installed component. If you just want to read the source code, use `inspect` instead.
- **After `add`, always import the component.** The whole point of `add` is to get source files you then import. Never add a component and then copy its styles/markup into another file — import and render the component directly.
- **MagicPath components are source code you own.** After `add`, the component files live in your project at `src/components/magicpath/<name>/`. You can and should edit them directly to add props, change behavior, adjust styles, or integrate with your app's state.
- **When a component needs integration:** (1) `add` the component, (2) edit the component file to accept the props you need (e.g., `onSubmit`, `placeholder`, `className`), (3) import it from the parent and pass those props. Do NOT copy the component's JSX/styles into the parent file.
- **`inspect` is read-only.** Shows full source code without writing any files. Use this when deciding whether a component fits your needs before committing to install.
- **Never run `view` commands in parallel.** The `view` command opens a browser window for the user. Only open one preview at a time.

## Quick Reference

```bash
# Auth
magicpath-ai login                    # one-click browser login
magicpath-ai whoami -o json           # check auth status
magicpath-ai info -o json             # full project context

# Find components (always use -o json)
magicpath-ai search "input box" -o json        # search across all projects
magicpath-ai list-projects -o json             # list all projects
magicpath-ai list-components <id> -o json      # list components in a project

# Inspect components
magicpath-ai view <generatedName>              # preview in browser
magicpath-ai inspect <generatedName> -o json   # show source code (no install)
magicpath-ai add <generatedName> --dry-run     # show what would be installed

# Install and use components
magicpath-ai add <generatedName> -y         # add to project (no prompts)
```

## Key Concepts

- Each component has a **generatedName** (e.g., `wispy-river-5234`) — this is the identifier for all operations
- Components are added as source code to `src/components/magicpath/<name>/`
- The `add` command returns `importStatement` and `usage` — use these in code
- Use `inspect` to inspect source code without installing — don't use `add` just to read code

## Current Project Context

```json
!`magicpath-ai info --json 2>/dev/null || echo '{"error": "magicpath-ai not found. Install with: npm install -g magicpath-ai"}'`
```

The JSON above contains auth status, projects, and CLI version. If auth.authenticated is false, the user needs to log in before any other operations.

## References

- [CLI Reference](references/cli-reference.md)
