# Widget Settings Alignment Audit

## Purpose

Audit the current widget settings and appearance surfaces, document where style controls are inconsistent, and define a single alignment target for typography, card/background styling, transparency, and text-size controls.

This audit is based on:

- the widget settings registry in `components/widgets/WidgetRegistry.ts`,
- the universal style shell in `components/common/SettingsPanel.tsx`,
- the shared typography helper in `components/common/TypographySettings.tsx`,
- representative settings/widget implementations across text-heavy, card-heavy, and front-managed widgets.

---

## Requested Alignment Target

### Any widget with text

1. Provide `6-10` quick-select text colors plus a custom color picker.
2. Include both black and white in the quick-select set.
3. Provide `8-10` typeface options.
4. Provide a default text-size selector that actually changes rendered widget content:
   - `Small`
   - `Medium`
   - `Large`
   - `Extra Large`

### Any widget with inner cards/buttons/surfaces

5. Provide `6-10` quick-select internal card/background colors plus a custom color picker.
6. Replace weak pastel-heavy defaults with a stronger, more intentional palette.

### All widgets

7. Keep the universal transparency slider.

---

## Current Baseline

### What is already standardized

The transparency slider is already universal in the style tab through [components/common/SettingsPanel.tsx:226](/workspaces/SPART_Board/components/common/SettingsPanel.tsx#L226). This should stay.

### What is partially standardized

There is already a shared typography helper in [components/common/TypographySettings.tsx](/workspaces/SPART_Board/components/common/TypographySettings.tsx), but it is too limited for the desired standard:

- only 4 font options from [config/fonts.ts](/workspaces/SPART_Board/config/fonts.ts),
- only 7 text colors,
- no white quick-select,
- no custom color picker,
- no shared size preset control.

### What is not standardized

- Some widgets have dedicated appearance tabs, others do not.
- Some widgets put style controls in the general settings tab instead of the style tab.
- Typography controls vary wildly between widgets.
- Card/background controls vary wildly between widgets.
- Text-size controls are implemented in several different ways, and many widgets have none.

---

## Top-Level Findings

### 1. Appearance coverage is inconsistent

Only a subset of widgets register dedicated appearance components in `WIDGET_APPEARANCE_COMPONENTS`.

Current widgets with dedicated appearance tabs:

- Clock
- Time Tool
- Text
- Checklist
- Sound
- Weather
- Schedule
- Calendar
- Instructional Routines
- Music
- Breathing
- Concept Web
- Graphic Organizer
- Hotspot Image
- Reveal Grid
- Syntax Framer
- Starter Pack
- Activity Wall

That leaves many visible, text-bearing widgets with either:

- no dedicated appearance controls,
- only generic fallback style controls,
- or style controls mixed into the general tab.

### 2. Typography is fragmented

Current patterns in the repo:

- `TypographySettings` shared helper: 4 fonts, 7 colors, no white, no custom picker.
- Widget-local button grids: usually 4 fonts.
- Widget-local `<select>` controls: some widgets already expose 8-10 fonts.
- Some widgets expose text color.
- Many text-bearing widgets expose no text color at all.

This means the user experience is inconsistent even before we address missing controls.

### 3. Card/background styling is fragmented and often low quality

Current patterns:

- `Schedule` and `Calendar` use raw `input[type="color"]` for card color.
- `Checklist` uses a quick palette plus opacity, which is closer to the desired direction.
- `RevealGrid` uses custom color pickers but defaults to soft pastel-like values.
- `TextWidget` still uses sticky-note colors.
- `Music` has a tiny hand-picked background set.
- Several widgets with obvious internal cards expose no surface styling at all.

The palette quality is inconsistent, and the repo currently mixes:

- washed-out education pastels,
- hard-coded one-off colors,
- partial quick palettes,
- and color pickers without curated quick choices.

### 4. “Text size” is not standardized

Current patterns:

- numeric pixel slider: `TextWidget`
- scalar multiplier slider: `Checklist`, `InstructionalRoutines`
- no size control at all: many text-bearing widgets
- local layout toggles that affect density but are not a real size system: some widgets

There is no shared meaning for “small / medium / large / extra large,” and many widgets cannot be resized typographically from settings at all.

### 5. Some style systems live outside the style tab

Examples:

- `SpecialistSchedule` typography and card styling live in the general tab.
- `MaterialsWidget` title font and title color also live in general settings.
- some front-managed widgets effectively have no aligned appearance surface in the back-face settings at all.

This breaks discoverability and makes the settings experience feel random.

---

## Widget-By-Widget Audit

Status legend:

- `Good base`: already has a meaningful style surface but needs standardization.
- `Partial`: has some styling controls, but they do not meet the target.
- `Missing`: text/surfaces exist, but the current settings surface does not meaningfully support the target.
- `N/A`: little or no meaningful appearance surface expected in current scope.

| Widget                                     | Current state | Audit notes                                                                                                                                                                                             | Recommended action                                                                                                 |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Clock                                      | Partial       | Appearance tab exists. 4 fonts, quick theme colors, no text color picker, no size preset.                                                                                                               | Move to shared typography standard and add size preset.                                                            |
| Time Tool                                  | Partial       | Appearance tab exists, but style focus is mode/theme; typography is still limited.                                                                                                                      | Add full typography standard and size preset.                                                                      |
| Text                                       | Good base     | Uses shared typography + font size slider. Still missing white quick-select, custom text color picker, expanded font set. Background is sticky-note based, not aligned with new card palette direction. | Upgrade shared typography and align background palette.                                                            |
| Checklist                                  | Good base     | Has text scale, font family, font color, card color, card opacity. Still limited font count/color set and no custom pickers.                                                                            | Use as one of the primary migration references after standardization.                                              |
| Weather                                    | Partial       | Uses shared typography helper. No size preset. No card/surface styling despite text-heavy content.                                                                                                      | Upgrade typography helper and add text-size preset if content remains text-dense.                                  |
| Schedule                                   | Good base     | Appearance tab exists with font family, card color, opacity. No text color, no quick card palette, no text-size preset.                                                                                 | Strong candidate for the target card-surface standard.                                                             |
| Calendar                                   | Good base     | Appearance tab exists with font family, card color, opacity. No text color, no quick card palette, no size preset.                                                                                      | Strong candidate for the target card-surface standard.                                                             |
| Specialist Schedule                        | Partial       | Has font family and card color/opacity, but these live in the general tab rather than a dedicated appearance tab. No text color or size preset.                                                         | Move appearance controls into a style tab and align to shared controls.                                            |
| Materials                                  | Partial       | Has title font and title color only, in general settings. No dedicated appearance tab, no size preset, no body typography controls.                                                                     | Add style tab with text color, expanded font set, and text-size preset.                                            |
| Music                                      | Partial       | Appearance tab exists with background and text color quick picks. No custom color picker. No font controls. No size preset.                                                                             | Add shared typography controls and align background controls.                                                      |
| Breathing                                  | Partial       | Appearance tab exists, but it is primarily a color picker for the breathing visual. Text styling is minimal.                                                                                            | Keep visual color control, add text-size standard only if visible text remains meaningful.                         |
| Reveal Grid                                | Partial       | Has font family select and custom card color pickers. Defaults are pastel-heavy. No text color control. No size preset.                                                                                 | Replace palette defaults, add quick card colors + custom, add text color + size preset.                            |
| Graphic Organizer                          | Partial       | Appearance tab has font family only. Widget has lots of text and obvious card/panel surfaces.                                                                                                           | Add text color, size preset, and card/surface controls where appropriate.                                          |
| Concept Web                                | Partial       | Appearance tab has font family only. Nodes clearly contain editable text and colored surfaces.                                                                                                          | Add text color, node/card quick colors + custom, and text-size preset.                                             |
| Syntax Framer                              | Partial       | Appearance tab exists but is focused on interaction behavior, not full typography standard.                                                                                                             | Add aligned typography and size controls if text remains user-visible.                                             |
| Hotspot Image                              | Partial       | Appearance tab exists but is mode-driven. Callout text and panels do not have aligned typography/card controls.                                                                                         | Add text color/font/size where hotspot labels and content are user-facing.                                         |
| Activity Wall                              | Missing       | Appearance tab explicitly says to use standard window controls only. Widget itself is text-heavy with lots of cards/chips.                                                                              | Add a real appearance tab with card palette, text palette, and text-size preset.                                   |
| Starter Pack                               | Missing       | Appearance tab explicitly says no additional style settings.                                                                                                                                            | Likely low priority unless visible student-facing styling expands.                                                 |
| Quiz                                       | Missing       | Back-face settings are minimal and do not expose aligned appearance controls. Any current visual styling lives elsewhere and is not standardized through settings.                                      | Add a proper appearance tab if the widget remains text/card-heavy and customizable.                                |
| Countdown                                  | Missing       | Has text-heavy number/grid presentation but no appearance tab.                                                                                                                                          | Add typography controls and a size preset. Add cell/background styling only if the grid remains user-customizable. |
| Talking Tool                               | Missing       | Text-heavy, card-heavy interface with no dedicated appearance tab.                                                                                                                                      | Add full typography standard and card-surface controls.                                                            |
| Number Line                                | Missing       | Text-bearing instructional widget with no aligned appearance tab.                                                                                                                                       | Add text-size preset and typography if user customization is expected.                                             |
| QR Widget                                  | Missing       | Minimal settings only. URL and QR surface are visible, but style controls are absent.                                                                                                                   | Low-to-medium priority; if kept customizable, add label text controls and QR card-surface controls.                |
| Scoreboard                                 | Missing       | Multi-card and text-heavy, but current settings appear focused on team data rather than aligned styling.                                                                                                | Add typography, card colors, and size preset.                                                                      |
| NextUp                                     | Missing       | Card/text-heavy live queue with no aligned appearance tab. Theme color exists in config, but not as a standardized settings surface.                                                                    | Add dedicated appearance tab and migrate theme controls into shared model.                                         |
| Poll                                       | Missing       | Visible text-heavy voting UI, no aligned appearance tab in current settings surface.                                                                                                                    | Add typography and size preset.                                                                                    |
| Expectations                               | Missing       | Text-heavy instructional widget without a dedicated appearance tab in the registry.                                                                                                                     | Add typography and size preset.                                                                                    |
| Random                                     | Missing       | Highly visible text results but no aligned appearance tab.                                                                                                                                              | Add typography and size preset if customization is desired.                                                        |
| Url Widget                                 | Missing       | Color exists for links, but no aligned text/style tab.                                                                                                                                                  | Add only if this widget should support richer style customization.                                                 |
| Soundboard                                 | Missing       | Labels and tiles are visible, but style controls are not aligned.                                                                                                                                       | Add card color/text options if visual customization is in scope.                                                   |
| Seating Chart                              | Missing       | Lots of internal surfaces, but style controls are operational rather than visual.                                                                                                                       | Lower priority for typography, medium priority for canvas/card surfaces if customization is wanted.                |
| Webcam                                     | Missing       | Mostly media-focused; overlays contain text but may not need full styling.                                                                                                                              | Likely lower priority; size/text styling only if overlay customization is intended.                                |
| Embed                                      | N/A           | Primarily external content.                                                                                                                                                                             | Keep universal transparency only unless overlay chrome becomes customizable.                                       |
| PDF                                        | N/A           | Primarily document rendering.                                                                                                                                                                           | Keep universal transparency only.                                                                                  |
| Drawing                                    | N/A           | Tool surface rather than text/card-centric widget.                                                                                                                                                      | Keep universal transparency only.                                                                                  |
| Car Rider Pro                              | N/A           | Embedded product surface.                                                                                                                                                                               | Keep universal transparency only.                                                                                  |
| Traffic Light                              | N/A           | Minimal text styling needs.                                                                                                                                                                             | Keep universal transparency only.                                                                                  |
| Dice / Sound / QR / simple utility widgets | Mixed         | Some have tiny appearance surfaces, but most are not aligned to the requested standard.                                                                                                                 | Prioritize only if user-facing text is central to the experience.                                                  |

---

## Specific Gaps Against The Requested Standard

### Requirement 1: `6-10` quick text colors + custom color picker

Current state:

- shared typography helper does not meet this,
- many widgets do not expose text color at all,
- white is missing from the shared font color set,
- custom text color pickers are generally absent.

Assessment:

- not aligned

### Requirement 2: `8-10` typeface options

Current state:

- shared typography helper only has 4 fonts,
- Clock/Schedule/Calendar/Checklist/Materials/Specialist Schedule all effectively use the same 4-font pattern,
- Graphic Organizer, Concept Web, and Reveal Grid already prove that larger font sets are viable.

Assessment:

- not aligned

### Requirement 3: `6-10` quick internal card colors + custom color picker

Current state:

- `Checklist` is closest structurally,
- `Schedule` and `Calendar` rely on raw custom picker only,
- `RevealGrid` exposes custom colors but defaults are weak,
- many card-heavy widgets have no card-surface styling in settings.

Assessment:

- not aligned

### Requirement 4: Keep transparency slider

Current state:

- already aligned globally in `SettingsPanel`

Assessment:

- aligned

### Requirement 5: default text size selector that changes content

Current state:

- some widgets have working numeric/scale controls,
- many have no text-size control,
- there is no shared preset system,
- the current UX is not discoverable or consistent.

Assessment:

- not aligned

---

## Recommended Standard

### 1. Introduce `TypographySettingsV2`

Shared control group for any widget with visible text.

Fields:

- `fontFamily`
- `fontColor`
- `textSizePreset`

Font options:

1. `Inherit`
2. `Sans`
3. `Serif`
4. `Mono`
5. `Handwritten`
6. `Comic`
7. `Rounded`
8. `Slab`
9. `Marker`
10. `Retro`

Quick text colors:

1. Black
2. White
3. Slate
4. Blue
5. Indigo
6. Red
7. Orange
8. Green
9. Teal
10. Pink or Purple

Also include:

- `input[type="color"]` custom picker
- visible swatch preview
- optional reset-to-default action

### 2. Introduce `SurfaceColorSettings`

Shared control group for widgets with internal cards, pills, panels, or tiles.

Fields:

- `surfaceColor`
- `surfaceOpacity` where applicable

Quick card/surface palette should be stronger and less pastel-biased. Suggested direction:

1. White
2. Slate-50
3. Slate-100
4. Amber-100
5. Blue-100
6. Emerald-100
7. Rose-100
8. Indigo-100

Also include:

- custom color picker
- optional opacity slider
- preview chip/card

Important:

- do not default to washed-out classroom pastels as the primary experience
- allow curated, readable surfaces first
- reserve novelty palettes for optional overrides

### 3. Introduce `TextSizePresetSettings`

Shared preset:

- `small`
- `medium`
- `large`
- `x-large`

Implementation guidance:

- each widget maps the preset to its own render scale
- do not store raw pixels as the primary shared model
- preserve widget-specific layout intelligence while standardizing the user-facing control

Suggested config field:

- `textSizePreset?: 'small' | 'medium' | 'large' | 'x-large'`

Widgets that currently use numeric sliders or scale multipliers can internally map:

- `small` -> `0.85`
- `medium` -> `1`
- `large` -> `1.15`
- `x-large` -> `1.3`

### 4. Keep transparency universal

Do not duplicate the transparency slider in widget-specific appearance panels.

Keep it where it already lives:

- shared style tab in `SettingsPanel`

### 5. Move visual controls into the style tab consistently

If a control changes:

- font family,
- text color,
- text size,
- card color,
- card opacity,
- theme/surface colors,

it belongs in the appearance/style surface, not buried in general settings.

---

## Recommended Rollout Priority

### Phase 1: Build the shared controls

1. `TypographySettingsV2`
2. `SurfaceColorSettings`
3. `TextSizePresetSettings`

### Phase 2: Upgrade the strongest existing candidates

These should become the model implementations:

1. Text
2. Checklist
3. Schedule
4. Calendar
5. Specialist Schedule
6. Materials

### Phase 3: Upgrade the most obviously inconsistent text/card widgets

1. Activity Wall
2. Countdown
3. Talking Tool
4. NextUp
5. Scoreboard
6. Poll
7. Expectations
8. Quiz

### Phase 4: Upgrade secondary widgets where customization still matters

1. Reveal Grid
2. Graphic Organizer
3. Concept Web
4. Music
5. Weather
6. Time Tool
7. Clock

### Phase 5: Leave utility/media widgets on universal controls unless needed

Examples:

- PDF
- Embed
- Car Rider Pro
- Traffic Light
- Webcam
- Drawing

---

## Concrete Implementation Notes

### Shared config pressure

The repo already contains multiple related style fields in `types.ts`, including:

- `fontFamily`
- `fontColor`
- `cardColor`
- `cardOpacity`
- `scaleMultiplier`
- `themeColor`
- `bgColor`
- `textColor`

The problem is not lack of fields. The problem is inconsistent adoption and inconsistent naming across widgets.

### Recommended normalization direction

Prefer a small common vocabulary:

- `fontFamily`
- `fontColor`
- `textSizePreset`
- `cardColor`
- `cardOpacity`

Retain widget-specific fields only where necessary:

- `themeColor`
- `defaultCardColor`
- `defaultCardBackColor`
- widget-specific visual mode fields

### Existing code that is a good starting point

- universal transparency: [components/common/SettingsPanel.tsx](/workspaces/SPART_Board/components/common/SettingsPanel.tsx)
- shared typography helper: [components/common/TypographySettings.tsx](/workspaces/SPART_Board/components/common/TypographySettings.tsx)
- stronger appearance structure candidates:
  - [components/widgets/Checklist/Settings.tsx](/workspaces/SPART_Board/components/widgets/Checklist/Settings.tsx)
  - [components/widgets/Schedule/Settings.tsx](/workspaces/SPART_Board/components/widgets/Schedule/Settings.tsx)
  - [components/widgets/Calendar/Settings.tsx](/workspaces/SPART_Board/components/widgets/Calendar/Settings.tsx)

### Existing code that highlights the inconsistency

- 4-font shared baseline: [config/fonts.ts](/workspaces/SPART_Board/config/fonts.ts)
- front-managed widget with effectively no aligned appearance surface:
  - [components/widgets/ActivityWall/Settings.tsx](/workspaces/SPART_Board/components/widgets/ActivityWall/Settings.tsx)
  - [components/widgets/QuizWidget/Settings.tsx](/workspaces/SPART_Board/components/widgets/QuizWidget/Settings.tsx)
- appearance controls misplaced in general settings:
  - [components/widgets/SpecialistSchedule/Settings.tsx](/workspaces/SPART_Board/components/widgets/SpecialistSchedule/Settings.tsx)
  - [components/widgets/MaterialsWidget/Settings.tsx](/workspaces/SPART_Board/components/widgets/MaterialsWidget/Settings.tsx)

---

## Recommended Definition Of Done

This alignment effort is done when:

1. All text-bearing widgets that are intended to be customizable expose:
   - 6-10 quick text colors
   - black and white quick colors
   - custom text color picker
   - 8-10 font choices
   - working text-size preset

2. All card-heavy widgets that are intended to be customizable expose:
   - 6-10 quick surface colors
   - custom surface color picker
   - optional opacity where appropriate

3. Appearance controls are consistently located in the style tab.

4. Transparency remains universally controlled in the shared style shell.

5. Existing placeholder or “no style settings available” appearance tabs are replaced where the widget clearly has meaningful student-facing text or cards.

6. The shared settings components become the default for new widget work, so future widgets do not reintroduce fragmentation.

---

## Bottom Line

The current widget settings system is not aligned to the desired style model.

The main issues are:

- incomplete appearance-tab coverage,
- too-small shared typography controls,
- inconsistent card/background styling,
- no shared text-size preset model,
- and visual controls scattered between style tabs, general tabs, and front-managed widget UIs.

The strongest path forward is to standardize on shared appearance primitives, upgrade the best existing widgets first, then migrate the high-visibility text/card widgets into the same model.
