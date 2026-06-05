# Working With Storybook — Import a Storybook Design System Into MagicPath

> **IMPORTANT:** This flow is a specialization of *Working With Repositories*: the **source of truth is the user's Storybook** (component source + story files + Storybook config) and the **destination is the MagicPath canvas**. You recreate the design system as canvas components using the `code start` → `code submit` authoring flow. Do **not** use `add`, `inspect`, or `code context` for this — they are for other workflows. The goal is a **1:1 import, both visually and interaction-wise, using the actual component source code** — not a reinterpretation.

This reference tells an external agent (MagicPath's own agent, Claude Code, Codex, Cursor, etc.) exactly what to do when the user wants to import a Storybook — its components, its stories, its design tokens — onto their MagicPath canvas.

## When this applies (triggers)

Reach for this reference when the user points at a Storybook and asks to get it onto the canvas. Examples:

- "Import my Storybook into MagicPath." / "Import 100% of my Storybook, 1:1."
- "Bring my design system into MagicPath." (when the design system lives in a Storybook)
- "Create every component from this library on my canvas."
- Any message that pairs `.stories.*` files, a `.storybook/` directory, or a running Storybook URL with MagicPath intent.

If the user wants a single app screen (not a story library) recreated, use *Working With Repositories* instead. If they want a MagicPath registry component installed into their app, that is the `add`/`inspect` flow — not this one.

## The mental model

A Storybook is two layers, and you import both:

1. **The components themselves** — the user's real source files (`Button.jsx`, `Toggle.tsx`, …). These get ported **verbatim** into the canvas working directory as sibling files. The component code *is* the design system; copying its visual output without its code is a failed import.
2. **The stories** — each `.stories.*` file enumerates the variants the team cares about (CSF: one default export of metadata + one named export per story). On the canvas, each Storybook **component** becomes one MagicPath canvas component whose top-level frame is a **showcase** that renders **every story export** with its exact `args`, labeled by story name.

Interactions come along for free: if the components manage their own state (press effects, focus rings, toggles, hover lifts), porting the real source preserves them. That is the core reason to port source rather than re-draw.

---

## Phase 0 — Locate the Storybook

**Local repository.** Find the story glob and config:

- `.storybook/main.{js,ts}` → the `stories:` glob tells you where stories live.
- `.storybook/preview.{js,ts}` → global decorators, `parameters` (backgrounds, layout), font loading. **Read this — it defines the visual context every story renders in.**
- The component sources referenced by each story's `import`.

A design system may live in a subfolder with no `package.json` of its own (e.g. `repo/design-system/`), and `main.js` may not even exist yet — the stories and `preview.js` are still importable. The story files are the contract; a runnable Storybook is **not** required to import from one.

**Online repository.** Shallow-clone into a scratch directory (see *Working With Repositories*, Phase 0). A running Storybook URL alone is not enough — you need the source; ask for the repo.

Keep the repo and your MagicPath working directories (`--dir`) **separate**.

## Phase 1 — Inventory

Build a complete map before creating anything:

1. **List every component** with its source path and its `.stories.*` path.
2. **Count the stories per component** (named CSF exports). The import is done when every one of them renders on the canvas — track the numbers.
3. **Include foundations.** Token files (`tokens.*`, `theme.*`) and their documentation stories (palette sheets, type scales, spacing scales) are part of the Storybook. They become a canvas component too.
4. **Read `preview.js` for global context:**
   - Font loading (injected `<link>`s, imported CSS) → becomes `@import` lines in `src/index.css`.
   - `parameters.backgrounds` → the default background becomes the showcase frame's background color.
   - Global decorators → replicate their wrapping behavior in the showcase root.
5. **Detect external dependencies** of the component source (`prop-types`, icon packages, utility libs). The canvas template cannot install new packages (`package.json` is not editable), so plan a substitution for each one (see porting rules).
6. **Note the styling system.** Inline style objects and self-contained CSS-in-JS port verbatim. Tailwind classes port verbatim (the canvas is Tailwind v4 — translate v3-isms). CSS Modules/SCSS need flattening per *Working With Repositories*, Phase 3.

**Scope check (stop point).** Confirm the frame plan with the user when it isn't obvious: the default is **one canvas component per Storybook component** (all of its stories inside one frame), not one frame per story. For a library of N components that means N frames plus one for tokens. State the plan; if the user wanted a different granularity they'll say so.

## Phase 2 — Porting rules (verbatim means verbatim)

Port each component source file into the canvas working directory with **only** these mechanical changes — every hex value, padding, easing curve, emoji, and comment stays character-for-character identical:

1. **Strip unavailable dependencies.** Delete `import PropTypes from 'prop-types'` and the `Component.propTypes = {…}` block (runtime-only validation; safe to drop). For other unavailable packages, inline the minimal equivalent (e.g. a single icon as an SVG) and record the deviation.
2. **Satisfy strict TypeScript minimally.** The canvas template compiles `.tsx` under strict mode:
   - Annotate destructured props params `: any` (or real types if trivial).
   - Annotate inline style objects `: React.CSSProperties` **only if the build rejects them** (string-literal CSS values like `position: 'relative'` often need it). Try verbatim first; add annotations on build failure.
   - Annotate helper-function params `: any` as needed.
3. **Keep the exports identical** (`export const Name`, `export default Name`) so imports read the same as in the user's repo.

These are type-level/dead-code changes only — **zero runtime behavior changes**. Anything beyond this list must be reported as a deviation.

## Phase 3 — Build the canvas components

Use the **create** path of the `code` flow, one session per Storybook component, **each with its own `--dir`** (sessions sharing a directory overwrite each other's `magicpath-code.json`). The sessions are independent — run them in parallel if your environment supports it (one sub-agent per component).

For each component:

1. **Start before writing files** so the user sees agent presence on the canvas:

   ```bash
   npx -y magicpath-ai code start --project <projectId> --dir ./mp-<name> --name "<Canvas Name>" --width <px> --height <px> -o json
   ```

   **Naming gotcha:** the scaffolded stub is the PascalCase of `--name`. If you name the canvas component "Button", the stub `Button.tsx` collides with the verbatim source file you're about to add. Prefix the canvas name with the library name ("Clown Button" → stub `ClownButton.tsx`, verbatim `Button.tsx` beside it).

2. **Write the verbatim component** to `src/components/generated/<OriginalName>.tsx` per the Phase 2 rules.

3. **Replace the stub's contents with the showcase** (keep the scaffold's exported component name — `App.tsx` is pre-wired to it; don't edit `App.tsx`):
   - Render **every story export** as one instance of the ported component with exactly that story's `args`, labeled with the story's export name in a small mono caption.
   - Root: full-frame, centered, background = the Storybook default background from `preview.js`; inner layout a responsive flex-wrap/grid of story cells. Full-width stories (`fullWidth: true` etc.) get full-width cells.
   - Heading: the component's Storybook `title` (keep its emoji/prefix style).
   - Storybook `argTypes` actions (`onClick: { action: 'clicked' }`) → real handlers that `console.log('<action>', …args)` — the canvas analog of the actions panel.
   - Stories with `play` functions: the interaction the play function *performs* should be achievable by hand on the canvas (the component is live); you do not need to auto-run it.
   - Design Defaults still apply: responsive, centered, no device mockups, one frame, fully interactive.

4. **Port the global context** into `src/index.css`: prepend the font `@import`s from `preview.js` at the **very top** of the file (all CSS `@import` rules must precede other statements, including `@import 'tailwindcss'`). Don't remove anything already there.

5. **Tokens/foundations**: port the token file verbatim (e.g. `tokens.ts`) and make the showcase reproduce the token documentation stories 1:1 — palette swatches, gradients, type scale, typefaces, spacing — importing values from the ported file rather than re-hardcoding them.

6. **Submit and fix:**

   ```bash
   npx -y magicpath-ai code submit --dir ./mp-<name> --wait -o json
   ```

   On `failed`, read the diagnostics, fix only editable files (usually a missing `: React.CSSProperties`), resubmit. Never create a second component to dodge a build failure.

## Phase 4 — Verify completeness

The user asked for 100%; prove it:

- `list-components <projectId> -o json` → every Storybook component (and the tokens sheet) is present.
- Story math: rendered-instance count per frame equals the story-export count per `.stories.*` file. Report the per-component numbers.
- Spot-check interactions against the running Storybook side by side if it's available (`npx storybook dev`): press states, toggles, focus rings should feel identical because the code is identical.
- Report any deviations from verbatim (stripped packages, type annotations, anything else) explicitly.

## Phase 5 — The library is now reusable

The ported `.tsx` files in your working directories are a **build-clean, canvas-ready copy of the user's design system**. When the user later asks for a composed design ("now build a dashboard with this library"), copy those files into the new component's `src/components/generated/` and compose them — same code, same physics, zero re-porting. This is the payoff of porting source instead of redrawing.

---

## Fidelity principles

| In the Storybook | What to produce on the canvas |
|---|---|
| Component source file | The same file, verbatim, minus unavailable imports, plus minimal TS annotations |
| One component's `.stories.*` file | One canvas component whose frame shows every story export, labeled |
| Story `args` | Passed exactly as written — same strings, emoji, flags |
| `argTypes` `action:` entries | `console.log` handlers (actions-panel analog) |
| `preview.js` font injection | `@import` lines at the very top of `src/index.css` |
| `parameters.backgrounds` default | The showcase frame's background color |
| Global decorators | Equivalent wrapper in the showcase root |
| Token files + token stories | Verbatim token module + a token-sheet frame that imports from it |
| `play` functions | Live component the user can drive by hand |
| Internal `useState` interactions | Untouched — they carry over because the code does |

**The golden rule:** port the component **code**, not the component's **appearance**. If you find yourself re-implementing a hover effect you can see in Storybook, stop — the implementation is already in the source file; bring that instead.

## Boundaries — what NOT to do

- **Don't use `add`, `inspect`, or `code context`** — wrong direction; this is repo → canvas authoring.
- **Don't redraw components from screenshots or preview images** when the source is available — fidelity comes from the source.
- **Don't "improve" the code in flight.** No refactors, no renamed props, no added types beyond the minimal strict-TS annotations, no swapped colors. Verbatim, then report deviations.
- **Don't edit forbidden files**: only `src/App.tsx` (theme value only), `src/index.css`, `src/components/generated/**`, `assets/**`.
- **Don't share a `--dir` between parallel sessions.**
- **Don't stack all components into one frame** — one canvas component per Storybook component (Design Default rule 5), unless the user asks otherwise.
- **Don't silently skip stories.** If a story can't be reproduced (e.g. depends on a Storybook-only addon), say which and why.

## Quick recipes

**"Import 100% of my Storybook into MagicPath, 1:1"**
1. Locate `.storybook/` + story glob; read `preview.js` (fonts, backgrounds) (Phase 0–1). 2. Inventory: N components × story counts + foundations; confirm the one-frame-per-component plan (Phase 1). 3. Write a shared porting brief, then run one `code start` session per component — own `--dir`, library-prefixed `--name` — in parallel (Phase 3). 4. Each session: verbatim component file + all-stories showcase + fonts in `index.css`, `code submit --wait`, fix-on-fail (Phase 2–3). 5. Verify with `list-components` + story math; report per-component results and any deviations (Phase 4).

**"Now build a ___ using my imported library"**
1. Reuse the ported `.tsx` files from the import sessions (or re-port from the repo with the Phase 2 rules). 2. One new `code start` session for the composition; copy the library files into its `src/components/generated/`. 3. Build the screen as a real interactive flow — library components for every control, internal state for navigation/modals/filters, realistic mock data. 4. `code submit --wait`, verify the library's interactions still feel 1:1.
