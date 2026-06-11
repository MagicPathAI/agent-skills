# Install Flow — Bring MagicPath Designs Into an App

Use this flow when the user wants a MagicPath design installed into their codebase and adapted to production. The source of truth is MagicPath; the destination is the user's app. (The inverse — putting their app's UI onto the canvas — is [Working with repositories](working-with-repositories.md).)

## Phase 1: Discover

1. **Check context** — `npx -y magicpath-ai@experimental context`. If the user pointed at "the selected design", use `selection.components[].generatedName` directly and skip to Phase 2. If they referenced "this project", scope discovery to `activeProjects[0].id`.
2. **Find designs** — `npx -y magicpath-ai@experimental search "<query>"` searches names across every accessible workspace (`--team`, `--personal`, `--project <id>` to narrow). Or browse: `project list` → `component list <projectId>`.
3. **See the canvas** — `project canvas <projectId>` lists everything on a project's canvas (designs + images, with positions). Use `image list <projectId>` URLs or component `previewImageUrl`s to view what things look like.
4. **Understand candidates visually** — results include `previewImageUrl`. Download and analyze these images before recommending a design. They are for your own understanding — don't navigate browsers to them.
5. **Confirm with the user (STOP and wait)** — unless the user gave an exact generatedName, present what you found (name, generatedName, project) and ask if it's right. If they want to see it, give them the `url` from the result (or `open <generatedName> --browser` if they ask you to open it). If multiple matches, list them all. **End your response and wait. Do not run `install` or `inspect` yet.**

## Phase 2: Understand the target context

> Skipping this phase produces components that look right but behave wrong.

6. **Inspect the design source** — `npx -y magicpath-ai@experimental inspect <generatedName>` returns the source without writing files. Identify what it renders, what props it expects, and its layout assumptions (fixed widths, absolute positioning).
7. **Read the target codebase** — before installing, read the file(s) where the component will live:
   - **Existing functionality**: if replacing a component, list every callback, state, API call, navigation, validation, and side effect the old one handles. Each must be preserved or consciously addressed.
   - **Layout context**: parent flex/grid behavior, breakpoints, spacing.
   - **Data flow**: what props/context/state the surrounding code provides and expects back.
   - **Design system**: the project's styling patterns (Tailwind, CSS modules, theme tokens) — the installed component must harmonize.

### Applying a theme (if applicable)

If the user references a brand or design system:

1. `npx -y magicpath-ai@experimental theme list` (add `--team <name>` for team themes), then `theme get <idOrName>`.
2. Follow the `prompt` field if present — natural-language styling instructions from the designer.
3. Apply the `light`/`dark` CSS variable maps instead of hardcoded colors: `bg-[var(--background)]`, `text-[var(--primary)]`. Respect `defaultTheme`.
4. If the theme includes `fonts`, ensure the project loads them and references the font variables.
5. **Non-React/JS projects**: theme data is a reference, not a stylesheet — translate values into the platform's native patterns (SwiftUI `Color` assets, Android theme XML, …).

## Phase 3: Install and adapt

8. **Install** — `npx -y magicpath-ai@experimental install <generatedName>` writes the files to `src/components/magicpath/<name>/` and installs npm dependencies. **React/TypeScript projects only** — for other stacks, use `inspect` and recreate in the target language. Use `--force` to replace existing files, `--dry-run` to preview.
9. **Adapt for production** — MagicPath designs are design artifacts; you MUST edit them:
   - **Responsive**: replace hardcoded sizes (`w-[300px]`) with fluid utilities (`w-full max-w-sm`, breakpoints).
   - **Real interactivity**: replace placeholders with actual props, state, and handlers. A "Submit" button needs `onClick` and a loading state; a form needs validation and `onSubmit`.
   - **Real data**: wire to the app's props/context/API — no leftover mock data.
   - **Preserve existing functionality** when replacing a component — audit every feature of the old one (errors, loading, a11y, keyboard nav, analytics).
   - **Match the project's patterns** for state, errors, and styling.

## Phase 4: Integrate

10. **Import and render** — use the `importStatement` from the install result. Never copy the component's JSX into the parent; import it.
11. **Verify layout fit** — check the component doesn't overflow, create gaps, or break responsive flow in its parent.

## Design-to-production mindset

A MagicPath design tells you WHAT to build; your job is to make it WORK.

| Design artifact | Your job |
|---|---|
| Fixed width `w-[400px]` | `w-full max-w-md` or breakpoints |
| Static text "John Doe" | `{user.name}` |
| `onClick={() => {}}` | `onClick={handleSubmit}` |
| Hardcoded list of 3 items | `{items.map(…)}` |
| No error/loading states | Spinners, error boundaries, empty states |
| No a11y attributes | `aria-*`, roles, keyboard handlers, focus management |
| Desktop-only layout | Breakpoints, mobile navigation patterns |
| Decorative `src="/photo.jpg"` | Real assets or proper placeholders |

## Common scenarios

**Replacing an existing component**: read the old component thoroughly (every prop, callback, validation, side effect) → `inspect` the design → `install` it → edit it to accept the same props/callbacks → verify feature parity → swap the import in the parent; the parent should barely change.

**Building a page from a design library**: browse with `component list <projectId>` → plan the page layout, mapping designs to sections → `install` one at a time → build the page importing each → adapt each (responsive, real data, routing, state) → ensure consistent spacing/typography/color.

**Using a design as inspiration**: `inspect` the source → understand the design intent (colors, spacing, structure, typography) → build something custom following the same design language.
