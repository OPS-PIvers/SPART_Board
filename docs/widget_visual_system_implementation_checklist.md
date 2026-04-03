# Widget Visual System Implementation Checklist

## Purpose

Turn the visual-system roadmap into a concrete execution checklist with PR-sized tasks.

Use this alongside:

- [widget_visual_system_execution_roadmap.md](/workspaces/SPART_Board/docs/widget_visual_system_execution_roadmap.md)
- [widget_transparency_remediation_plan.md](/workspaces/SPART_Board/docs/widget_transparency_remediation_plan.md)
- [widget_settings_alignment_audit.md](/workspaces/SPART_Board/docs/widget_settings_alignment_audit.md)

---

## Overall Sequence

1. Finish transparency foundation work.
2. Build shared appearance primitives.
3. Migrate pilot widgets.
4. Migrate high-visibility widgets.
5. Migrate secondary widgets.
6. Document intentional exceptions.

---

## Phase 0 Checklist: Shared Decisions

### Product decisions

- [ ] Confirm final quick-pick text color set.
- [ ] Confirm final quick-pick card/surface color set.
- [ ] Confirm final `8-10` font list.
- [ ] Confirm final text-size preset labels:
  - [ ] `small`
  - [ ] `medium`
  - [ ] `large`
  - [ ] `x-large`
- [ ] Confirm whether all text-bearing widgets should support text color, or only those with meaningful user-facing text customization.
- [ ] Confirm which low-priority widgets should remain on universal-only controls.

### Technical decisions

- [ ] Confirm shared config field names:
  - [ ] `fontFamily`
  - [ ] `fontColor`
  - [ ] `textSizePreset`
  - [ ] `cardColor`
  - [ ] `cardOpacity`
- [ ] Confirm how legacy numeric size controls map to text-size presets.
- [ ] Confirm whether existing widget-specific color fields should be migrated or aliased.

### Exit criteria

- [ ] Visual control vocabulary is agreed.
- [ ] No conflicting font/color/size standards remain undefined.

---

## Phase 1 Checklist: Transparency Foundation

### PR A1: Transparency audit refresh

- [ ] Re-audit all widgets for full-size opaque roots.
- [ ] Classify each offender:
  - [ ] root opaque fill
  - [ ] `contentClassName` opaque fill
  - [ ] state-specific opaque fill
  - [ ] media/canvas stage fill
  - [ ] acceptable localized surface
- [ ] Update the transparency plan if any new offenders are found.

### PR A2: Shared transparency guidance

- [ ] Ensure widget-root transparency guidance is documented.
- [ ] Confirm the new-widget skill already reflects transparent-root rules.
- [ ] Add any missing local code comments or architecture notes if needed.

### PR A3: Low-risk transparency fixes

- [ ] Breathing
- [ ] Activity Wall
- [ ] Talking Tool
- [ ] Countdown
- [ ] Car Rider Pro loading state

For each widget:

- [ ] remove full-size opaque root/background
- [ ] keep localized readability surfaces only where needed
- [ ] verify transparency in default and alternate states

### PR A4: Media/stage transparency fixes

- [ ] Hotspot Image
- [ ] Webcam
- [ ] Music

For each widget:

- [ ] remove unnecessary shell-level opaque fill
- [ ] keep overlays localized to the media/stage
- [ ] verify loading/overlay/subview states

### PR A5: Canvas/tool transparency fixes

- [ ] Number Line
- [ ] Math Tools
- [ ] QR Widget
- [ ] Seating Chart

For each widget:

- [ ] remove or soften full-widget opaque surfaces
- [ ] keep stage/canvas readability where justified
- [ ] verify small and large widget sizes

### Phase 1 validation

- [ ] Manual QA on low/medium/high transparency for each remediated widget.
- [ ] Verify alternate states:
  - [ ] loading
  - [ ] empty
  - [ ] error
  - [ ] alternate modes/subviews
- [ ] Run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

### Phase 1 exit criteria

- [ ] Transparency is visibly meaningful in all known offender widgets.
- [ ] No known unplanned full-widget opaque roots remain.
- [ ] New widgets are guided toward transparent roots by default.

---

## Phase 2 Checklist: Shared Appearance Primitives

### PR B1: TypographySettingsV2

- [ ] Create or upgrade shared typography settings component.
- [ ] Support `8-10` font options.
- [ ] Support `6-10` quick text colors.
- [ ] Include black quick-select.
- [ ] Include white quick-select.
- [ ] Add custom text color picker.
- [ ] Add optional reset/default behavior if needed.

### PR B2: SurfaceColorSettings

- [ ] Create shared surface/card color settings component.
- [ ] Support `6-10` quick surface colors.
- [ ] Add custom color picker.
- [ ] Add optional opacity control.
- [ ] Build a stronger curated palette, not pastel-first.
- [ ] Add a preview chip/card state in the settings UI.

### PR B3: TextSizePresetSettings

- [ ] Create shared text-size preset control.
- [ ] Add presets:
  - [ ] `small`
  - [ ] `medium`
  - [ ] `large`
  - [ ] `x-large`
- [ ] Define shared config field `textSizePreset`.
- [ ] Document expected widget-side mapping behavior.

### PR B4: Type/config normalization

- [ ] Add `textSizePreset` where needed in `types.ts`.
- [ ] Normalize font/color/surface field usage where practical.
- [ ] Avoid unnecessary field churn for strongly widget-specific fields.

### PR B5: Settings shell sanity pass

- [ ] Confirm transparency remains universal in `SettingsPanel`.
- [ ] Confirm shared appearance controls are designed to live in the style tab.
- [ ] Avoid duplicating universal transparency in widget-specific appearance UIs.

### Phase 2 validation

- [ ] Verify shared controls render cleanly in the settings panel.
- [ ] Verify color pickers and quick picks stay in sync.
- [ ] Verify presets are reusable across multiple widget config shapes.
- [ ] Run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

### Phase 2 exit criteria

- [ ] Shared appearance primitives exist.
- [ ] Shared appearance primitives are approved for broader rollout.
- [ ] Config vocabulary is stable enough for pilot migrations.

---

## Phase 3 Checklist: Pilot Widget Migration

### PR C1: Text widget

- [ ] Replace/upgrade shared typography usage to new standard.
- [ ] Add black and white quick text colors.
- [ ] Add custom text color picker.
- [ ] Expand font choices to target set.
- [ ] Replace numeric-only size control with shared preset model, or clearly bridge it.
- [ ] Revisit sticky-note background options if they conflict with the new card/surface direction.

### PR C2: Checklist widget

- [ ] Migrate font controls to shared typography standard.
- [ ] Migrate font colors to shared text-color standard.
- [ ] Migrate card colors to shared surface-color standard.
- [ ] Map `scaleMultiplier` to `textSizePreset`.
- [ ] Ensure card opacity remains supported.

### PR C3: Schedule widget

- [ ] Replace local font controls with shared typography standard.
- [ ] Add text color control if the widget text should be customizable.
- [ ] Replace raw card color picker with quick picks + custom picker.
- [ ] Add text-size preset.

### PR C4: Calendar widget

- [ ] Replace local font controls with shared typography standard.
- [ ] Add text color control if the widget text should be customizable.
- [ ] Replace raw card color picker with quick picks + custom picker.
- [ ] Add text-size preset.

### Phase 3 validation

- [ ] Verify each pilot widget responds visually to:
  - [ ] font family
  - [ ] text color
  - [ ] text-size preset
  - [ ] card/surface color
  - [ ] opacity where applicable
- [ ] Verify style tabs feel consistent across all pilot widgets.
- [ ] Run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

### Phase 3 exit criteria

- [ ] Pilot widgets prove the shared appearance model works end to end.
- [ ] Shared controls are stable enough for the broader rollout.

---

## Phase 4 Checklist: High-Visibility Widget Migration

### PR D1: Specialist Schedule + Materials

- [ ] Move appearance-related controls out of general tab where appropriate.
- [ ] Add shared typography controls.
- [ ] Add text-size preset.
- [ ] Add surface-color controls where needed.

### PR D2: Activity Wall + Countdown + Talking Tool

- [ ] Add real appearance tabs where missing or placeholder-only.
- [ ] Add shared typography controls.
- [ ] Add text-size preset.
- [ ] Add surface-color controls where widgets have obvious internal cards/panels.

### PR D3: NextUp + Scoreboard + Poll

- [ ] Add appearance tabs where missing.
- [ ] Add shared typography controls.
- [ ] Add shared surface-color controls where needed.
- [ ] Add text-size preset.

### PR D4: Expectations + Quiz

- [ ] Add aligned appearance surfaces.
- [ ] Ensure settings are not purely front-managed if style customization is expected.
- [ ] Add shared typography controls.
- [ ] Add text-size preset.
- [ ] Add surface-color controls where needed.

### Phase 4 validation

- [ ] Verify all migrated widgets use the style tab for visual controls.
- [ ] Verify no “dead” style settings exist.
- [ ] Verify transparency still behaves correctly after the migration.
- [ ] Run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

### Phase 4 exit criteria

- [ ] The most visible text/card widgets use a consistent appearance model.
- [ ] Placeholder style tabs have been replaced where customization clearly matters.

---

## Phase 5 Checklist: Secondary Widget Migration

### PR E1: Reveal Grid + Graphic Organizer + Concept Web

- [ ] Upgrade typography to shared standard.
- [ ] replace weak/pastel-heavy default surface colors where appropriate.
- [ ] add text-size presets.
- [ ] add surface-color quick picks + custom picker.

### PR E2: Music + Weather + Time Tool + Clock

- [ ] Upgrade typography to shared standard.
- [ ] add text-size presets where meaningful.
- [ ] align background/text quick-pick behavior with shared controls.
- [ ] preserve meaningful widget-specific visual controls.

### PR E3: Syntax Framer + Hotspot Image + Number Line

- [ ] Add typography controls if the widget’s text is meaningfully customizable.
- [ ] Add size preset where needed.
- [ ] Add local surface controls only where they map to real user-facing surfaces.

### PR E4: Random + Soundboard + Url Widget

- [ ] Decide whether each widget truly needs full appearance customization.
- [ ] If yes, add shared typography/surface controls.
- [ ] If no, explicitly leave on lighter styling support.

### Phase 5 validation

- [ ] Verify remaining customizable widgets now use shared controls where appropriate.
- [ ] Verify widget-specific controls still coexist cleanly with shared controls.
- [ ] Run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

### Phase 5 exit criteria

- [ ] Most customizable widgets are aligned.
- [ ] Remaining differences are intentional and justified.

---

## Phase 6 Checklist: Exceptions And Cleanup

### Exception decisions

- [ ] PDF
- [ ] Embed
- [ ] Drawing
- [ ] Car Rider Pro
- [ ] Traffic Light
- [ ] Webcam

For each:

- [ ] explicitly decide whether universal transparency-only controls are enough
- [ ] document the rationale if no richer appearance controls will be added

### Cleanup

- [ ] remove obsolete one-off settings code where replaced by shared primitives
- [ ] remove stale placeholder appearance tabs where no longer needed
- [ ] align any lingering general-tab visual controls into style tabs
- [ ] update skills/guidance if new shared appearance primitives should be required for future widgets

### Final validation

- [ ] spot-check all migrated widgets for settings discoverability
- [ ] verify transparency still works across widgets after appearance rollout
- [ ] verify text-size preset changes are visible on real widget faces
- [ ] verify black and white quick text colors exist in the shared standard
- [ ] verify custom text color and custom surface color pickers exist where required
- [ ] run:
  - [ ] `pnpm run lint`
  - [ ] `pnpm run type-check:all`
  - [ ] `pnpm run format:check`
  - [ ] `pnpm run test`

---

## Fast Progress Tracking

### Milestone 1

- [ ] Transparency foundation complete

### Milestone 2

- [ ] Shared appearance primitives complete

### Milestone 3

- [ ] Pilot widgets complete

### Milestone 4

- [ ] High-visibility widgets complete

### Milestone 5

- [ ] Secondary widgets complete

### Milestone 6

- [ ] Exceptions documented and cleanup complete

---

## Definition Of Done

- [ ] Transparency remediation is complete and stable.
- [ ] Shared appearance primitives exist and are in active use.
- [ ] High-visibility text/card widgets are aligned to the new model.
- [ ] The universal transparency slider remains intact.
- [ ] New-widget guidance covers both transparent-root behavior and shared appearance expectations.
- [ ] Remaining widget exceptions are explicit and intentional.
