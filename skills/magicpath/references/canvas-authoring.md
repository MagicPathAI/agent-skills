# Canvas Authoring — Create and Edit Designs From Code

Use this flow when the user wants you to author or modify a MagicPath canvas design itself — not install a design into an app (that's the [install flow](install-flow.md)). The `code` subcommands operate on a working directory plus a small manifest (`magicpath-code.json`) that tracks which component and revision the directory belongs to.

> **You are an expert design engineer building beautiful, functional, interactive React components.** Canvas designs should be real working mini-apps: state-driven, hover/focus/active states wired, buttons that do something, forms that validate, transitions that feel deliberate. A pretty but lifeless component is a failed component.

## The commands

```bash
npx -y magicpath-ai@experimental code start --project <projectId> --dir <workdir> --name "Name" --width <px> --height <px>   # create new
npx -y magicpath-ai@experimental code start --component <componentId> --dir <workdir>                                       # edit existing
npx -y magicpath-ai@experimental code start --component <componentId> --revision <revisionId> --dir <workdir>               # edit a specific revision
npx -y magicpath-ai@experimental code read <componentId> --dir <workdir>     # read-only source fetch — NEVER a path to submit
npx -y magicpath-ai@experimental code submit --dir <workdir>                 # submit + wait for the build (default)
npx -y magicpath-ai@experimental code status <jobId>                         # re-poll a build job
```

`code start` is the only command that begins a stateful session: it creates or reuses a pending revision on the canvas (so the user sees your presence), scaffolds/downloads the editable files, and writes the manifest. Always run it **before** writing files.

## SUPER IMPORTANT — Design Defaults

These rules apply to every canvas design you create or edit, unless the user **explicitly** overrides them. They do **not** apply to the install flow.

### 1. NEVER add device mockups

Do NOT wrap components in iPhone/Android/laptop/browser frames, status bars, notches, home indicators, or address bars. Designing for a mobile viewport is **not** a request for a mockup — the canvas itself is the device frame. Only add one if the user explicitly asks ("wrap it in an iPhone mockup").

### 2. Everything is responsive — always

Every component must work at any width, including small primitives. Use `w-full`, `max-w-*`, percentages, flex/grid sizing, and breakpoint utilities. No hardcoded pixel sizes on outer containers; only intrinsically fixed elements (avatars, icons) are exempt.

### 3. Always centered inside the canvas

The root should center itself — horizontally, and vertically when the design is short (`min-h-screen flex items-center justify-center`, `mx-auto`, or grid centering). Never stuck in a corner, never overflowing.

### 4. Canvas size ≠ device mockup

Pass `--width`/`--height` to signal the target form factor (e.g. `--width 390 --height 844` for mobile, `--width 1440 --height 900` for desktop) — but the content inside stays fluid and adapts if dropped into a different container later.

### 5. NEVER stack multiple screens inside one frame

One component = one frame. Don't draw "Screen 1 / Screen 2 / Screen 3" side by side or stacked — it doesn't render or navigate, and it wastes the canvas. Two patterns:

- **A. Self-contained app in ONE frame** (preferred when views belong to one flow): hold many views/modals/tabs/steps via React state and conditional rendering. A login → signup → forgot-password flow, a wizard, a settings page with tabs — all one component with internal navigation.
- **B. Multiple frames** (one component per screen) when the screens are truly independent deliverables. Run separate `code start --name "…"` sessions, **each with its own `--dir`** (parallel sessions sharing a directory overwrite each other's manifest). Build them concurrently — spawn one sub-agent per frame if your environment supports it.

If unsure which fits, ask: "One interactive component with internal navigation, or separate frames per screen?" — and **stop and wait**.

### 6. Build interactive components, not static markup

Buttons trigger real actions, inputs are controlled, forms validate, modals open/close, tabs switch, drawers slide, dropdowns expand, toggles flip. Use `useState`/`useReducer`, real event handlers, `aria-*` attributes, and meaningful transitions. A component left with `onClick={() => {}}` is **not done** — wire it up before `code submit`.

## File boundary (hard limit)

The API accepts full-file replacements for **only**:

- `src/App.tsx` — pre-wired to render the generated component; edit only to change the top-level `theme` (`'light'`/`'dark'`)
- `src/index.css`
- `src/components/generated/**`
- `assets/**` (temporary image staging only)

Never edit or submit `package.json`, `vite.config.*`, `src/main.tsx`, or lockfiles — they're rejected. Deleting an editable file locally propagates as a deletion on submit (edit mode); a rename is delete + write.

## Tailwind v4 rules

- `src/index.css` must contain `@import 'tailwindcss';` — not the v3 `@tailwind base/components/utilities` directives.
- Theme tokens (`bg-background`, `text-primary`, …) are wired via the `@theme inline { … }` block; the `:root` and `.dark` blocks define values. Don't remove them.
- Append custom utilities to `index.css`; there is no `tailwind.config.js` — configuration lives in CSS via `@theme`.

## Images and assets

- Put image files in `<workdir>/assets/` and reference them from TSX/CSS (`/assets/hero.png`, `url("../../assets/hero.png")`). MagicPath uploads them, rewrites references to stable URLs, and removes the staging folder. Never inline `data:image/...;base64,...`.
- If the user had image shapes selected on the canvas at `code start`, the response includes `selectedImages` downloaded into `assets/selected/**`. Use the local `assetPath` — never the expiring `accessUrl`.
- To see what images already exist on a project canvas: `project canvas <projectId>` or `image list <projectId>`.

## Create a new design

1. `code start --project <projectId> --dir <workdir> --name "Component Name" --width <px> --height <px>` — choose dimensions that fit the design. The scaffold is already correct: a slim `src/App.tsx` plus a stub `src/components/generated/<PascalCaseName>.tsx`.
2. Fill in the stub. Split substantial components into sibling files under `src/components/generated/`. **Don't rewrite `App.tsx`.**
3. Optionally edit `src/index.css`; put images in `assets/`.
4. `code submit --dir <workdir>` (waits for the build by default).
5. If the build fails, read the diagnostics in the result, fix only allowed files, and submit again. **Never create a second component to work around a build failure.**

## Edit an existing design

1. `code start --component <componentId> --dir <workdir>` — starts from the currently selected revision. Pass `--revision <revisionId>` to start from a different one (e.g. the revision the user is looking at, from `context`'s `selection[].selectedRevisionId`).
2. Edit/add/delete allowed files. Remove orphaned sub-component files when you remove their last usage.
3. `code submit --dir <workdir>`. Pass `--width`/`--height` if the size should change.
4. On a conflict or stale-base error, re-run `code start --component <id> --dir <workdir>` to refresh the session, then re-apply your edits.

## Verify visually — every time

`code submit` (and `code status`) return `revision.previewImageUrl` once the build completes (it can lag the build by a few seconds; the CLI re-polls briefly, and `code status <jobId>` picks it up if still null). **Download and look at the preview image before declaring success.** Check it against the Design Defaults: no mockup chrome, centered, looks complete, matches what the user asked for. If something is off, fix and resubmit — don't make the user discover it.

## Revision rollback — "go back and try again"

Every submit creates a revision; the canvas shows the component's **selected revision**. When the user rejects your latest attempt:

1. `component revisions <componentId>` — list history (newest first, `isSelected` marked, each with `previewImageUrl`).
2. Identify the revision to return to — usually the previous selected one; confirm with its preview image if unsure.
3. `component select-revision <componentId> --revision <revisionId>` — **the canvas visibly reverts immediately**; the user sees their design back in the good state. The result echoes that revision's `previewImageUrl` — verify it.
4. `code start --component <componentId> --revision <revisionId> --dir <workdir>` — begin the new attempt from the restored base, not from the rejected one.
5. Make a meaningfully different fix (re-read the user's complaint), then `code submit` and verify the new preview image.

This order matters: revert first (instant, visible relief), then iterate.
