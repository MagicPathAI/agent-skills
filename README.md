# MagicPath Agent Skills

Agent Skills for MagicPath, packaged for the open Agent Skills ecosystem and installable with Vercel's `skills` CLI.

## Install

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
