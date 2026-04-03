# Widget Visual System Execution Roadmap

## Purpose

Combine the two existing plans into one implementation sequence:

- [widget_transparency_remediation_plan.md](/workspaces/SPART_Board/docs/widget_transparency_remediation_plan.md)
- [widget_settings_alignment_audit.md](/workspaces/SPART_Board/docs/widget_settings_alignment_audit.md)

This roadmap defines what to do first, why that order matters, and how to phase the work so we improve both rendering correctness and settings consistency without unnecessary rework.

---

## Recommended Order

### First: Transparency remediation

Implement the transparency remediation plan first.

Why:

- it fixes a current correctness bug, not just a UX inconsistency,
- it affects the visual foundation that later style controls will depend on,
- it reduces rework by stabilizing widget shells and inner surfaces before we add more appearance options,
- it gives us a clean baseline for evaluating text color, card color, and text-size controls.

### Second: Settings alignment

Implement the settings alignment work after transparency remediation reaches a stable baseline.

Why:

- the appearance system will be easier to design once widget roots and surfaces behave consistently,
- many widgets currently blur the line between widget shell styling and internal content styling,
- fixing transparency first clarifies which surfaces are truly local cards/panels versus accidental full-widget shells.

---

## Guiding Principle

Treat this as a two-layer visual-system project:

1. Layer 1: widget rendering correctness
   - transparency ownership
   - transparent roots
   - localized readability surfaces

2. Layer 2: widget appearance customization
   - text colors
   - fonts
   - card/surface colors
   - text-size presets

Layer 2 should not be built on top of broken Layer 1 behavior.

---

## Phase Plan

## Phase 0: Audit and shared decisions

Goal:

- confirm scope,
- align on shared visual conventions,
- avoid implementing competing standards in parallel.

Deliverables:

- confirm the current transparency offender list,
- confirm the target font list,
- confirm the curated quick-pick text palette,
- confirm the curated quick-pick card/surface palette,
- confirm the shared text-size preset model.

Suggested output:

- keep the two existing docs as the source analysis,
- use this roadmap as the execution sequence,
- optionally add a follow-up implementation checklist doc later if needed.

---

## Phase 1: Transparency foundation

Source:

- [widget_transparency_remediation_plan.md](/workspaces/SPART_Board/docs/widget_transparency_remediation_plan.md)

Goal:

- ensure the widget shell owns transparency,
- remove full-size opaque inner roots that make the transparency slider appear broken.

Key work:

1. Re-audit and classify all current offenders.
2. Establish the transparent-root convention in shared guidance.
3. Fix the confirmed widgets:
   - Breathing
   - Activity Wall
   - Talking Tool
   - Hotspot Image
   - Webcam
   - Number Line
   - Math Tools
   - QR Widget
   - Seating Chart
   - Music
   - Countdown
   - Car Rider Pro loading state
4. Validate loading, empty, error, and alternate states.
5. Update widget creation guidance so new widgets default to transparent roots.

Exit criteria:

- transparency is visibly meaningful across the remediated widgets,
- no known full-size opaque content roots remain unplanned,
- new-widget guidance already enforces the transparent-root rule.

Dependency note:

Do not begin broad appearance-control rollout before this phase is materially complete.

---

## Phase 2: Shared appearance primitives

Source:

- [widget_settings_alignment_audit.md](/workspaces/SPART_Board/docs/widget_settings_alignment_audit.md)

Goal:

- build the reusable settings components and shared config vocabulary before migrating many widgets individually.

Key work:

1. Introduce `TypographySettingsV2`
   - 8-10 font options
   - 6-10 quick text colors
   - includes black and white
   - custom text color picker

2. Introduce `SurfaceColorSettings`
   - 6-10 quick card/surface colors
   - custom color picker
   - optional opacity
   - stronger curated palette, not weak pastel defaults

3. Introduce `TextSizePresetSettings`
   - `small`
   - `medium`
   - `large`
   - `x-large`

4. Normalize config vocabulary where practical
   - prefer `fontFamily`
   - prefer `fontColor`
   - add `textSizePreset`
   - prefer `cardColor`
   - prefer `cardOpacity`

5. Keep transparency in the shared style shell
   - do not duplicate the universal transparency slider in widget-specific tabs

Exit criteria:

- shared primitives exist,
- they are visually and structurally approved,
- at least one or two pilot widgets prove the model works end to end.

Dependency note:

This phase should start only after transparency fixes have clarified which surfaces are legitimate local styling targets.

---

## Phase 3: Pilot widget migration

Goal:

- apply the new appearance model to the strongest candidate widgets first,
- use those implementations as the standard for the rest of the migration.

Recommended pilot widgets:

1. Text
2. Checklist
3. Schedule
4. Calendar

Why these first:

- they are already closest to the target,
- they cover the core patterns we need:
  - text-only editing,
  - text plus cards,
  - card-heavy schedule layouts,
  - card opacity handling,
- they will shape the shared component API for the rest of the rollout.

Key work:

- replace legacy local font controls with shared typography controls,
- replace ad hoc card color controls with shared surface controls,
- convert existing text-size sliders/scales to the shared preset model where possible,
- verify the controls actually affect rendered content.

Exit criteria:

- at least 4 pilot widgets use the shared appearance primitives,
- their style tabs feel consistent,
- the shared API is stable enough for broader migration.

---

## Phase 4: High-visibility alignment rollout

Goal:

- migrate the most user-visible and most obviously inconsistent text/card widgets.

Recommended order:

1. Specialist Schedule
2. Materials
3. Activity Wall
4. Countdown
5. Talking Tool
6. NextUp
7. Scoreboard
8. Poll
9. Expectations
10. Quiz

Why this group:

- these widgets are either visibly inconsistent today,
- or they are text/card heavy enough that users will notice missing style controls immediately,
- or they currently place style controls in the wrong place.

Key work:

- move appearance controls out of general tabs and into style tabs where needed,
- add missing typography controls,
- add missing card/surface controls where the widget clearly contains internal cards or panels,
- add working text-size presets where text density matters.

Exit criteria:

- the most visible text/card widgets now share the same appearance model,
- front-managed widgets no longer hide behind “standard controls only” when they clearly need richer style options.

---

## Phase 5: Secondary alignment rollout

Goal:

- extend the shared appearance model to the remaining widgets where customization is useful but not blocking.

Recommended widgets:

1. Reveal Grid
2. Graphic Organizer
3. Concept Web
4. Music
5. Weather
6. Time Tool
7. Clock
8. Syntax Framer
9. Hotspot Image
10. Number Line
11. Random
12. Soundboard
13. Url Widget

Approach:

- do not force every widget into identical controls,
- apply only the shared controls that fit the widget’s real UI,
- retain widget-specific visual controls where they are meaningful.

Exit criteria:

- most customizable widgets now use shared appearance primitives,
- remaining exceptions are intentional rather than accidental.

---

## Phase 6: Low-priority and exception pass

Goal:

- explicitly decide which widgets should remain on universal-only controls,
- avoid over-engineering widgets that do not benefit from full appearance customization.

Likely lower-priority or exception widgets:

- PDF
- Embed
- Drawing
- Car Rider Pro
- Traffic Light
- Webcam

Rule:

- if a widget is primarily an embedded external surface, document/canvas tool, or utility with little meaningful typography customization, keep transparency universal and do not force a full appearance panel unless there is a real product need.

Exit criteria:

- exceptions are documented,
- the absence of richer appearance controls is a deliberate product choice.

---

## Cross-Phase Rules

### Rule 1: Do not mix shell fixes with style-system expansion blindly

If a widget still has a broken transparency foundation, fix that before adding new appearance controls.

### Rule 2: Shared controls first, mass migration second

Do not hand-roll new one-off font/color panels for each widget during the alignment phase.

### Rule 3: A setting is not done unless it affects render output

If a widget exposes text size, font, text color, or card color:

- the widget face must visibly respond,
- the effect must be easy to verify,
- the setting must not be decorative or dead.

### Rule 4: Style controls belong in the style tab

Typography, text color, text size, card color, card opacity, and theme/surface styling should not remain buried in general tabs once the shared appearance model is in place.

### Rule 5: New widgets must inherit both systems

New widgets should:

- follow the transparent-root rule,
- use the shared appearance primitives when they contain customizable text or internal surfaces.

---

## Suggested PR Slicing

### PR Group A: Transparency fixes

- transparency audit refresh
- transparent-root guidance
- low-risk widgets
- media/stage widgets
- canvas/tool widgets

### PR Group B: Shared appearance infrastructure

- `TypographySettingsV2`
- `SurfaceColorSettings`
- `TextSizePresetSettings`
- shared config/type additions

### PR Group C: Pilot widget migrations

- Text
- Checklist
- Schedule
- Calendar

### PR Group D: High-visibility widget migrations

- Specialist Schedule
- Materials
- Activity Wall
- Countdown
- Talking Tool
- NextUp
- Scoreboard
- Poll
- Expectations
- Quiz

### PR Group E: Secondary widget migrations and exceptions

- remaining aligned widgets
- explicit exception docs or comments where needed

This keeps reviewable chunks small and lowers regression blast radius.

---

## Validation Strategy

### After Phase 1

Validate:

- transparency is visibly meaningful,
- no full-widget opaque content roots remain in remediated widgets,
- alternate widget states also respect transparency.

### After Phase 2

Validate:

- shared controls are reusable,
- palettes and font choices are approved,
- text-size presets actually map into real render changes.

### After widget migration phases

Validate each migrated widget for:

- style tab discoverability,
- text color actually changing rendered text,
- card/surface color actually changing rendered surfaces,
- text-size preset actually changing rendered content,
- transparency still behaving correctly after style controls are applied.

### Quality gates

- `pnpm run lint`
- `pnpm run type-check:all`
- `pnpm run format:check`
- `pnpm run test`

Add targeted widget tests where practical as the shared appearance system lands.

---

## Definition Of Done

This combined roadmap is complete when:

1. Transparency remediation is complete and stable.
2. Shared appearance primitives exist and are adopted.
3. The high-visibility text/card widgets use the aligned settings model.
4. The universal transparency slider remains intact.
5. New-widget guidance reflects both the transparent-root rule and the shared appearance system.
6. Remaining exceptions are documented and intentional.

---

## Bottom Line

The work should proceed in this order:

1. Fix widget transparency behavior first.
2. Build shared appearance primitives second.
3. Migrate pilot widgets third.
4. Roll the aligned settings model across high-visibility widgets next.
5. Finish with secondary widgets and explicit exceptions.

That sequence gives us the cleanest foundation, the least rework, and the most coherent end-state.
