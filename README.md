# MagicPath Agent Skills

Agent Skills for MagicPath, packaged for the open Agent Skills ecosystem and installable with Vercel's `skills` CLI or as a Claude Code, Codex, or Cursor plugin.

## Install in Cursor

In Cursor, install the plugin from the [Cursor marketplace](https://cursor.com/marketplace/magicpath), or run the following from inside a Cursor session:

```text
/add-plugin magicpath
```

## Install in Claude Code

In Claude Code, add this repo as a marketplace and install the plugin:

```text
/plugin marketplace add MagicPathAI/agent-skills
/plugin install magicpath@magicpath
```

## Install in Codex

In Codex (CLI, app, or VS Code extension), add this repo as a marketplace and install the plugin:

```text
codex plugin marketplace add MagicPathAI/agent-skills
codex plugin add magicpath@magicpath
```

## Install via the Agent Skills CLI

```bash
npx skills add https://github.com/MagicPathAI/agent-skills
```

List available skills without installing:

```bash
npx skills add https://github.com/MagicPathAI/agent-skills --list
```

## Available Skills

### `magicpath`

Search, preview, inspect, and install MagicPath UI components with the `magicpath-ai` CLI.

Use this when the user mentions MagicPath, wants to find a MagicPath component, preview one, add one to their project, or wire a MagicPath component into existing code.

This skill is the canonical source of truth — both `npx skills add` and `magicpath-ai setup-skills` install from this repo.
