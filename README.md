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

Search, preview, inspect, install, and integrate MagicPath UI components with the `magicpath-ai` CLI.

Use this when the user mentions MagicPath, wants to find a MagicPath component, preview one, add one to their project, or wire a MagicPath component into existing code.

This skill mirrors the guidance currently emitted by `magicpath-ai setup-skills`, but in the standard Agent Skills repository layout so `npx skills add` can install it for supported agents.
