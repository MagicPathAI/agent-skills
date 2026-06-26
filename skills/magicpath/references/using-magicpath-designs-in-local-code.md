# Using MagicPath Designs in Local Code — Export, Replace, and Adapt with 1:1 Fidelity

> **IMPORTANT:** In this workflow, the selected MagicPath component and revision are the source of truth for presentation. The local application is the source of truth for runtime behavior and integration contracts. Preserve both. Do not treat “adapt this design” as permission to restyle, simplify, or approximate anything the user did not ask to change.

Use this reference when taking a component **out of MagicPath**: exporting it to a folder, installing it in an application, replacing existing local UI with it, or adapting it for another framework while retaining the MagicPath design.

## Contents

- [The fidelity contract](#the-fidelity-contract)
- [Phase 0 — Resolve the exact source and destination](#phase-0--resolve-the-exact-source-and-destination)
- [Phase 1 — Acquire the right source](#phase-1--acquire-the-right-source)
- [Phase 2 — Capture the visual baseline](#phase-2--capture-the-visual-baseline)
- [Phase 3 — Understand the local runtime contract](#phase-3--understand-the-local-runtime-contract)
- [Phase 4 — Establish parity before adapting](#phase-4--establish-parity-before-adapting)
- [Phase 5 — Integrate behavior without losing the design](#phase-5--integrate-behavior-without-losing-the-design)
- [Handle explicitly requested changes](#handle-explicitly-requested-changes)
- [Visual verification loop](#visual-verification-loop)
- [Common workflows](#common-workflows)
- [Failure modes](#failure-modes)
- [Definition of done](#definition-of-done)

## The fidelity contract

Treat “use this MagicPath design” or “make my local component match this” as a request for **parity by default**. A successful result preserves:

- **Structure:** the same hierarchy, grouping, content order, and visible elements.
- **Geometry:** the same sizing, spacing, alignment, positioning, overflow, and image crops at the reference viewport.
- **Visual styling:** the exact colors, gradients, typography, radii, borders, shadows, opacity, and effects—not the nearest local design-system equivalents.
- **Assets:** the same images, icons, logos, fonts, aspect ratios, and icon stroke characteristics.
- **States and motion:** the same default, hover, focus, active, disabled, open, loading, error, and transition behavior represented by the MagicPath component.
- **Responsive intent:** the same result at the canvas dimensions and equivalent behavior as the viewport becomes narrower or wider.
- **Runtime behavior:** the local component's required data flow, callbacks, navigation, validation, API effects, accessibility, analytics, and error handling.

Use this precedence when requirements compete:

1. Apply the user's explicit requested changes.
2. Preserve required local application behavior and accessibility.
3. Preserve the selected MagicPath revision's presentation and canvas-defined interactions.

If these cannot coexist without a product decision, explain the specific conflict and stop for direction. Do not silently choose one.

**1:1 does not mean screenshot tracing.** Use the MagicPath source as the implementation baseline and the rendered MagicPath component as the visual baseline. Rebuilding from a screenshot when source is available creates avoidable drift.

## Phase 0 — Resolve the exact source and destination

### 1. Resolve the MagicPath component

- If the user refers to “this,” “the selected design,” or a component visible on the canvas, run:

  ```bash
  npx -y magicpath-ai selection -o json
  ```

  Use the selected entry's `id`, `generatedName`, `projectId`, and `selectedRevisionId` from the returned `components` array. A canvas selection is already an explicit choice; do not search for a different component.
- If the user gives an exact `generatedName`, use it directly.
- Otherwise search or list components, inspect their preview images, present the matching component and project, and **stop for confirmation** before exporting or changing local code.
- If several components are selected, determine whether they are independent exports or parts of one deliverable. Use a separate staging directory for each independent component so their `src/App.tsx` and `src/index.css` files cannot overwrite one another.

### 2. Resolve the destination outcome

Distinguish these outcomes before writing files:

| User intent | Destination | Preferred acquisition path |
| --- | --- | --- |
| “Export/download this design to a folder” | Source snapshot | `code context` into an empty staging/export directory |
| “Use/add this component in my React app” | Existing React/TypeScript application | `inspect`, then `add`, then import and integrate |
| “Make my existing local component match this design” | Existing application component or route | Exact source in staging, then parity-first replacement |
| “Use this in Vue/Swift/Python/etc.” | Non-React target | Exact source as reference, then faithful translation |
| “Change the design in MagicPath” | MagicPath canvas | This reference does not apply; use `code start` → `code submit` |

Identify the target repository, package/app in a monorepo, route, component file, and requested output folder. Detect rather than assume when the answer is available from the codebase. Ask only when multiple plausible targets would produce materially different results.

### 3. Record intentional differences

Before implementation, keep a short internal contract:

- MagicPath component and revision: exact IDs or `generatedName`.
- Reference viewport: canvas width and height, when available.
- Local target: app/package, route, and component.
- Required behavior to retain: props, callbacks, data, side effects, and states.
- Explicit user-requested differences: a closed list.
- Unplanned visual differences allowed: none.

This prevents ordinary integration work from quietly becoming a redesign.

## Phase 1 — Acquire the right source

### Exact selected revision or source-only export

Use `code context` when revision fidelity matters:

```bash
npx -y magicpath-ai code context <componentId> --revision <selectedRevisionId> --dir <stagingDir> -o json
```

If no revision was specified, `code context` defaults to the component's currently selected revision. Pass `--revision` whenever `selection` returned one so the exported code cannot drift if the selected revision later changes.

`code context` is intentionally read-only. It writes `src/App.tsx`, `src/index.css`, and `src/components/generated/**`, but it does not create a pending revision, show agent presence, write `magicpath-code.json`, install dependencies, or produce a complete standalone application.

- Use an empty staging directory when integrating into an existing app. Do not point it at the app root, where similarly named files could be overwritten.
- Use the requested empty destination directly only for a source-only export.
- Do not run `code start` for an export; it creates editing state on the canvas.
- Do not run `code submit`; the direction of travel is out of MagicPath.
- Treat `src/App.tsx` as a rendering/theme reference. In an existing app, normally import the top-level named component from `src/components/generated/` instead of replacing the app's entry point.

If an exact `generatedName` is available but no accessible component ID exists, use `inspect -o json` and recreate the returned `files[].path` entries in the requested folder. This exports the registry version, not an arbitrary historical revision; say so in the handoff rather than implying revision-level fidelity.

### Installable React/TypeScript component

Use the registry path when the user wants to install and render a component identified by its `generatedName`:

```bash
npx -y magicpath-ai inspect <generatedName> -o json
npx -y magicpath-ai add <generatedName> --dry-run -o json
npx -y magicpath-ai add <generatedName> -y -o json
```

Read the `inspect` output before installing. Review every file, dependency, import, asset, and assumption about layout or theming. Use `--dry-run` when the target is non-trivial or files may already exist. Do not use `--overwrite` until the existing files and diff have been reviewed.

`inspect` and `add` identify components by `generatedName`; they do not accept a revision. When the user means the exact revision currently displayed on the canvas, prefer `code context --revision` for the source snapshot. Use `inspect` only for supplemental dependency/import metadata, and verify that metadata against the imports in the revision snapshot.

Only run `add` when the component will be imported and rendered. A folder-only export should use `code context`, not `add`.

After `add`, use the returned `importStatement` and `usage` to import the installed component directly. Adapt the installed source in place; do not copy its JSX into a parent and leave an unused duplicate behind.

### Non-React target

Never run `add` in a non-React project. Pull the exact source with `code context` when a component ID is available, or use `inspect` for a component known only by `generatedName`. Translate rendered structure and behavior into the target framework while preserving concrete values. Do not reinterpret the design using the target platform's default components or theme.

## Phase 2 — Capture the visual baseline

Before adapting the source, preserve evidence of what “correct” means:

1. Capture the selected component as rendered in MagicPath at its canvas dimensions. Prefer the open project canvas when the user selected a particular revision; do not assume an individual share link represents an older selected revision.
2. Download or retain the component preview image when available.
3. Record the reference width, height, theme, visible content, and active state.
4. Inspect the source alongside the render. Identify which file owns each major region and state.
5. Inventory all assets and external requirements:
   - image imports, remote URLs, and CSS `url(...)` values;
   - icon packages and custom SVGs;
   - font families, weights, and loading mechanism;
   - CSS variables and light/dark token values;
   - animation libraries and other runtime dependencies.

Do not use temporary selected-image `accessUrl` values in local source; they expire. Use durable URLs already present in submitted component source or download assets into the local project and update references without changing their rendered dimensions or crop.

## Phase 3 — Understand the local runtime contract

Read the target code before replacing anything:

1. Detect the framework, package manager, build system, styling system, and relevant package versions.
2. Read the target route/component, its parent layout, and every caller.
3. Read global CSS, resets, theme providers, font setup, Tailwind configuration, and shared UI primitives.
4. Inventory the existing component's contract:
   - public props and emitted callbacks;
   - controlled/uncontrolled state;
   - API calls, mutations, and caching;
   - routing and URL behavior;
   - validation and submission rules;
   - loading, empty, error, permission, and offline states;
   - keyboard behavior, focus management, labels, and ARIA;
   - analytics, logging, feature flags, and tests.
5. Identify parent constraints such as grid tracks, flex sizing, container widths, transforms, stacking contexts, and overflow. A component can be internally identical and still render differently inside the wrong parent geometry.

Treat the existing local component as the behavioral specification, not the visual specification. Preserve its capabilities unless the user explicitly asks to remove or change them.

Protect the user's worktree. Review existing changes, avoid unrelated files, and build the replacement under a new path until it is ready to swap in. Do not erase the old implementation to make comparison easier.

## Phase 4 — Establish parity before adapting

Create a faithful baseline first. This sharply separates source drift from integration bugs.

1. Render the MagicPath component in the target environment with minimal transformation.
2. Bring over the complete implementation, not only the top-level TSX file:
   - all imported files under `src/components/generated/`;
   - required parts of `src/index.css`;
   - exact theme variables and dark-mode behavior;
   - fonts, icons, images, and runtime dependencies.
3. Use representative data matching the MagicPath preview during parity work. Real production data can otherwise create text wrapping or empty-state differences that obscure styling problems.
4. Reproduce the reference viewport exactly and compare the local render before refactoring, renaming, extracting abstractions, or mapping values to the local design system.
5. Fix environmental differences at their source: parent layout, reset styles, font loading, theme class, Tailwind scanning, stacking context, or asset paths.

### Styling-system translation

- **Tailwind v4 target:** preserve the component's utilities and merge required `@theme` tokens deliberately.
- **Tailwind v3 target:** translate v4 `@theme` values into the v3 configuration or concrete CSS. Do not paste unsupported v4 directives into the app.
- **CSS Modules, Sass, CSS-in-JS, or another framework:** translate to equivalent concrete styles only after establishing what every utility and CSS variable resolves to.
- **Existing design system:** reuse a token or primitive only when its computed output is identical. “Close enough” colors, spacing, shadows, buttons, icons, or typography violate parity.
- **Global CSS:** scope imported rules where possible, but verify that scoping does not break dark mode, portals, keyframes, or descendant selectors.

Do not “clean up” unusual values merely because they are unconventional. Preserve them until the local render matches; then refactor only if the rendered output remains unchanged.

## Phase 5 — Integrate behavior without losing the design

Once the static baseline matches, merge the local runtime contract into the MagicPath presentation:

1. Define props that carry the target app's real data and handlers.
2. Replace mock content with real data while retaining layout behavior for long, short, missing, and loading values.
3. Connect buttons, forms, tabs, dialogs, menus, and navigation to existing application actions.
4. Preserve validation, errors, pending/disabled states, permissions, analytics, and side effects.
5. Preserve or improve semantic HTML, labels, focus order, keyboard operation, and ARIA without changing the intended appearance.
6. Bridge the old component's public interface where practical so callers need minimal changes.
7. Swap the parent import only after the replacement works in isolation. Keep the old implementation available until verification passes.

Preserve canvas-defined interactions as well as local behavior. If MagicPath contains a working tab transition and the app supplies the selected tab, make that interaction controlled by the app rather than deleting it or maintaining conflicting duplicate state.

Responsiveness is part of fidelity. Maintain an exact match at the reference dimensions while adapting gracefully outside them. Do not fix overflow by shrinking fonts, changing spacing, hiding content, or stacking regions at the reference viewport. Apply breakpoint behavior only where the source already expresses it or where narrower/wider operation requires it without changing the reference render.

## Handle explicitly requested changes

Apply requested changes as a narrow delta from the parity baseline:

1. State the baseline and enumerate the requested differences before editing.
2. Establish or preserve parity for unaffected regions.
3. Implement each requested difference in an isolated, reviewable change.
4. Re-run visual comparison and confirm that differences occur only in the expected regions or states.
5. Report the intentional deviations in the handoff.

Examples:

- “Use the MagicPath card, but make the CTA red” means keep every other color, size, state, asset, and behavior identical.
- “Replace our login form with this design” means use MagicPath for presentation while preserving the app's authentication, validation, pending state, errors, password-manager semantics, and redirects.
- “Make it fit our sidebar” means adapt the surrounding sizing contract without casually changing the component's internal typography or spacing.

Do not let broad goals such as “make it production-ready” erase visual decisions. Add robustness around the design; do not redesign it.

## Visual verification loop

Compilation is necessary but not sufficient. Verify in a real browser:

1. Render MagicPath and local versions at the same viewport, theme, content, and state.
2. Capture screenshots with the same browser and device-pixel ratio when possible.
3. Compare side by side, then use an overlay or image diff when tooling permits.
4. Diagnose the first divergent ancestor rather than patching children randomly.
5. Inspect computed styles and bounding boxes for mismatched regions:
   - font family, weight, size, line height, and letter spacing;
   - width, height, padding, gap, margin, and alignment;
   - color, opacity, border, radius, shadow, and background;
   - icon box, stroke width, image fit, and object position;
   - positioning, transform, clipping, and z-index.
6. Repeat until remaining differences are browser rasterization noise or explicitly approved changes.
7. Verify at least one narrower and one wider viewport without sacrificing the reference viewport.
8. Exercise every meaningful state: hover, focus, pressed, disabled, open/closed, loading, empty, error, validation, success, and reduced motion where applicable.

Also verify console output, failed network requests, missing fonts/assets, hydration warnings, focus behavior, and keyboard operation. A screenshot can match while the component is still broken.

## Common workflows

### Export the selected component to a source folder

1. Run `selection -o json` and capture the component and selected revision IDs.
2. Ensure the destination is empty or use a staging directory.
3. Run `code context <componentId> --revision <revisionId> --dir <destination> -o json`.
4. Inspect asset URLs and imports; localize assets if required for durability.
5. If the user asked for source only, explain that the folder contains Component Forge source, not a standalone app.
6. If the user asked for a runnable export, create the required host project, install compatible dependencies, render the generated top-level component, and verify the build and browser output before calling it runnable.

### Replace an existing React component

1. Resolve and capture the exact MagicPath source and render.
2. Read the existing component, all callers, and its parent layout.
3. Install with `add` when the current registry component identified by `generatedName` is the intended source; otherwise pull the exact revision to staging with `code context` and transplant all required source.
4. Render the new component under a temporary import or route and establish visual parity.
5. Add a compatibility interface for the old component's data and handlers.
6. Verify visuals, behaviors, tests, and responsive states.
7. Swap the parent import and remove the old component only when it is genuinely unused.

### Translate into a non-React application

1. Pull the exact source and visual baseline.
2. Resolve every source token and utility to concrete visual behavior.
3. Recreate the hierarchy, assets, typography, states, and responsive rules using native target-platform patterns.
4. Connect existing target behavior.
5. Compare rendered output at matching dimensions; framework translation is not a reason to accept visual approximation.

### Export several independent designs

Use a separate staging directory per component/revision. `code context` writes shared paths such as `src/App.tsx` and `src/index.css`; reusing one directory can overwrite a previous export. Consolidate common tokens and dependencies only after each component has an independently verified baseline.

## Failure modes

- Exporting the first name match instead of confirming the exact project/component.
- Exporting the current canonical source when the user is viewing a different selected revision.
- Recreating from a screenshot instead of using `inspect` or `code context`.
- Copying one TSX file while omitting generated subcomponents, `index.css`, tokens, fonts, or assets.
- Treating `code context` output as a complete runnable project.
- Running `code start` and creating canvas edit state for a read-only export.
- Pointing `code context` at an existing app root and overwriting entry/style files.
- Refactoring or applying local design-system primitives before a matching baseline exists.
- Replacing exact icons, fonts, colors, or spacing with “similar” local values.
- Preserving appearance while dropping callbacks, validation, loading/errors, accessibility, or analytics.
- Checking only the default desktop state.
- Hiding a parent-layout mismatch with arbitrary child offsets.
- Using expiring selected-image URLs or leaving broken asset paths.
- Calling a requested adaptation successful while unrelated regions also changed.

## Definition of done

Do not report completion until all applicable checks pass:

- The exact intended MagicPath component and revision were used.
- The component matches MagicPath at the reference viewport and theme.
- Fonts, icons, assets, tokens, effects, and interactive states are present.
- Narrower and wider layouts behave intentionally without changing the reference result.
- Required local props, data, navigation, side effects, states, accessibility, and analytics still work.
- The component is actually imported/rendered when `add` was used.
- The application builds and relevant lint/tests pass.
- Browser verification shows no missing resources, runtime errors, or unapproved visual differences.
- Every difference from MagicPath is either required for runtime integration without visual impact or explicitly requested by the user.
- The handoff identifies the MagicPath source, local files changed, verification performed, and intentional deviations.
