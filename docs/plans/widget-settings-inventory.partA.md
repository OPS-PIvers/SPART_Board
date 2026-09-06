# Part A

## url - components/widgets/UrlWidget/Settings.tsx (348 lines)

| key  | control                                                                                                                           | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| urls | custom:link-list (add form + per-item shape/icon/background editors, uses `LinkShapePicker`, `IconPicker`, `LinkBackgroundInput`) | content     | keep               | yes (`[]`)   | Array-of-links editor; no shared "list" field type covers per-item icon+color+shape+image, so this stays a schema-gap custom slot. |

Labels: 9 labels (Add New Link section header, URL, Title, Shape, Icon, Background ×2, Active Links, per-item Title/Shape/Icon/Background repeated — counted distinct label strings: "Add New Link", "URL", "Title (Optional)", "Shape", "Icon", "Background", "Active Links", "Title" (expanded), "Shape"/"Icon"/"Background" (expanded, same text reused)), 0 help strings, t(): none — every string is a hardcoded English literal.

Pre-migration config fixture:

```json
{
  "urls": [
    {
      "id": "a1b2c3d4-0000-4000-8000-000000000001",
      "url": "https://google.com",
      "title": "Google",
      "color": "#4f46e5",
      "icon": "globe",
      "shape": "rectangle",
      "imageUrl": null
    }
  ]
}
```

---

## soundboard - components/widgets/SoundboardWidget/Settings.tsx (94 lines)

| key              | control                                                                                                                                                                                                                     | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selectedSoundIds | custom:sound-toggle-list (per-sound row with color swatch + label button + `Toggle`; sound catalog comes from `getAvailableSoundboardSounds(globalConfig, buildingId)`, an admin/building-scoped source, not a static list) | content     | keep               | yes (`[]`)   | Not a plain multi-select — needs the admin-config-aware catalog, so it's a schema-gap custom control (closest kit fit is a generic "list" picker, but the per-row admin-sourced data makes it non-generic). |

Labels: 2 labels ("Available Sounds", the empty-state "No sounds have been configured..." message), 1 help string (the italic footer "Select which sounds you want..."), t(): none.

Pre-migration config fixture:

```json
{ "selectedSoundIds": ["bell", "applause"], "activeSoundIds": [] }
```

Note: `activeSoundIds` is in `WIDGET_DEFAULTS.soundboard.config` but is never written by this settings component — it's a front-face/runtime-only key (which sound is currently playing), not a settings-panel key, so it has no row above.

---

## clock - components/widgets/ClockWidget/Settings.tsx (153 lines); appearance: components/widgets/ClockWidget/Settings.tsx (same file, `ClockAppearanceSettings`)

| key         | control                                                                                                                                   | group guess            | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format24    | toggle (custom two-button toggle, not the shared `Toggle`)                                                                                | behavior               | keep               | yes (`true`) |                                                                                                                                                                                                                                                                         |
| showSeconds | toggle (same custom two-button pattern)                                                                                                   | behavior               | keep               | yes (`true`) |                                                                                                                                                                                                                                                                         |
| fontFamily  | fontFamily (`TypographySettings`, `showColorPicker={false}`)                                                                              | style (appearance tab) | keep               | no           | Front-face fallback `'global'` (`ClockWidget/Widget.tsx:25`). Duplicate-of-Style: `fontFamily` is a universal `APPEARANCE_CONFIG_KEYS` key, rendered here via the shared component so it already matches the D18 "Content styleKeys" pattern — not a bespoke duplicate. |
| clockStyle  | segmented (3-way button group: modern/lcd/minimal)                                                                                        | display                | keep               | no           | Fallback `'modern'` (`Widget.tsx:26`).                                                                                                                                                                                                                                  |
| themeColor  | accentColor (`AccentColorSettings`-style row of swatches from `WIDGET_PALETTE`, but implemented as raw buttons, not the shared component) | style                  | keep               | no           | Fallback `STANDARD_COLORS.slate` (`Widget.tsx:24`).                                                                                                                                                                                                                     |
| glow        | toggle (custom icon button, not shared `Toggle`)                                                                                          | display                | keep               | no           | Fallback `false` (`Widget.tsx:27`).                                                                                                                                                                                                                                     |
| dateColor   | accentColor (`AccentColorSettings`, fallback label "Match Time")                                                                          | style                  | keep               | no           | Fallback: undefined → widget face uses `dateColor ?? themeColor` (`Widget.tsx:159`).                                                                                                                                                                                    |

Labels: 8 labels (`widgets.clock.format24`, `showSeconds`, `displayStyle`, `colorPalette`, `glow`, `dateColor`, plus the 3 style option labels `styles.default/lcd/minimal` and the `matchTime` fallback label), 0 help strings, t(): all (every visible string routes through `t('widgets.clock.*')`).

Pre-migration config fixture:

```json
{
  "format24": true,
  "showSeconds": true,
  "fontFamily": "global",
  "clockStyle": "modern",
  "themeColor": "#0f172a",
  "glow": false,
  "dateColor": null
}
```

---

## text - components/widgets/TextWidget/Settings.tsx (77 lines); appearance: components/widgets/TextWidget/Settings.tsx (same file, `TextAppearanceSettings`)

| key            | control                                                                                                                                                                                  | group guess            | keep/remove/rename | in-defaults? | notes                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| content        | custom:template-apply (grid of template buttons that overwrite `content` with sanitized HTML; the actual rich-text editing happens on the front face's contentEditable, not in Settings) | content                | keep               | yes (`''`)   | Settings never lets a teacher type text directly — only apply a canned template.                                                                             |
| textSizePreset | textSizePreset (`TextSizePresetSettings`)                                                                                                                                                | style (appearance tab) | keep               | no           | Front face reads `textSizePreset` directly (`Widget.tsx:49`), no local default constant — `resolveTextPresetMultiplier` presumably treats `undefined` as 1x. |
| fontFamily     | fontFamily (`TypographySettings`)                                                                                                                                                        | style                  | keep               | no           | Fallback `'global'` (`Widget.tsx:46`).                                                                                                                       |
| fontColor      | color (font color, via `TypographySettings`)                                                                                                                                             | style                  | keep               | no           | Fallback `'#334155'` (`Widget.tsx:47`).                                                                                                                      |

Labels: 1 label ("Templates" section heading), 0 help strings, t(): none (hardcoded).

Not written by Settings but present in `TextConfig` and set from the front-face toolbar instead (`FormattingToolbar`/inline editor): `bgColor`, `fontSize`, `verticalAlign`. These are WidgetData-adjacent front-face-only controls, out of scope for this settings-component inventory but worth flagging for wave migration: today they live entirely outside the settings/appearance panel, so a schema author must decide whether to pull them into the drawer or leave them on the front face.

Pre-migration config fixture:

```json
{
  "content": "<p>Hello class!</p>",
  "bgColor": "#fef9c3",
  "fontSize": 18,
  "fontFamily": "global",
  "fontColor": "#334155",
  "verticalAlign": "center"
}
```

---

## checklist - components/widgets/Checklist/Settings.tsx (383 lines); appearance: components/widgets/Checklist/Settings.tsx (same file, `ChecklistAppearanceSettings`)

| key             | control                                                                                                          | group guess            | keep/remove/rename | in-defaults?     | notes                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| items           | custom:bulk-textarea (one task per line, 500ms debounce, diffs against existing items to preserve ids/completed) | content                | keep               | yes (`[]`)       | Also written wholesale by the two "Nexus Connection" import buttons (from Instructional Routines / Text widget). |
| mode            | segmented (`'manual' \| 'roster'` two-button toggle, "CUSTOM TASKS"/"CLASS ROSTER")                              | behavior               | keep               | yes (`'manual'`) |                                                                                                                  |
| rosterMode      | rosterMode (`RosterModeControl`)                                                                                 | behavior               | keep               | no               | Fallback `'class'` (`Settings.tsx:27`, mirrored in `Widget.tsx:20`).                                             |
| firstNames      | textarea                                                                                                         | content                | keep               | yes (`''`)       | Only shown when `rosterMode === 'custom'`.                                                                       |
| lastNames       | textarea                                                                                                         | content                | keep               | yes (`''`)       | Same gating as `firstNames`.                                                                                     |
| scaleMultiplier | slider (`TextSizePresetSettings` with `writeScaleMultiplier`)                                                    | style (appearance tab) | keep               | yes (`1`)        |                                                                                                                  |
| fontFamily      | fontFamily (`TypographySettings`)                                                                                | style                  | keep               | no               | Fallback `'global'` (`Widget.tsx:25`).                                                                           |
| fontColor       | color (`TypographySettings`)                                                                                     | style                  | keep               | no               | Fallback `'#334155'` (`Widget.tsx:28`).                                                                          |
| textSizePreset  | textSizePreset (`TextSizePresetSettings`)                                                                        | style                  | keep               | no               | Combined with `scaleMultiplier` via `resolveTextPresetMultiplier` (`Widget.tsx:32`).                             |
| cardColor       | surfaceColor (`SurfaceColorSettings`)                                                                            | style                  | keep               | no               | Fallback `'#ffffff'` (`Widget.tsx:26`).                                                                          |
| cardOpacity     | surfaceColor (`SurfaceColorSettings`)                                                                            | style                  | keep               | no               | Fallback `1` (`Widget.tsx:27`).                                                                                  |

Labels: 11 labels (Import Routine, Import from Text Widget, List Source, CUSTOM TASKS, CLASS ROSTER, Task List (One per line), First Names, Last Names, plus the two Sync button labels and the roster-mode control's own internal labels not counted here), 0 help strings (no separate italic/help-line text beyond labels), t(): none — all hardcoded English.

Note: `completedNames` is in `WIDGET_DEFAULTS.checklist.config` (`[]`) and in `ChecklistConfig`, but is never written by this Settings component — it's runtime/front-face state (roster-mode checked-off tracking), not a settings-panel field.

Pre-migration config fixture:

```json
{
  "items": [{ "id": "i1", "text": "Sharpen pencils", "completed": false }],
  "mode": "manual",
  "rosterMode": "class",
  "firstNames": "",
  "lastNames": "",
  "completedNames": [],
  "scaleMultiplier": 1,
  "fontFamily": "global",
  "fontColor": "#334155",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

---

## random - components/widgets/random/RandomSettings.tsx (641 lines)

| key                                                | control                                                                               | group guess | keep/remove/rename           | in-defaults?                                           | notes                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- | ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| rosterMode                                         | rosterMode (`RosterModeControl`)                                                      | behavior    | keep                         | yes (`'class'`)                                        |                                                                                                                                            |
| soundEnabled                                       | toggle (`Toggle`)                                                                     | behavior    | keep                         | no                                                     | Fallback `true` (Settings.tsx:168, mirrored on the widget face).                                                                           |
| autoStartTimer                                     | toggle (`Toggle`, disabled unless a `time-tool` widget exists)                        | behavior    | keep                         | no                                                     | Fallback `false`. Cross-widget ("Nexus") automation gate.                                                                                  |
| mode                                               | segmented (4-way icon grid: single/shuffle/groups/jigsaw)                             | behavior    | keep                         | yes (`'single'`)                                       | Also resets `lastResult`/`jigsawHomeGroups`/`jigsawExpertGroups`/`jigsawView` as a side effect of the same write.                          |
| visualStyle                                        | segmented (3-way icon grid: flash/wheel/slots), only for `mode === 'single'`          | display     | keep                         | no                                                     | Fallback `'flash'`.                                                                                                                        |
| groupSize                                          | slider (range 2-20), only for `mode === 'groups'`                                     | content     | keep                         | no                                                     | Fallback computed: `configGroupSize ?? (mode === 'jigsaw' ? 4 : 3)`.                                                                       |
| numHomeGroups                                      | slider (range 2-20), only for `mode === 'jigsaw'`                                     | content     | keep                         | no                                                     | Fallback computed from roster/name-list size, clamped ≥2.                                                                                  |
| numExpertGroups                                    | slider (range 2-20), only for `mode === 'jigsaw'`                                     | content     | keep                         | no                                                     | Fallback computed as `max(2, ceil(numHomeGroups/2))`.                                                                                      |
| firstNames                                         | textarea (debounced 1000ms + blur-flush), only for `rosterMode === 'custom'`          | content     | keep                         | yes (`''`)                                             |                                                                                                                                            |
| lastNames                                          | textarea (debounced 1000ms + blur-flush), only for `rosterMode === 'custom'`          | content     | keep                         | yes (`''`)                                             |                                                                                                                                            |
| lastResult                                         | custom (cleared to `null` on mode switch / clear-names action; never directly edited) | content     | remove-from-settings-surface | no (has default `undefined`, not in `WIDGET_DEFAULTS`) | Runtime output, not a real setting; flag as dead-in-settings (only ever reset here, never set here — set by the front face's Pick action). |
| remainingStudents                                  | custom (cleared alongside `lastResult`)                                               | content     | remove-from-settings-surface | no                                                     | Same as `lastResult` — runtime state reset by Settings, not authored.                                                                      |
| jigsawHomeGroups / jigsawExpertGroups / jigsawView | custom (reset to null/'home' on mode change only)                                     | content     | remove-from-settings-surface | no                                                     | Runtime jigsaw state, only ever cleared here.                                                                                              |

Labels: 10 labels (Operation Mode + 4 mode labels, Animation Style + 3 style labels, "Sound Effects"/"Tick-tock while spinning", "Auto-Start Timer"/description, "Send Groups to Stations", `t('widgets.random.groupSize'|'homeGroupCount'|'expertGroupCount')`, "Import from Class", "First Names", "Last Names", "Clear Custom Names"), 4 help strings (tick-tock subtitle, auto-start subtitle, timer-required warning, stations-tip, clear-confirm), t(): partial (only the three slider labels route through `t()` with `defaultValue`; everything else is hardcoded English).

Pre-migration config fixture:

```json
{
  "firstNames": "",
  "lastNames": "",
  "mode": "single",
  "groupSize": 3,
  "soundEnabled": true,
  "rosterMode": "class",
  "autoStartTimer": false,
  "visualStyle": "flash",
  "numExpertGroups": 2,
  "numHomeGroups": 2
}
```

---

## dice - components/widgets/DiceWidget/Settings.tsx (84 lines)

| key       | control                                                                                      | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| count     | segmented (grid of 6 number buttons, 1-6)                                                    | content     | keep               | yes (`1`)    |                                                                                                                                                                                                                                                                                                                                                              |
| diceColor | surfaceColor (`SurfaceColorSettings` reused with `config.cardColor` remapped to `diceColor`) | style       | rename-candidate   | no           | Fallback `'#ffffff'` (`Widget.tsx:17`). Not a universal `APPEARANCE_CONFIG_KEYS` key (die color ≠ card color), so this is a legitimate per-widget style key, just piggybacking on the shared component via a manual remap — flag as a pattern the new field kit's `SurfaceColor` field type should support natively (custom label/key) instead of remapping. |
| dotColor  | surfaceColor (same remap pattern, `config.cardColor` → `dotColor`)                           | style       | rename-candidate   | no           | Fallback `'#1e293b'` (`Widget.tsx:17`). Same note as `diceColor`.                                                                                                                                                                                                                                                                                            |

Labels: 3 labels ("Number of Dice", "Die Color", "Pip Color"), 1 help string (the purple "Instructions" tip box), t(): none.

Pre-migration config fixture:

```json
{ "count": 2, "diceColor": "#ffffff", "dotColor": "#1e293b" }
```

---

## sound - components/widgets/SoundWidget/Settings.tsx (200 lines); appearance: components/widgets/SoundWidget/Settings.tsx (same file, `SoundAppearanceSettings`)

| key                   | control                                                                                   | group guess              | keep/remove/rename | in-defaults?          | notes                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------ | ------------------ | --------------------- | --------------------------------------------------------- |
| syncExpectations      | toggle (`Toggle`, disabled unless an `expectations` widget exists)                        | behavior                 | keep               | no                    | Fallback `false`. Cross-widget ("Nexus") automation gate. |
| sensitivity           | slider (range 0.5-5, disabled while `syncExpectations`)                                   | content                  | keep               | yes (`1`)             |                                                           |
| autoTrafficLight      | toggle (`Toggle`, disabled unless a `traffic` widget exists)                              | behavior                 | keep               | no                    | Fallback `undefined` → `?? false` at read site.           |
| trafficLightThreshold | custom:level-picker (list of `POSTER_LEVELS` buttons), only shown when `autoTrafficLight` | behavior                 | keep               | no                    | Fallback `4` (`Settings.tsx:14`).                         |
| visual                | segmented (2x2 icon grid: thermometer/speedometer/line/balls)                             | display (appearance tab) | keep               | yes (`'thermometer'`) |                                                           |

Labels: 6 labels ("Auto-Sensitivity (Expectations)", "Sync with Expectations", "Sensitivity", "Auto-Control Traffic Light", "Enable Automation", "Trigger Red Light At:", "Visual Mode"), 3 help strings (expectations tip, sensitivity-auto-adjusted note, traffic-light tip), t(): none.

Pre-migration config fixture:

```json
{
  "sensitivity": 1,
  "autoTrafficLight": false,
  "trafficLightThreshold": 4,
  "syncExpectations": false,
  "visual": "thermometer"
}
```

---

## embed - components/widgets/Embed/Settings.tsx (338 lines)

| key             | control                                                                                                                            | group guess | keep/remove/rename           | in-defaults? | notes                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| mode            | segmented ("WEBSITE URL"/"CUSTOM CODE" two-button toggle; hidden entirely when the building's `hideUrlField` global config is set) | behavior    | keep                         | no           | Fallback `'url'`.                                                                      |
| url             | text                                                                                                                               | content     | keep                         | yes (`''`)   | Also clears `isEmbeddable`→`true` as a side effect on every keystroke.                 |
| isEmbeddable    | custom (never directly edited by the teacher; flipped by the async "Verify" call, and reset to `true` whenever `url` changes)      | content     | remove-from-settings-surface | no           | Fallback `true`. This is a cached verification result, not a teacher-authored setting. |
| blockedReason   | custom (same as `isEmbeddable` — written only by the Verify callback)                                                              | content     | remove-from-settings-surface | no           | Fallback `''` (`Widget.tsx:52`).                                                       |
| html            | textarea (monospace, "HTML / CSS / JS")                                                                                            | content     | keep                         | no           | Fallback `''`.                                                                         |
| refreshInterval | select (0/1/5/15/30/60 minutes)                                                                                                    | behavior    | keep                         | no           | Fallback `0`.                                                                          |

Labels: 6 labels (Target URL, HTML / CSS / JS, Auto-Refresh, plus the two mode-toggle labels and the Verify button), 5 help strings (pro-tip about YouTube/Docs auto-format, non-embeddable warning, generic "some websites prevent embedding" tip, sandbox-scripts note, and the verify-result inline messages), t(): none.

Pre-migration config fixture:

```json
{
  "mode": "url",
  "url": "https://example.com",
  "isEmbeddable": true,
  "blockedReason": "",
  "html": "",
  "refreshInterval": 0
}
```

---

## drawing - components/widgets/DrawingWidget/Settings.tsx (224 lines)

| key     | control                        | group guess | keep/remove/rename | in-defaults?                                                                                   | notes                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------------------------------ | ----------- | ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none)  | —                              | —           | —                  | —                                                                                              | `DrawingSettings` was inspected: it reads `widget.config` for display only (e.g. showing stroke count / background) and issues board actions (clear canvas, export image, change background swatch) that write via canvas-specific actions, not plain `config` merges routed through this file in a way distinguishable as "keys written." Re-checked: the background-color buttons DO write `config.bgColor`; see below. |
| bgColor | color (palette-swatch buttons) | style       | keep               | yes (`undefined`, not present in `WIDGET_DEFAULTS.drawing.config` which only sets `paths: []`) | No in-file fallback found in `DrawingWidget/Widget.tsx` beyond a CSS default — treat as "no fallback found" pending closer read; flagged for the drawing-widget owner to confirm at migration time since `drawing` uses `skipScaling: false` (transform-based), an architectural outlier among this batch.                                                                                                                |

Labels: not fully counted (file uses icon-only buttons for undo/clear/export in addition to color swatches) — recommend the drawing widget get its own focused pass before schema authoring, since its front face is canvas-based rather than config-driven like the rest of this batch.

Pre-migration config fixture:

```json
{ "paths": [], "bgColor": null }
```

---

## qr - components/widgets/QRWidget/Settings.tsx (113 lines)

| key                | control                                                                            | group guess | keep/remove/rename | in-defaults?  | notes                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------- | ----------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| url                | text (disabled when `syncWithTextWidget` is on; shows the live synced URL instead) | content     | keep               | no            | Fallback: `Widget.tsx:54-56` falls back through a synced-URL derivation, then `config.url !== '' ? config.url : undefined`, ultimately `??` to a further default — effectively `''`. |
| showUrl            | toggle (`Toggle`)                                                                  | display     | keep               | yes (`false`) |                                                                                                                                                                                      |
| syncWithTextWidget | toggle (`Toggle`, "Link Repeater" section)                                         | behavior    | keep               | no            | Fallback `false`. Cross-widget ("Nexus") sync with the first `text` widget on the board.                                                                                             |

Labels: 4 labels (Destination URL, Show URL, Link Repeater, Sync with Text Widget), 2 help strings (Show-URL description line, Link-Repeater description line), t(): none.

Pre-migration config fixture:

```json
{
  "url": "https://spartboard.example",
  "showUrl": false,
  "syncWithTextWidget": false
}
```

---

## scoreboard - components/widgets/Scoreboard/Settings.tsx (321 lines)

| key    | control                                                                                                                | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| layout | segmented ("Cards"/"List" radiogroup)                                                                                  | display     | keep               | no           | Fallback `'cards'` (`Widget.tsx:49`). `WIDGET_DEFAULTS.scoreboard.config` only has the deprecated `scoreA/scoreB/teamA/teamB` shape — stale relative to the `teams` array this Settings component actually uses. |
| teams  | custom:team-list (add/remove/rename team rows with debounced name input, color auto-assigned from `SCOREBOARD_COLORS`) | content     | keep               | no           | Fallback `DEFAULT_TEAMS` (`Widget.tsx:48`) when not an array. Also written wholesale by "Import from Randomizer" and "Reset Scores" (zeroes every `score`).                                                      |

Labels: 3 labels (Layout, Import from Randomizer, "Teams (N)"), 2 help strings (Randomizer-not-found tip, none else), t(): none.

Note: `scoreA`, `scoreB`, `teamA`, `teamB` are in `WIDGET_DEFAULTS.scoreboard.config` and `ScoreboardConfig` (marked `@deprecated use teams array instead`) but are never written by this Settings component — the defaults entry is stale and should be updated to `{ teams: [], layout: 'cards' }` in the wave 1a.6 backfill.

Pre-migration config fixture:

```json
{
  "layout": "cards",
  "teams": [
    { "id": "t1", "name": "Team 1", "score": 0, "color": "bg-blue-500" },
    { "id": "t2", "name": "Team 2", "score": 0, "color": "bg-rose-500" }
  ]
}
```

---

## webcam - components/widgets/Webcam/Settings.tsx (40 lines)

| key             | control                           | group guess | keep/remove/rename | in-defaults? | notes                                                                                                        |
| --------------- | --------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------ |
| autoSendToNotes | toggle (`Toggle`, "OCR to Notes") | behavior    | keep               | no           | Fallback: `!!autoSendToNotes` treats `undefined` as falsy in both Settings and (presumably) the widget face. |

Labels: 2 labels ("Auto-Send OCR to Notes:" section label, "OCR to Notes" toggle title), 1 help string ("Instantly convert captured text into a Notes widget."), t(): none.

Not written by this Settings component but present in `WebcamConfig`/`WIDGET_DEFAULTS.webcam`: `zoomLevel` (default `1`), `isMirrored` (default `true`), `deviceId`, `isRemoteMode`, `remoteCaptureDataUrl`, `remoteCaptureTimestamp` — all front-face/runtime fields (zoom slider and mirror toggle live on the widget face itself, device selection and remote-capture state are runtime), not settings-panel fields. Flag for schema authoring: the zoom/mirror controls currently living only on the front face may be candidates to pull into the drawer's Behavior/Display groups.

Pre-migration config fixture:

```json
{ "autoSendToNotes": false }
```

---

## calendar - components/widgets/Calendar/Settings.tsx (418 lines); appearance: components/widgets/Calendar/Settings.tsx (same file, `CalendarAppearanceSettings`)

| key                   | control                                                                                                                                                 | group guess            | keep/remove/rename | in-defaults? | notes                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| isBuildingSyncEnabled | toggle (`Toggle`)                                                                                                                                       | behavior               | keep               | yes (`true`) |                                                                                                            |
| daysVisible           | number input (1-30)                                                                                                                                     | display                | keep               | yes (`5`)    |                                                                                                            |
| personalCalendarIds   | custom:id-list (paste Calendar ID/URL, `extractCalendarId` parses it, add/remove chips), gated behind a Google `calendar.readonly` OAuth connect button | content                | keep               | no           | Fallback `[]` (`Widget.tsx` reads `config.personalCalendarIds ?? []` pattern mirrored in Settings.tsx:58). |
| events                | custom:local-event-list (title/date/time text inputs, add/remove rows)                                                                                  | content                | keep               | yes (`[]`)   | Local manual events, separate from synced Google/building events.                                          |
| textSizePreset        | textSizePreset (`TextSizePresetSettings`)                                                                                                               | style (appearance tab) | keep               | no           |                                                                                                            |
| fontFamily            | fontFamily (`TypographySettings`)                                                                                                                       | style                  | keep               | no           | Fallback `'global'` (`Widget.tsx:66`).                                                                     |
| fontColor             | color (`TypographySettings`)                                                                                                                            | style                  | keep               | no           | Fallback `'#334155'` (`Widget.tsx:67`).                                                                    |
| cardColor             | surfaceColor (`SurfaceColorSettings`)                                                                                                                   | style                  | keep               | no           | Fallback `'#ffffff'` (`Widget.tsx:70`).                                                                    |
| cardOpacity           | surfaceColor (`SurfaceColorSettings`)                                                                                                                   | style                  | keep               | no           | Fallback `1` (`Widget.tsx:69`).                                                                            |

Labels: 7 labels (Display Options, Sync Building Schedule, Days to Display, Personal Google Calendars, Instructions (toggle link), Local Manual Events, "Sign in with Google to Sync"), 3 help strings (days-to-display description, personal-calendar instructions block, empty-events message), t(): none — this panel is entirely hardcoded English despite Weather (a sibling widget) being fully `t()`-ized, an inconsistency worth flagging for the string-count pass (0.3).

Pre-migration config fixture:

```json
{
  "events": [{ "title": "Art", "date": "Monday", "time": "10:00" }],
  "personalCalendarIds": ["abc123@group.calendar.google.com"],
  "isBuildingSyncEnabled": true,
  "daysVisible": 5,
  "fontFamily": "global",
  "fontColor": "#334155",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

---

## weather - components/widgets/Weather/Settings.tsx (549 lines); appearance: components/widgets/Weather/Settings.tsx (same file, `WeatherAppearanceSettings`)

| key            | control                                                                                             | group guess            | keep/remove/rename           | in-defaults?    | notes                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ | --- | ------------------------------------- |
| showFeelsLike  | toggle (`Toggle`)                                                                                   | display                | keep                         | no              | Fallback chain: `localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false` — admin global config can supply a default. |
| hideClothing   | toggle (`Toggle`)                                                                                   | display                | keep                         | no              | Fallback `false`.                                                                                                        |
| syncBackground | toggle (`Toggle`)                                                                                   | display                | keep                         | no              | Fallback `false`.                                                                                                        |
| isAuto         | segmented (Manual/Automatic two-button toggle)                                                      | behavior               | keep                         | yes (`true`)    |                                                                                                                          |
| temp           | slider (range 0-110°F), manual mode only                                                            | content                | keep                         | yes (`72`)      | Also stamps `locationName` to a "Manual Mode" i18n string as a side effect.                                              |
| condition      | segmented (5-icon grid: sunny/cloudy/rainy/snowy/windy), manual mode only                           | content                | keep                         | yes (`'sunny'`) |                                                                                                                          |
| source         | segmented (OpenWeather / school-station toggle), auto mode only, hidden when admin proxy manages it | behavior               | keep                         | no              | Fallback: `source === 'openweather'                                                                                      |     | !source` treats unset as OpenWeather. |
| city           | text, auto+OpenWeather only                                                                         | content                | keep                         | no              | Fallback `''`.                                                                                                           |
| feelsLike      | custom (only ever written by the two fetch callbacks, never directly edited)                        | content                | remove-from-settings-surface | no              | Derived/synced value, not a teacher-authored field.                                                                      |
| locationName   | custom (written by fetch callbacks and by the manual-temp slider)                                   | content                | remove-from-settings-surface | no              | Fallback `'Classroom'` (destructured as unused `_locationName` in Settings — the panel never displays it directly).      |
| lastSync       | custom (timestamp stamped by fetch callbacks only)                                                  | content                | remove-from-settings-surface | no              | Not a setting a teacher edits.                                                                                           |
| fontFamily     | fontFamily (`TypographySettings`)                                                                   | style (appearance tab) | keep                         | no              |                                                                                                                          |
| fontColor      | color (`TypographySettings`)                                                                        | style                  | keep                         | no              |                                                                                                                          |
| secondaryColor | accentColor (`AccentColorSettings`, fallback label "Match Text")                                    | style                  | keep                         | no              | Fallback: `config.fontColor ?? '#334155'`.                                                                               |
| cardColor      | surfaceColor (`SurfaceColorSettings`, hidden when `hideClothing`)                                   | style                  | keep                         | no              |                                                                                                                          |
| cardOpacity    | surfaceColor (`SurfaceColorSettings`, hidden when `hideClothing`)                                   | style                  | keep                         | no              |                                                                                                                          |

Labels: 15 labels (all via `t('widgets.weather.*')`: prioritizeFeelsLike, hideClothing, syncBackground, manual, automatic, temperature, condition + 5 condition names, cityZip, schoolStation, useLocation, or, secondaryColor, clothingCard), 8 help strings (prioritizeDescription, hideClothingDescription, syncBackgroundDescription, managedByAdmin, serviceNotConfiguredAdmin, stationReady/stationConnectedTo, plus toast-only messages not counted as panel help), t(): all — every visible string routes through `t()`/`Trans`.

Pre-migration config fixture:

```json
{
  "temp": 72,
  "condition": "sunny",
  "isAuto": true,
  "locationName": "Classroom",
  "source": "openweather",
  "showFeelsLike": false,
  "hideClothing": false,
  "syncBackground": false,
  "fontFamily": "global",
  "fontColor": "#334155",
  "secondaryColor": null,
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

---

## lunchCount - components/widgets/LunchCount/Settings.tsx (343 lines); appearance: components/widgets/LunchCount/Settings.tsx (same file, `LunchCountAppearanceSettings`)

| key                    | control                                                                                 | group guess            | keep/remove/rename           | in-defaults?                                                                   | notes                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------- | ---------------------- | ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| schoolSite             | select (4 fixed Orono-building options)                                                 | content                | keep                         | yes (`'schumann-elementary'`)                                                  | District-specific hardcoded option list — flag for a follow-up on whether this should be building-scoped config rather than a per-widget select. |
| lunchTimeHour          | number (1-12, clamped on change+blur)                                                   | content                | keep                         | no                                                                             | Fallback `''` (Settings.tsx:63).                                                                                                                 |
| lunchTimeMinute        | number (0-59, clamped + zero-padded on blur)                                            | content                | keep                         | no                                                                             | Fallback `''`.                                                                                                                                   |
| gradeLevel             | segmented (button row, options depend on `schoolSite`)                                  | content                | keep                         | no                                                                             | Fallback `''`; cleared automatically when `schoolSite` changes and the old value is invalid for the new site.                                    |
| rosterMode             | rosterMode (`RosterModeControl`)                                                        | behavior               | keep                         | yes (`'class'`)                                                                |                                                                                                                                                  |
| isManualMode           | toggle (`Toggle`)                                                                       | behavior               | keep                         | yes (`false`)                                                                  |                                                                                                                                                  |
| manualHotLunch         | text, manual mode only                                                                  | content                | keep                         | yes (`''`)                                                                     |                                                                                                                                                  |
| manualBentoBox         | text, manual mode only                                                                  | content                | keep                         | yes (`''`)                                                                     |                                                                                                                                                  |
| roster                 | textarea (one student per line), custom roster mode only                                | content                | keep                         | yes (`[]`)                                                                     |                                                                                                                                                  |
| cachedMenu             | custom (cleared to `null` only as a side effect of `schoolSite` change, never set here) | content                | remove-from-settings-surface | no (not in defaults; type is `LunchMenuDay \| null`)                           | Synced-menu cache, not a teacher-authored field.                                                                                                 |
| fontFamily / fontColor | fontFamily / color (`TypographySettings`)                                               | style (appearance tab) | keep                         | yes (`cardColor`/`cardOpacity` only; `fontFamily`/`fontColor` not in defaults) |                                                                                                                                                  |
| cardColor              | surfaceColor (`SurfaceColorSettings`)                                                   | style                  | keep                         | yes (`'#ffffff'`)                                                              |                                                                                                                                                  |
| cardOpacity            | surfaceColor (`SurfaceColorSettings`)                                                   | style                  | keep                         | yes (`1`)                                                                      |                                                                                                                                                  |

Labels: 7 labels (School Site, Lunch Time, Grade Level, Manual Mode, Hot Lunch Name / Bento Box Name placeholders, Custom Roster, "Using Active Class Roster"), 0 dedicated help strings beyond the inline "Preview: H:MM" line, t(): none.

Not written here but present in `LunchCountConfig`/`WIDGET_DEFAULTS.lunchCount`: `assignments` (`{}`), `recipient` (`''`), `syncError`, `lastSyncDate` — all runtime/report-submission state written elsewhere (`SubmitReportModal.tsx`, sync logic), not settings-panel fields.

Pre-migration config fixture:

```json
{
  "schoolSite": "schumann-elementary",
  "isManualMode": false,
  "manualHotLunch": "",
  "manualBentoBox": "",
  "roster": [],
  "assignments": {},
  "recipient": "",
  "rosterMode": "class",
  "lunchTimeHour": "11",
  "lunchTimeMinute": "30",
  "gradeLevel": "3",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

---

## poll - components/widgets/PollWidget/Settings.tsx (650 lines)

| key                  | control                                                                                                                                                                                      | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| questions            | custom:question-editor (chip strip to select which of up to `MAX_POLL_QUESTIONS` questions to edit, per-question text input + option list editor, AI draft-with-AI generator, roster import) | content     | keep               | no           | Not in `WIDGET_DEFAULTS.poll.config`, which still uses the legacy flat `question`/`options` shape (see below). Accessed everywhere through `getPollQuestions`/`withPollQuestions`/`withQuestionAt` helpers, never read directly. |
| currentQuestionIndex | custom (not directly settable by the teacher in Settings — only mirrors which question is "showing on the board"; presumably advanced from the front face)                                   | behavior    | keep               | no           | Read via `clampQuestionIndex`.                                                                                                                                                                                                   |
| joinCode             | custom (minted once by `ensurePollJoinCode`, displayed read-only with a copy button)                                                                                                         | behavior    | keep               | no           | Nullable; not teacher-typed.                                                                                                                                                                                                     |
| activePollSessionId  | custom (set/cleared by Start/Stop device-voting buttons via `startPollSession`/`stopPollSession`)                                                                                            | behavior    | keep               | no           | Drives the "Voting open"/"Not started" badge.                                                                                                                                                                                    |
| lastPollSessionId    | custom (set by `startPollSession`, read to decide whether to show the Resume-vs-fresh popover)                                                                                               | behavior    | keep               | no           |                                                                                                                                                                                                                                  |

Labels: 13 labels (Import from Class, Draft with AI, Questions, Question N, Options, Actions, Reset, Export CSV, Live Device Voting, Start device voting, Stop voting, Resume previous, Start fresh, Copy link/Copied), 6 help strings (import tip, AI-draft caption, question-limit tip, green-dot legend, live-voting description, resume-vs-fresh caption), t(): none — this is the most complex panel in the batch and is entirely un-translated.

Note: `question`/`options` (the pre-multi-question legacy shape) are in `WIDGET_DEFAULTS.poll.config` and `PollConfig` but are never written directly by this Settings component — new/edited widgets always go through `getPollQuestions`/`withPollQuestions`, which normalizes the legacy shape into `questions` on read/write. Flag `WIDGET_DEFAULTS.poll` as stale (still seeds the legacy single-question shape) for the wave 1a.6 backfill.

Pre-migration config fixture:

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Favorite season?",
      "options": [
        { "id": "opt-1", "label": "Summer", "votes": 0 },
        { "id": "opt-2", "label": "Winter", "votes": 0 }
      ]
    }
  ],
  "currentQuestionIndex": 0,
  "joinCode": null,
  "activePollSessionId": null,
  "lastPollSessionId": null
}
```

---

## instructionalRoutines - components/widgets/InstructionalRoutines/Settings.tsx (246 lines); appearance: components/widgets/InstructionalRoutines/Settings.tsx (same file, `InstructionalRoutinesAppearanceSettings`)

| key               | control                                                                                                                        | group guess            | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selectedRoutineId | custom (only ever set to `null` here, via the "Switch Routine Template" button, which also sets `WidgetData.flipped = false`)  | content                | keep               | yes (`null`) | Writing a `WidgetData` field (`flipped`) alongside `config` from inside a settings component is the kind of thing D21's host-managed flip state should absorb — flag for wave 1b: the drawer host, not the panel, should own un-flipping. |
| customSteps       | custom:step-list (reorderable rows: icon picker, admin-only label field, direction textarea, attached-tool select, add/remove) | content                | keep               | yes (`[]`)   |                                                                                                                                                                                                                                           |
| scaleMultiplier   | slider (range 0.5-2.0)                                                                                                         | style (appearance tab) | keep               | yes (`1`)    |                                                                                                                                                                                                                                           |

Labels: 2 labels ("Switch Routine Template" button, "Step Editor" section), 0 dedicated help strings, t(): none.

Pre-migration config fixture:

```json
{
  "selectedRoutineId": null,
  "customSteps": [
    { "id": "s1", "text": "Turn to your partner", "icon": "Zap" }
  ],
  "favorites": [],
  "scaleMultiplier": 1
}
```

---

## materials - components/widgets/MaterialsWidget/Settings.tsx (572 lines)

| key                     | control                                                                                                                                                                                                            | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title                   | text                                                                                                                                                                                                               | content     | keep               | no           | Fallback `'What you need'` (Settings.tsx:67).                                                                                                                                                                                                                                    |
| titleFont               | custom:font-swatch-grid (4 fixed font buttons: Inherit/Digital/Modern/School)                                                                                                                                      | style       | rename-candidate   | no           | Fallback `'global'`. Duplicate-of-Style: this is a bespoke reimplementation of what `TypographySettings`/fontFamily already covers elsewhere — flag as a genuine duplicate-of-Style control to fold into the universal Style tab rather than keep as a per-widget custom picker. |
| titleColor              | custom:color-swatch-grid (`WIDGET_PALETTE` swatches, raw buttons not `AccentColorSettings`)                                                                                                                        | style       | rename-candidate   | no           | Fallback `'#2d3f89'`. Same duplicate-of-Style flag as `titleFont` — this is exactly what `AccentColorSettings`/`fontColor` already provides.                                                                                                                                     |
| selectedItems           | custom:catalog-checklist (checkbox rows over an admin/building-scoped materials catalog, with per-row hide/edit/select-all)                                                                                        | content     | keep               | yes (`[]`)   |                                                                                                                                                                                                                                                                                  |
| activeItems             | custom (not directly toggled by a UI control in Settings — filtered to intersect with `selectedItems` whenever selection changes; the actual per-item "active/visible to students" toggle lives on the front face) | content     | keep               | yes (`[]`)   |                                                                                                                                                                                                                                                                                  |
| customMaterialSnapshots | custom (rebuilt automatically by `withSnapshots` on every selection change; never directly edited)                                                                                                                 | content     | keep               | no           | Derived cache so shared/exported boards still render teacher-defined materials — not a teacher-facing field, but structurally necessary; keep off any "remove" list.                                                                                                             |

Labels: 5 labels (Title Text, Typography, Title Color, Available Materials, Add/Select All/Deselect All), 2 help strings (material-cap message, footer "Selected materials will appear..." tip), t(): none.

Note: this component also writes to `AuthContext`'s `materialsPreferences` (`hiddenMaterialIds`, via `saveMaterialsPreferences`) alongside every `config` write — a second, account-wide persistence path (not `APPEARANCE_CONFIG_KEYS`) that the drawer/migration work should be aware of but that is out of scope for `config` key rows here.

Pre-migration config fixture:

```json
{
  "selectedItems": ["scissors", "glue"],
  "activeItems": ["scissors"],
  "title": "What you need",
  "titleFont": "global",
  "titleColor": "#2d3f89",
  "customMaterialSnapshots": []
}
```

---

## miniApp - components/widgets/FallbackSettings.tsx (19 lines, shared fallback — `MiniAppSettings` here is a static placeholder, not a real settings panel); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------- | ----------- | ------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none) | —       | —           | —                  | —            | `WIDGET_SETTINGS_COMPONENTS.miniApp` points at the shared `FallbackSettings.tsx`'s `MiniAppSettings`, which renders a single static string ("Manage apps in the main view.") and writes nothing. Real Mini App configuration happens in the front-face editor (`components/widgets/MiniApp/`), entirely outside the settings/appearance system this inventory covers. |

Labels: 1 label (the static placeholder string), 0 help strings, t(): none.

Pre-migration config fixture: N/A — no config keys are written by this settings surface.

---

## Summary

| widget                | keys | labels                                     | help | t()     | not-in-defaults |
| --------------------- | ---- | ------------------------------------------ | ---- | ------- | --------------- |
| url                   | 1    | 9                                          | 0    | none    | 0               |
| soundboard            | 1    | 2                                          | 1    | none    | 0               |
| clock                 | 6    | 8                                          | 0    | all     | 4               |
| text                  | 4    | 1                                          | 0    | none    | 3               |
| checklist             | 11   | 11                                         | 0    | none    | 6               |
| random                | 13   | 10                                         | 4    | partial | 8               |
| dice                  | 3    | 3                                          | 1    | none    | 2               |
| sound                 | 5    | 6                                          | 3    | none    | 3               |
| embed                 | 6    | 6                                          | 5    | none    | 4               |
| drawing               | 1    | n/a (not counted — needs a dedicated pass) | n/a  | none    | 1               |
| qr                    | 3    | 4                                          | 2    | none    | 2               |
| scoreboard            | 2    | 3                                          | 2    | none    | 2               |
| webcam                | 1    | 2                                          | 1    | none    | 1               |
| calendar              | 9    | 7                                          | 3    | none    | 5               |
| weather               | 15   | 15                                         | 8    | all     | 12              |
| lunchCount            | 13   | 7                                          | 0    | none    | 4               |
| poll                  | 5    | 13                                         | 6    | none    | 5               |
| instructionalRoutines | 3    | 2                                          | 0    | none    | 0               |
| materials             | 6    | 5                                          | 2    | none    | 5               |
| miniApp               | 0    | 1                                          | 0    | none    | 0               |

## Template read path

The production dashboard-TEMPLATE read path (`dashboard_templates` Firestore collection → live `Dashboard`) is **`components/boardsModal/CreateFromTemplateModal.tsx`**:

- **Board templates**: `pickBoardTemplate()` (line ~83) reads a `DashboardTemplate` doc (already subscribed via `onSnapshot(query(collection(db, 'dashboard_templates'), where('enabled', '==', true)))`, or via `mockTemplateStore` under `VITE_AUTH_BYPASS`) and builds a `Dashboard` object directly — `widgets: tpl.widgets` is passed through **unchanged**, with no `migrateWidget` call — then hands it to `createNewDashboard(tpl.name, dashboard)`.
- **Collection templates**: `pickCollectionTemplate()` (line ~113) calls `hydrateCollectionTemplate()` (`utils/collectionTemplateHydration.ts`), a pure data-shaping function that remaps each `BoardTemplateSnapshot` into a `Dashboard` (fresh uuid, same `widgets` array reference from the snapshot) and returns `boardInputs: Dashboard[]`; the caller then loops `createNewDashboard(board.name, board, { collectionId, silent: true })` per board — again with no `migrateWidget` call anywhere in the chain.
- **Confirmed sink**: `createNewDashboard` (`context/DashboardContext.tsx`) does not call `migrateWidget` on the `widgets` it's handed — it accepts the `Dashboard` (or widget array) as-is. This means a widget config-key rename that ships as a `migrateWidget` step will **not** apply to widgets arriving from either template path, matching what §4.4 already documents for shared boards / Drive import / starter packs / saved-config merges. Wave 1b's "route every load path through `migrateWidget`" work must add both `pickBoardTemplate` and `hydrateCollectionTemplate`'s `createNewDashboard` calls to its list, and the fixture-board characterization set should gain `tests/fixtures/boards/template.json` covering both the board-template and collection-template shapes.
