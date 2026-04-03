# Widget Transparency Remediation Plan

## Problem Summary

The transparency slider is applied at the widget window level in `DraggableWindow`, but several widgets render a second, full-size inner surface with an opaque background such as `bg-white`, `bg-slate-50`, `bg-slate-900`, or `bg-black`.

That creates a visual trap:

- the outer widget shell becomes transparent,
- but the user still sees a nearly solid interior,
- so the transparency control appears broken or inconsistent.

This is not a `WidgetLayout` problem by itself. The issue happens when the widget content root, or another full-bleed child inside it, paints an opaque surface that spans the available content area.

---

## Goal

Make widget-level transparency controls behave consistently and predictably by ensuring the widget window shell owns the primary background treatment, while widget internals only add localized surfaces where readability or feature semantics actually require them.

---

## Root Cause Rule

Treat this as the governing rule for all widgets:

- `DraggableWindow` owns overall transparency.
- `WidgetLayout` should remain structurally neutral.
- The first full-size widget content layer should default to `bg-transparent`.
- Any background added inside the widget must be intentional, localized, and justified.

In practice, a widget is at risk when it has any of the following:

- a root `div` with `w-full h-full` plus an opaque background class,
- a `contentClassName` on `WidgetLayout` that adds an opaque background,
- a state-specific full-bleed layer for loading, empty, or error states,
- a media/canvas wrapper that fills the widget and paints a solid backdrop.

---

## Scope

### Confirmed widgets in scope

These widgets currently contain a full-size or effectively full-size interior background that can negate the intended transparency effect:

1. Breathing
2. Activity Wall
3. Talking Tool
4. Hotspot Image
5. Webcam
6. Number Line
7. Math Tools
8. QR Widget
9. Seating Chart
10. Music (Spotify mode)
11. Countdown

### State-specific issues also in scope

1. Car Rider Pro loading state

### Important note

This should not be treated as a closed list. The remediation work should include a fresh audit pass across all widgets before implementation is considered complete. The current list is the known set, not the guaranteed final set.

---

## Desired End State

After remediation:

- lowering transparency should visibly reveal the board/background through the widget interior,
- widgets should still remain readable and usable,
- media-heavy widgets may keep localized overlays where appropriate,
- loading and empty states should respect transparency the same way as primary states,
- new widgets should follow the same pattern by default so this does not regress.

---

## Approved Design Patterns

### Pattern A: Transparent root

Use a transparent root for the main widget content area:

- `h-full w-full bg-transparent`
- keep layout, spacing, and overflow behavior as needed
- avoid using a solid background on this layer

### Pattern B: Local readability surfaces

If content becomes hard to read on varied board backgrounds, add smaller surfaces only around the content that needs support:

- cards
- chips
- labels
- control bars
- footers
- image frames
- modal-like overlays

Preferred examples:

- `bg-white/70`
- `bg-slate-50/80`
- `bg-black/20`
- `backdrop-blur-sm`
- bordered panels that do not occupy the full widget

### Pattern C: Semantically justified full-area surface

If a feature truly needs a dedicated stage area, keep that surface visually distinct from the widget shell and avoid making it a hard opaque slab unless necessary for the feature:

- prefer translucent or softly tinted treatment first,
- if opacity is required, constrain it to the actual stage/canvas/media frame rather than the entire widget root,
- document why the exception is necessary.

This exception should be rare.

---

## Anti-Patterns To Remove

These should be treated as remediation targets:

- `WidgetLayout` content root or `contentClassName` using `bg-white`, `bg-slate-50`, `bg-slate-900`, `bg-slate-950`, or `bg-black`
- widget root containers using `w-full h-full ... bg-*`
- full-size empty/loading states with opaque backgrounds
- full-canvas media wrappers that always paint a solid backdrop
- rounded opaque inner shells that visually replace the window shell

`Countdown` is a clear example of this issue today: its root content container uses a full-size `bg-white rounded-3xl`, which visually masks the outer window transparency.

---

## Implementation Strategy

### Phase 1: Re-audit and classify

Before edits begin, perform a fast source audit and classify every finding into one of these buckets:

1. Root opaque fill
2. `WidgetLayout` `contentClassName` opaque fill
3. State-specific opaque fill
4. Media/canvas stage fill
5. Acceptable localized surface

For each in-scope widget, note:

- the file,
- the offending class or style,
- whether it is always rendered or state-specific,
- the proposed replacement pattern.

This step prevents us from fixing only the currently obvious cases.

### Phase 2: Establish a widget-root convention

Add a short documentation comment near `WidgetLayout` usage conventions, or in local widget architecture docs, stating:

- the widget shell owns transparency,
- widget roots should be transparent by default,
- opaque fills belong only on localized sub-surfaces.

If helpful, introduce a small shared class or helper convention for widget roots, but this is optional. The important part is consistency, not abstraction for its own sake.

### Phase 3: Remediate widget-by-widget

#### 1. Breathing

- Replace root `bg-slate-50 dark:bg-slate-900` with `bg-transparent`.
- Keep the control strip as the local readability surface.
- Verify the breathing visual still feels intentional on busy backgrounds.

#### 2. Activity Wall

- Replace full-size `bg-white` roots with transparent roots.
- Convert empty states to centered cards or panels instead of full-bleed slabs.
- Keep activity cards, chips, and interactive elements on their own local surfaces.

#### 3. Talking Tool

- Replace root `bg-white` with `bg-transparent`.
- Preserve the sidebar and main content panel surfaces where they are doing actual usability work.
- Confirm scroll areas still read clearly without the outer white shell.

#### 4. Hotspot Image

- Replace the full `bg-slate-900` wrapper with a transparent root.
- If needed, keep darkness only around the image stage or hotspot content region.
- Avoid making the entire widget appear opaque when transparency is lowered.

#### 5. Webcam

- Replace the root `bg-slate-950` shell with a transparent root.
- Keep camera overlays, extraction overlays, and photo treatment localized to the media surfaces.
- Confirm live camera, capture gallery, and extracted-text states each respect transparency.

#### 6. Number Line

- Replace the root `bg-white` shell with a transparent root.
- If the line/SVG needs contrast, put a lighter panel behind the number line itself rather than behind the whole widget.
- Check legibility at small sizes and on high-contrast board backgrounds.

#### 7. Math Tools

- Remove `bg-white` from `WidgetLayout` `contentClassName`.
- Keep cards, tool buttons, and control surfaces white where needed.
- Confirm the launcher grid still reads as designed without a full widget-white backdrop.

#### 8. QR Widget

- Avoid a full-size opaque white inner panel unless scanning quality truly demands it.
- Prefer a bounded QR card with padding that does not visually replace the widget shell.
- Preserve QR contrast and scannability while allowing surrounding transparency to show through.

#### 9. Seating Chart

- Replace the canvas root `bg-white` with a transparent or translucent stage.
- If a working surface is necessary, constrain it to the actual canvas region and prefer a softer alpha treatment first.
- Confirm drag/drop, selection, and furniture visibility remain clear.

#### 10. Music (Spotify mode)

- Replace the full-size `bg-black` shell with a transparent root.
- Keep contrast treatment in album art overlays, controls, or text surfaces instead.
- Confirm artwork still feels grounded without reintroducing a hard opaque backdrop.

#### 11. Countdown

- Replace the root full-size `bg-white rounded-3xl` container with a transparent root.
- Keep day cells as local surfaces in grid mode, since those are semantically meaningful and do not represent the full widget background.
- In number mode, add a smaller readability surface only if the title/count loses contrast on busy boards.
- Verify both `number` and `grid` modes respect transparency.

#### 12. Car Rider Pro loading state

- Replace the loading state's full-size `bg-slate-50` fill with a transparent root.
- Use a centered loader chip/card if visual support is needed.
- Confirm the loaded iframe state and loading state feel consistent.

### Phase 4: Handle states, not just default renders

Every remediated widget must be checked in:

1. default state
2. empty state
3. loading state
4. error state
5. alternate modes or subviews

This is especially important for widgets like `Activity Wall`, `Webcam`, `Countdown`, and `Car Rider Pro`, where the problematic background may only appear in some modes.

### Phase 5: Prevent recurrence

To keep this fixed:

- update internal widget guidance so transparent roots are the default expectation,
- include transparency behavior in widget review checklists,
- consider adding a simple grep-based audit script or CI note for common full-size opaque root patterns.

This does not need to be perfect static analysis. Even a lightweight detector for suspicious patterns would reduce regressions.

---

## Suggested Work Breakdown

### PR A: Low-risk root and state fixes

- Breathing
- Activity Wall
- Talking Tool
- Countdown
- Car Rider Pro loading state

### PR B: Media and stage-based widgets

- Hotspot Image
- Webcam
- Music

### PR C: Canvas/tooling widgets

- Number Line
- Math Tools
- QR Widget
- Seating Chart

### PR D: Regression prevention

- add documentation/guidance,
- optionally add an audit script or checklist artifact,
- add or update targeted tests.

This keeps visual regressions easier to isolate and review.

---

## Validation Plan

### Manual QA checklist

For each remediated widget:

1. Add the widget to the board.
2. Test at low, medium, and high transparency values.
3. Confirm the board background is visibly revealed through the widget interior.
4. Confirm any remaining surfaces are localized and intentional.
5. Confirm text and controls remain readable.
6. Confirm core interactions still work.
7. Confirm behavior at small and large widget sizes.
8. Confirm alternate states and modes, not just the default render.

### Widget-specific validation requirements

- `Countdown`: verify both number mode and grid mode.
- `Webcam`: verify live view, extracted text overlay, and gallery overlay.
- `Activity Wall`: verify empty, active, and modal/detail states.
- `QR Widget`: verify the code remains easy to scan.
- `Seating Chart`: verify setup, assign, and interact modes.
- `Car Rider Pro`: verify loading and loaded states.

### Source-level verification

For each remediated widget, confirm:

- no full-size root/background class remains unless explicitly justified,
- no `contentClassName` introduces an opaque widget-wide background,
- no state-specific full-bleed fallback reintroduces the issue.

### Automated quality gates

- `pnpm run lint`
- `pnpm run type-check:all`
- `pnpm run format:check`
- `pnpm run test`

### Recommended automated follow-up

Add targeted tests where practical:

- update unit tests for affected widgets whose root structure changes,
- add at least one Playwright coverage path that exercises transparency on a representative widget from each PR slice,
- add a lightweight source audit check for suspicious full-bleed opaque classes in widget roots.

For E2E, the goal should be confidence rather than pixel perfection. A combination of structural assertions plus a small number of targeted snapshots is enough.

---

## Risk And Mitigation

### Risk: readability drops on busy board backgrounds

Mitigation:

- use smaller translucent cards, chips, or bars,
- add blur sparingly,
- preserve contrast where users actually read or click.

### Risk: media widgets lose visual polish

Mitigation:

- keep overlays attached to the media frame,
- preserve intentional stage treatment,
- remove only the unnecessary full-shell opacity.

### Risk: canvas-based widgets become harder to interpret

Mitigation:

- use a constrained stage surface behind the actual canvas,
- prefer translucent support before opaque white,
- validate interaction affordances in all modes.

### Risk: state-specific regressions are missed

Mitigation:

- test loading, empty, error, and alternate-mode renders explicitly,
- do not sign off based on a single happy-path screenshot.

### Risk: new widgets reintroduce the pattern later

Mitigation:

- document the rule,
- include it in review expectations,
- add a lightweight audit/checklist step.

---

## Definition Of Done

A widget is done when all of the following are true:

- its primary full-size content root is transparent by default,
- no full-widget opaque surface remains unless explicitly justified by feature semantics,
- transparency changes are visibly meaningful during normal use,
- readability issues are handled with localized surfaces rather than a replacement shell,
- loading, empty, error, and alternate modes also respect transparency,
- tests and validation checks pass,
- the widget does not reintroduce the same issue through `contentClassName` or state-specific branches.

The remediation effort as a whole is done only when:

- the current known widgets, including `Countdown`, are fixed,
- a fresh audit pass finds no remaining unplanned offenders,
- documentation or guidance is updated so future widgets follow the same convention.
