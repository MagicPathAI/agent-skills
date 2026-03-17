---
name: magicpath
description: Search, preview, inspect, install, and integrate MagicPath UI components with the magicpath-ai CLI. Use when the user mentions MagicPath, wants to browse or search MagicPath components, preview one, add one to their project, or integrate a MagicPath component into existing code.
compatibility: Requires the magicpath-ai CLI on PATH, network access to MagicPath, and browser access for login or preview flows.
metadata:
  author: MagicPathAI
  source: magicpath-ai setup-skills
allowed-tools: Bash(magicpath-ai:*)
---

# MagicPath

MagicPath is an external platform where the user builds and stores UI components. Those components are not in the local git repo until you fetch them with the `magicpath-ai` CLI.

## First Step

Run `magicpath-ai info -o json` to check auth status, project context, and CLI availability.

- If the CLI is missing, tell the user to install or invoke it with `npx magicpath-ai`.
- If `auth.authenticated` is false, run `magicpath-ai login`, wait for browser auth to finish, then verify with `magicpath-ai whoami -o json`.

## Workflow

1. Check auth and project context with `magicpath-ai info -o json` or `magicpath-ai whoami -o json`.
2. Find components with `magicpath-ai search <query> -o json`, or browse with `list-projects -o json` and `list-components <projectId> -o json`.
3. Use `previewImageUrl` from search or list results to understand what a component looks like before recommending it. Download and inspect the image when visual judgment matters.
4. Before installing, confirm the exact component with the user unless they already gave the exact `generatedName` and explicitly asked you to proceed. If helpful, open a browser preview with `magicpath-ai view <generatedName>`.
5. If the user confirmed a component but you still need to inspect its code, use `magicpath-ai add <generatedName> --inspect`.
6. Install with `magicpath-ai add <generatedName> -y` when you intend to use the component in the project.
7. Import the installed component using the `importStatement` returned by `add`, then render that component from the parent instead of copying its JSX manually.
8. If the component needs wiring, edit the installed MagicPath component to accept the necessary props, then pass those props from the parent.
9. Use `magicpath-ai integrate <generatedName> --target <file> -o json` when you want the CLI to propose edits to an existing file. It returns modified file contents; you must write the files yourself.

## Critical Rules

- Always use `-o json` for data-returning commands such as `info`, `whoami`, `search`, `list-projects`, `list-components`, `add`, and `integrate`.
- `add` means install-to-use. If you only need to inspect source code, use `add --inspect` instead.
- After `add`, import and render the installed component. Do not copy its styles or markup into another file.
- Installed MagicPath components are source files the user owns. Edit them directly when you need to add props, change behavior, or wire them into app state.
- When integrating into an existing feature: add the component, adapt the installed component's props as needed, then import and render it from the parent.
- Never run `view` commands in parallel. They open a browser window for the user.

## References

- [CLI Reference](references/cli-reference.md)
