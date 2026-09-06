# Part B

## time-tool - components/widgets/TimeTool/Settings.tsx (641 lines); appearance: components/widgets/TimeTool/Settings.tsx (`TimeToolAppearanceSettings`, same file)

| key                           | control                                                          | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------- | ----------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mode                          | segmented                                                        | content     | keep               | yes          | resets duration/elapsedTime/isRunning/startTime as a side effect of the switch                                                                                               |
| visualType                    | segmented                                                        | display     | keep               | yes          |                                                                                                                                                                              |
| selectedSound                 | segmented (4-up grid)                                            | content     | keep               | yes          |                                                                                                                                                                              |
| adjustStepSeconds             | number                                                           | behavior    | keep               | yes          | only shown when `mode === 'timer'`                                                                                                                                           |
| timerEndVoiceLevel            | segmented                                                        | behavior    | keep               | no           | fallback: `config.timerEndVoiceLevel != null` check only — no literal fallback, `null`/absent both mean "no action"                                                          |
| timerEndTrafficColor          | segmented                                                        | behavior    | keep               | no           | same as above — `config.timerEndTrafficColor != null`, no literal fallback                                                                                                   |
| timerEndTriggerRandom         | toggle                                                           | behavior    | keep               | no           | no fallback found (`config.timerEndTriggerRandom` used directly as a boolean guard in `useTimeTool.ts`, falsy when absent)                                                   |
| timerEndTriggerNextUp         | toggle                                                           | behavior    | keep               | no           | same as `timerEndTriggerRandom`                                                                                                                                              |
| timerEndTriggerStationsRotate | toggle                                                           | behavior    | keep               | no           | same as `timerEndTriggerRandom`                                                                                                                                              |
| startTime                     | (not user-editable; internal)                                    | behavior    | n/a                | no           | never written by Settings.tsx; set by `useTimeTool.ts` runtime logic only — listed because it's part of `TimeToolConfig` and touched by the mode-switch handlers in Settings |
| fontFamily                    | fontFamily (via `TypographySettings`, `showColorPicker={false}`) | style       | duplicate-of-Style | no           | fallback: `fontFamily = 'global'` (`TimeToolWidget.tsx:402`); **duplicate-of-Style candidate** — TypographySettings is the shared Style-tab primitive                        |
| clockStyle                    | segmented                                                        | style       | keep               | no           | fallback: `clockStyle = 'modern'` (`TimeToolWidget.tsx:403`)                                                                                                                 |
| themeColor                    | accentColor (custom color-dot row)                               | style       | keep               | no           | fallback: `themeColor = STANDARD_COLORS.slate` (`TimeToolWidget.tsx:400`)                                                                                                    |
| glow                          | toggle                                                           | style       | keep               | no           | fallback: `glow = false` (`TimeToolWidget.tsx:401`)                                                                                                                          |

Labels: 33 labels, 2 help strings (`adjustStepHint`, tip callouts count as help/tip text — 4 more: `addExpectationsTip`, `addTrafficLightTip`, `addRandomizerTip`, `addStationsTip`, `addNextUpTip`), t(): all (every visible string in both `TimeToolSettings` and `TimeToolAppearanceSettings` goes through `t()`)

Pre-migration config fixture:

```json
{
  "mode": "timer",
  "visualType": "digital",
  "duration": 600,
  "elapsedTime": 600,
  "isRunning": false,
  "startTime": null,
  "selectedSound": "Gong",
  "adjustStepSeconds": 60,
  "timerEndVoiceLevel": 2,
  "timerEndTrafficColor": "yellow",
  "timerEndTriggerRandom": true,
  "timerEndTriggerNextUp": false,
  "timerEndTriggerStationsRotate": false,
  "themeColor": "#64748b",
  "glow": true,
  "fontFamily": "global",
  "clockStyle": "modern"
}
```

## seating-chart - components/widgets/SeatingChart/Settings.tsx (101 lines); no appearance component registered

| key         | control                                | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                           |
| ----------- | -------------------------------------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| rosterMode  | custom:RosterModeControl               | content     | keep               | yes          | shared `RosterModeControl` component, not a schema-kit field type yet — schema-gap candidate                                                    |
| names       | textarea                               | content     | keep               | no           | fallback: `if (rosterMode === 'custom' && config.names)` in `Widget.tsx:141` — no literal fallback, undefined treated as an empty custom roster |
| assignments | custom:button (Clear Assignments Only) | content     | keep               | yes          | reset-to-`{}` action, not a field the teacher edits directly                                                                                    |
| furniture   | custom:button (Clear All / Reset)      | content     | keep               | yes          | reset-to-`[]` action, also clears `assignments` in the same click                                                                               |

Labels: 4 labels (Custom Roster, Actions, Clear Assignments Only, Clear All (Reset)), 0 help strings, t(): none (all hardcoded English strings)

Pre-migration config fixture:

```json
{
  "furniture": [],
  "assignments": {},
  "gridSize": 20,
  "rosterMode": "custom",
  "names": "Alex Kim\nJordan Lee",
  "template": "freeform",
  "templateColumns": 6
}
```

## catalyst - components/widgets/Catalyst/CatalystSettings.tsx (20 lines); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                |
| ------ | ------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------ |
| (none) | —       | —           | —                  | —            | dead panel: renders a static "Admin Managed" notice and writes no config keys at all |

Labels: 2 labels ("Admin Managed" heading + explanatory paragraph), 0 help strings, t(): none

Pre-migration config fixture:

```json
{}
```

## catalyst-instruction - components/widgets/Catalyst/CatalystInstructionWidget.tsx (54 lines, `CatalystInstructionSettings` exported from same file); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------- | ----------- | ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none) | —       | —           | remove             | —            | dead control: settings panel renders a static "Guide Mode Controls" label only; writes no config. `title`/`instructions` (the actual content fields, read by the front face with `?? 'Instruction Guide'` / `?? ''` fallbacks) are not editable from this panel at all — **schema-gap**: no editor exists for the widget's own content |

Labels: 1 label ("Guide Mode Controls"), 0 help strings, t(): none

Pre-migration config fixture:

```json
{ "routineId": "", "stepIndex": 0 }
```

## catalyst-visual - components/widgets/Catalyst/CatalystVisualWidget.tsx (87 lines, `CatalystVisualSettings` exported from same file); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                  |
| ------ | ------- | ----------- | ------------------ | ------------ | ---------------------------------------------------------------------- |
| (none) | —       | —           | remove             | —            | dead control: static "Visual Anchor Mode" label only, no config writes |

Labels: 1 label ("Visual Anchor Mode"), 0 help strings, t(): none

Pre-migration config fixture:

```json
{ "routineId": "", "stepIndex": 0 }
```

## smartNotebook - components/widgets/SmartNotebook/Settings.tsx (21 lines, `SmartNotebookAppearanceSettings` only — main `WIDGET_SETTINGS_COMPONENTS.smartNotebook` entry is the shared `DefaultSettings` fallback, not this file); appearance: components/widgets/SmartNotebook/Settings.tsx

| key         | control                               | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                               |
| ----------- | ------------------------------------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fontFamily  | fontFamily (`TypographySettings`)     | style       | duplicate-of-Style | no           | fallback not found in this pass (widget renders imported SVG/image pages; per the type comment these appearance fields have "no themed text/surface chrome to apply them to" today) |
| fontColor   | color (`TypographySettings`)          | style       | duplicate-of-Style | no           | see above                                                                                                                                                                           |
| cardColor   | surfaceColor (`SurfaceColorSettings`) | style       | duplicate-of-Style | yes          |                                                                                                                                                                                     |
| cardOpacity | slider (`SurfaceColorSettings`)       | style       | duplicate-of-Style | yes          |                                                                                                                                                                                     |

Main Settings tab (`WIDGET_SETTINGS_COMPONENTS.smartNotebook`) is the shared `DefaultSettings` fallback ("Standard settings available.") — writes nothing; `activeNotebookId`, `storageLimitMb`, `libraryDisplayMode`, `placedAssets` have no settings-panel editor at all (front-face only) — **schema-gap** for all four if a Content group is ever added for this widget.

Labels: 0 labels/help specific to `SmartNotebookAppearanceSettings` beyond what `TypographySettings`/`SurfaceColorSettings` render internally, t(): none

Pre-migration config fixture:

```json
{
  "activeNotebookId": null,
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "fontFamily": "global",
  "fontColor": "#1e293b"
}
```

## traffic - no settings component (`WIDGET_SETTINGS_COMPONENTS.traffic` = shared `DefaultSettings`); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                           |
| ------ | ------- | ----------- | ------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none) | —       | —           | —                  | —            | `DefaultSettings` fallback only ("Standard settings available."); `traffic`'s `WIDGET_DEFAULTS` config is `{}` — the widget has no configurable state to expose |

Labels: 1 label (shared fallback string), 0 help, t(): none

Pre-migration config fixture:

```json
{}
```

## expectations - components/widgets/ExpectationsWidget/Settings.tsx (92 lines); no appearance component registered

| key             | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| syncSoundWidget | toggle  | behavior    | keep               | no           | fallback: `config.syncSoundWidget ?? false`. **Side-effect note**: toggling this also writes `syncSoundWidget: false` on every _other_ `expectations` widget and `syncExpectations` on every `sound` widget on the board — a cross-widget write outside this widget's own config, which the schema/Custom-field model needs to account for explicitly |

`voiceLevel`, `workMode`, `interactionMode` (the widget's actual state, all in `WIDGET_DEFAULTS`) and `instructionalRoutine`/`activeRoutines`/`layout` have no editor in this panel — they're set from the widget's front face — **schema-gap** if Content fields are ever wanted here.

Labels: 2 labels ("Nexus Connections" section label, "Auto-Adjust Sound Meter"), 1 help string (the sync explanation paragraph), t(): none

Pre-migration config fixture:

```json
{
  "voiceLevel": null,
  "workMode": null,
  "interactionMode": null,
  "syncSoundWidget": true
}
```

## schedule - components/widgets/Schedule/Settings.tsx (938 lines); appearance: components/widgets/Schedule/Settings.tsx (`ScheduleAppearanceSettings`, same file)

| key                        | control                                                                  | group guess | keep/remove/rename             | in-defaults? | notes                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------ | ----------- | ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| schedules                  | list (custom drag-and-drop via `@dnd-kit`, per-schedule name/days/items) | content     | keep                           | no           | fallback: `config.schedules ?? []`; migrates legacy `items` into a `schedules[0]` on first schedule-CRUD action                                                                |
| items                      | list (legacy path only)                                                  | content     | rename → fold into `schedules` | yes          | marked `@deprecated` in `types.ts`; kept only for the migration path (`items ?? []`)                                                                                           |
| settingsSelectedScheduleId | (internal tab-selection state)                                           | behavior    | keep                           | no           | fallback: `config.settingsSelectedScheduleId ?? null`; explicitly "Not used by the front-face display" per its `types.ts` doc comment — settings-panel-only persisted UI state |
| autoProgress               | toggle                                                                   | behavior    | keep                           | no           | fallback: `config.autoProgress ?? false`                                                                                                                                       |
| autoScroll                 | toggle                                                                   | behavior    | keep                           | no           | fallback: `config.autoScroll ?? false`                                                                                                                                         |
| expandActiveItem           | toggle                                                                   | behavior    | keep                           | no           | fallback: `config.expandActiveItem ?? true`                                                                                                                                    |
| isBuildingSyncEnabled      | toggle                                                                   | behavior    | keep                           | no           | fallback: `config.isBuildingSyncEnabled ?? true`                                                                                                                               |
| textSizePreset             | textSizePreset (`TextSizePresetSettings`)                                | style       | duplicate-of-Style             | no           | no in-widget fallback found (defers to shared component default)                                                                                                               |
| fontFamily                 | fontFamily (`TypographySettings`)                                        | style       | duplicate-of-Style             | no           | no in-widget fallback found                                                                                                                                                    |
| fontColor                  | color (`TypographySettings`)                                             | style       | duplicate-of-Style             | no           | no in-widget fallback found                                                                                                                                                    |
| cardColor                  | surfaceColor (`SurfaceColorSettings`)                                    | style       | duplicate-of-Style             | yes          |                                                                                                                                                                                |
| cardOpacity                | slider (`SurfaceColorSettings`)                                          | style       | duplicate-of-Style             | yes          |                                                                                                                                                                                |

Note: `localEvents` and `lastSyncedBuildingId` (both in `ScheduleConfig`) are never written by this Settings file — building-sync/internal only, not surfaced to the teacher.

Labels: ~14 labels ("Auto-Checkoff & Scroll", "Auto-Complete Items", "Auto-Scroll View", "Expand Current Event", "Building Integration", "Sync Building Schedule", "Options", "Building Schedules", plus per-schedule/per-item chrome), 4 help strings (one paragraph under each of the three Auto-Checkoff toggles, plus the Building Sync paragraph), t(): none — this is the largest hardcoded-string panel in Part B and the biggest 0.3 string-count contributor

Pre-migration config fixture:

```json
{
  "items": [],
  "schedules": [
    {
      "id": "sched-1",
      "name": "Default Schedule",
      "items": [
        {
          "id": "item-1",
          "task": "Morning Meeting",
          "startTime": "08:00",
          "endTime": "08:15",
          "mode": "clock",
          "linkedWidgets": []
        }
      ],
      "days": [1, 2, 3, 4, 5]
    }
  ],
  "settingsSelectedScheduleId": "sched-1",
  "autoProgress": false,
  "autoScroll": false,
  "expandActiveItem": true,
  "isBuildingSyncEnabled": true,
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "textSizePreset": "medium",
  "fontFamily": "global",
  "fontColor": "#1e293b"
}
```

## classes - no settings component (`WIDGET_SETTINGS_COMPONENTS.classes` = shared `DefaultSettings`); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                     |
| ------ | ------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none) | —       | —           | —                  | —            | `DefaultSettings` fallback only; `WIDGET_DEFAULTS.classes.config` is `{}` — roster management happens via `RosterModeControl`/roster CRUD elsewhere, not a settings panel |

Labels: 1 label (shared fallback string), 0 help, t(): none

Pre-migration config fixture:

```json
{}
```

## recessGear - components/widgets/RecessGear/Settings.tsx (86 lines); no appearance component registered

| key                   | control                                                      | group guess | keep/remove/rename | in-defaults? | notes |
| --------------------- | ------------------------------------------------------------ | ----------- | ------------------ | ------------ | ----- |
| useFeelsLike          | toggle                                                       | behavior    | keep               | yes          |       |
| linkedWeatherWidgetId | select (populated from other `weather` widgets on the board) | behavior    | keep               | yes          |       |

Labels: 3 labels ("Smart Linking", "Use \"Feels Like\" Temp", "Source Weather Widget"), 2 help strings (Smart Linking paragraph, Feels Like sub-label), t(): none

Pre-migration config fixture:

```json
{ "linkedWeatherWidgetId": "weather-widget-1", "useFeelsLike": true }
```

## pdf - components/widgets/PdfWidget/Settings.tsx (43 lines); no appearance component registered

| key           | control                                                     | group guess | keep/remove/rename | in-defaults? | notes                                                                     |
| ------------- | ----------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------- |
| activePdfId   | custom:button (reset to `null` via "Switch to Another PDF") | content     | keep               | yes          |                                                                           |
| activePdfUrl  | custom:button (same reset)                                  | content     | keep               | yes          |                                                                           |
| activePdfName | custom:button (same reset)                                  | content     | keep               | yes          | shown read-only above the button, `?? 'None — library is shown'` fallback |

Labels: 2 labels ("Current Document", "Switch to Another PDF"), 1 help string (storage note), t(): none

Pre-migration config fixture:

```json
{
  "activePdfId": "pdf-abc123",
  "activePdfUrl": "https://storage.example/pdf-abc123.pdf",
  "activePdfName": "Unit 3 Packet.pdf"
}
```

## quiz - components/widgets/QuizWidget/Settings.tsx (77 lines); no appearance component registered

| key                   | control                                                       | group guess | keep/remove/rename | in-defaults?             | notes                                                                                                                                    |
| --------------------- | ------------------------------------------------------------- | ----------- | ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| customTitle           | text                                                          | content     | keep               | n/a (`WidgetData` field) | **writes outside `config`** — this is `widget.customTitle`, not `config.customTitle`; flagged per the "keys written outside config" rule |
| view                  | custom:button (reset to `'manager'`, both buttons)            | behavior    | keep               | yes                      |                                                                                                                                          |
| managerTab            | custom:button (`'archive'` / `'library'`)                     | behavior    | keep               | yes                      |                                                                                                                                          |
| selectedQuizId        | custom:button (reset to `null`, "Reset to Manager View" only) | content     | keep               | yes                      |                                                                                                                                          |
| selectedQuizTitle     | custom:button (same reset)                                    | content     | keep               | yes                      |                                                                                                                                          |
| activeAssignmentId    | custom:button (same reset)                                    | content     | keep               | yes                      |                                                                                                                                          |
| activeLiveSessionCode | custom:button (same reset)                                    | content     | keep               | yes                      |                                                                                                                                          |
| resultsSessionId      | custom:button (same reset)                                    | content     | keep               | yes                      |                                                                                                                                          |

`plcMode`, `plcSheetUrl`, `teacherName`, `periodName`, `plcMemberEmails` (all in `WIDGET_DEFAULTS.quiz`) have no editor in this panel at all — set from the front-face PLC flow — **schema-gap** if ever exposed here.

Labels: 3 labels ("Widget Label", "View Assignment Archive", "Reset to Manager View"), 1 help string (the info callout about front-face management), t(): none

Pre-migration config fixture:

```json
{
  "view": "manager",
  "managerTab": "library",
  "selectedQuizId": null,
  "selectedQuizTitle": null,
  "activeAssignmentId": null,
  "activeLiveSessionCode": null,
  "resultsSessionId": null,
  "plcMode": false,
  "plcSheetUrl": "",
  "teacherName": "",
  "periodName": "",
  "plcMemberEmails": []
}
```

## breathing - components/widgets/Breathing/BreathingSettings.tsx (159 lines); appearance: components/widgets/Breathing/BreathingSettings.tsx (`BreathingAppearanceSettings`, same file)

| key         | control                                                  | group guess | keep/remove/rename | in-defaults? | notes                          |
| ----------- | -------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------ |
| pattern     | segmented (custom button list)                           | content     | keep               | yes          |                                |
| visual      | segmented (3-up icon grid)                               | display     | keep               | yes          |                                |
| color       | accentColor (custom color-dot row from `WIDGET_PALETTE`) | style       | keep               | yes          |                                |
| cardColor   | surfaceColor (`SurfaceColorSettings`)                    | style       | duplicate-of-Style | yes          |                                |
| cardOpacity | slider (`SurfaceColorSettings`)                          | style       | duplicate-of-Style | yes          |                                |
| fontFamily  | fontFamily (`TypographySettings`)                        | style       | duplicate-of-Style | no           | no fallback found in this pass |
| fontColor   | color (`TypographySettings`)                             | style       | duplicate-of-Style | no           | no fallback found in this pass |

Labels: 4 labels ("Pattern", "Visual Style", "Color Theme", plus per-pattern/per-visual button labels), 0 help strings, t(): none

Pre-migration config fixture:

```json
{
  "pattern": "4-7-8",
  "visual": "lotus",
  "color": "#3b82f6",
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "fontFamily": "global",
  "fontColor": "#1e293b"
}
```

## mathTools - components/widgets/MathTools/Settings.tsx (100 lines); appearance: components/widgets/MathTools/Settings.tsx (`MathToolsAppearanceSettings`, same file)

| key            | control                                                                                        | group guess | keep/remove/rename | in-defaults? | notes                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------- |
| dpiCalibration | number (with local text-input draft state + Apply/Reset buttons — not a pure controlled field) | behavior    | keep               | no           | fallback: `config.dpiCalibration ?? CSS_PPI` (`CSS_PPI` = 96) |
| cardColor      | surfaceColor                                                                                   | style       | duplicate-of-Style | yes          |                                                               |
| cardOpacity    | slider                                                                                         | style       | duplicate-of-Style | yes          |                                                               |
| fontFamily     | fontFamily                                                                                     | style       | duplicate-of-Style | no           | no fallback found in this pass                                |
| fontColor      | color                                                                                          | style       | duplicate-of-Style | no           | no fallback found in this pass                                |

Labels: 3 labels ("Math Tools Palette", "Palette DPI Calibration (px / inch)", grade-level note), 3 help strings (the explanatory paragraph under each of the three static info blocks), t(): none

Pre-migration config fixture:

```json
{
  "dpiCalibration": 96,
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "fontFamily": "global",
  "fontColor": "#1e293b"
}
```

## mathTool - components/widgets/MathToolInstance/Settings.tsx (279 lines); no appearance component registered

| key            | control                                                                      | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| toolType       | segmented (grid of tool buttons, generated from `MATH_TOOL_META`)            | content     | keep               | yes          |                                                                                                                                     |
| rotation       | slider + number-of-preset-buttons (0/45/90/180/270)                          | display     | keep               | no           | fallback: `config.rotation ?? 0` (`Widget.tsx:147`); only shown when `ROTATABLE_TOOLS.includes(toolType)`                           |
| numberLineMode | segmented                                                                    | content     | keep               | no           | fallback: `config.numberLineMode ?? 'integers'` (both in Settings and `Widget.tsx:89`); only shown for `toolType === 'number-line'` |
| numberLineMin  | number                                                                       | content     | keep               | no           | fallback: `config.numberLineMin ?? -10` (`Widget.tsx:90`)                                                                           |
| numberLineMax  | number                                                                       | content     | keep               | no           | fallback: `config.numberLineMax ?? 10` (`Widget.tsx:91`)                                                                            |
| rulerUnits     | segmented                                                                    | content     | keep               | yes          | only shown for `toolType === 'ruler-in' \| 'ruler-cm'`                                                                              |
| pixelsPerInch  | number (draft-state Apply/Reset, same pattern as `mathTools.dpiCalibration`) | behavior    | keep               | yes          |                                                                                                                                     |

`fractionDenominator`, `calcDisplay`, `calcExpression`, `stickerMode`, `stickerPiece`, `placeValueBlocks`, `placeValueColumns` (all in `MathToolConfig`) have no editor in this panel — front-face/runtime only.

Labels: 6 labels ("Tool Type", "Rotation (N°)", "Mode", "Min", "Max", "Units Displayed"), 1 help string (DPI calibration paragraph), t(): none

Pre-migration config fixture:

```json
{
  "toolType": "number-line",
  "pixelsPerInch": 96,
  "rulerUnits": "both",
  "numberLineMode": "integers",
  "numberLineMin": -10,
  "numberLineMax": 10,
  "rotation": 0
}
```

## nextUp - components/widgets/NextUp/Settings.tsx (433 lines); no appearance component registered

| key                | control                                                                                                                           | group guess | keep/remove/rename | in-defaults?                                                                                                | notes                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| activeDriveFileId  | custom:DriveFilePicker (new-file creation flow + `<select>` over `driveService.listFiles`, plus a reset-to-`null` on session end) | content     | keep               | yes                                                                                                         | schema-gap: needs a dedicated Drive-file-session field type                                             |
| sessionName        | custom (set via `showPrompt` dialog on session start; reset to `null` on end)                                                     | content     | keep               | yes                                                                                                         |                                                                                                         |
| isActive           | custom:button (Start/End Session flow)                                                                                            | behavior    | keep               | yes                                                                                                         |                                                                                                         |
| createdAt          | custom (stamped `Date.now()` on session start)                                                                                    | behavior    | keep               | yes                                                                                                         |                                                                                                         |
| lastUpdated        | custom (stamped `Date.now()` on roster import)                                                                                    | behavior    | keep               | yes                                                                                                         |                                                                                                         |
| autoStartTimer     | toggle (hand-rolled div, not the shared `Toggle` component)                                                                       | behavior    | keep               | no                                                                                                          | no fallback literal — `config.autoStartTimer` used directly as a truthy/falsy CSS-class switch          |
| displayCount       | slider                                                                                                                            | display     | keep               | yes                                                                                                         |                                                                                                         |
| styling.themeColor | accentColor (custom color-swatch grid)                                                                                            | style       | keep               | yes (`styling` object is in defaults; `themeColor` is a nested property inside it, not a new top-level key) | writes via `{ ...config.styling, themeColor: color }`, i.e. a nested field on a top-level `styling` key |

`styling.fontFamily` and `styling.animation` (both in `WIDGET_DEFAULTS.nextUp.config.styling`) have no editor in this panel — schema-gap if a nested-field kit control is added.

Also writes to two external stores as side effects of session start/end: a Firestore doc at `nextup_sessions/{uid}_{widgetId}` (`setDoc`/`updateDoc`) and a Drive file (`driveService.uploadFile`/`deleteFile`) — neither is `config`, both are flagged as writes outside the widget's own config for the Custom-field design.

Labels: 6 labels ("Session Status", "New Queue", "Load Existing", "Integration & Logic", "Auto-Start Timer", "Display Count", "Visual Style"), 2 help strings ("Start active timer when clicking NEXT", "Show N students"), t(): none

Pre-migration config fixture:

```json
{
  "activeDriveFileId": "drive-file-1",
  "sessionName": "Period 3 Help Queue",
  "isActive": true,
  "createdAt": 1730000000000,
  "lastUpdated": 1730000500000,
  "displayCount": 3,
  "autoStartTimer": true,
  "styling": {
    "fontFamily": "lexend",
    "themeColor": "#2d3f89",
    "animation": "slide"
  }
}
```

## music - components/widgets/MusicWidget/Settings.tsx (427 lines); appearance: components/widgets/MusicWidget/Settings.tsx (`MusicAppearanceSettings`, same file)

| key              | control                                                                   | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| source           | segmented (2-up, gated behind `canAccessFeature('personal-spotify')`)     | content     | keep               | no           | destructured default `source = 'curated'` at the top of `MusicSettings`                                                         |
| layout           | segmented (3-up, custom SVG previews)                                     | display     | keep               | no           | destructured default `layout = 'default'`                                                                                       |
| stationId        | custom:StationPicker (grid of curated stations from `useMusicStations()`) | content     | keep               | yes          |                                                                                                                                 |
| syncWithTimeTool | toggle                                                                    | behavior    | keep               | yes          | also force-cleared to `false` as a side effect of switching to `source: 'personal'` or picking a Spotify-backed curated station |
| bgColor          | color (custom swatch row, 4 fixed options incl. "Transparent")            | style       | duplicate-of-Style | no           | destructured default `bgColor = '#ffffff'`                                                                                      |
| textColor        | color (custom swatch row from `WIDGET_PALETTE` + white)                   | style       | duplicate-of-Style | no           | destructured default `textColor = STANDARD_COLORS.slate`                                                                        |

`personalSpotifyUrl`/`personalSpotifyLabel`/`personalSpotifyThumbnail` are not written directly in `Settings.tsx`; they're set from the nested `PersonalSpotifyPanel` component's own search/select flow (out of scope for this file-level pass, but present in `MusicConfig`).

Labels: 5 labels ("Source", "Curated stations", "My Spotify", "Layout", "Select a Station", "Sync with Time Tool", "Background", "Text Color"), 1 help string (the sync-disabled/enabled explanatory line, which swaps text based on state), t(): none

Pre-migration config fixture:

```json
{
  "stationId": "station-1",
  "syncWithTimeTool": false,
  "bgColor": "#ffffff",
  "textColor": "#64748b",
  "layout": "default",
  "source": "curated"
}
```

## countdown - components/widgets/Countdown/Settings.tsx (225 lines); appearance: components/widgets/Countdown/Settings.tsx (`CountdownAppearanceSettings`, same file)

| key             | control                                                           | group guess | keep/remove/rename | in-defaults? | notes                                      |
| --------------- | ----------------------------------------------------------------- | ----------- | ------------------ | ------------ | ------------------------------------------ |
| title           | text                                                              | content     | keep               | yes          |                                            |
| startDate       | text (`type="date"`, ISO-string round-trip via local helpers)     | content     | keep               | yes          |                                            |
| eventDate       | text (`type="date"`, same helpers)                                | content     | keep               | yes          |                                            |
| viewMode        | segmented                                                         | display     | keep               | yes          |                                            |
| includeWeekends | toggle                                                            | behavior    | keep               | yes          |                                            |
| countToday      | toggle                                                            | behavior    | keep               | yes          |                                            |
| fontFamily      | fontFamily (`TypographySettings`)                                 | style       | duplicate-of-Style | no           | no fallback found in this pass             |
| eventColor      | color (swatch row from `TEXT_COLOR_PRESETS` + native color input) | style       | keep               | no           | fallback: `config.eventColor ?? '#2d3f89'` |
| cardColor       | surfaceColor                                                      | style       | duplicate-of-Style | yes          |                                            |
| cardOpacity     | slider                                                            | style       | duplicate-of-Style | yes          |                                            |

Labels: 6 labels ("Event Title", "Start Date", "Event Date", "View Mode", "Include weekends", "Count today", "Event Title Color"), 0 help strings, t(): none

Pre-migration config fixture:

```json
{
  "title": "Special Event",
  "startDate": "2026-09-05T00:00:00.000Z",
  "eventDate": "2026-09-12T00:00:00.000Z",
  "includeWeekends": true,
  "countToday": true,
  "viewMode": "number",
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "fontFamily": "global",
  "eventColor": "#2d3f89"
}
```

## car-rider-pro - components/widgets/CarRiderPro/Settings.tsx (17 lines); no appearance component registered

| key    | control | group guess | keep/remove/rename | in-defaults? | notes                                                                                                              |
| ------ | ------- | ----------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| (none) | —       | —           | —                  | —            | dead panel: static "centrally managed" notice, writes no config. `WIDGET_DEFAULTS['car-rider-pro'].config` is `{}` |

Labels: 1 label (the notice paragraph), 0 help, t(): none

Pre-migration config fixture:

```json
{}
```

---

## Summary

| widget               | keys                                         | labels | help | t()  | not-in-defaults |
| -------------------- | -------------------------------------------- | ------ | ---- | ---- | --------------- |
| time-tool            | 14                                           | 33     | 6    | all  | 10              |
| seating-chart        | 4                                            | 4      | 0    | none | 1               |
| catalyst             | 0                                            | 2      | 0    | none | 0               |
| catalyst-instruction | 0 (1 dead control)                           | 1      | 0    | none | 0               |
| catalyst-visual      | 0 (1 dead control)                           | 1      | 0    | none | 0               |
| smartNotebook        | 4 (appearance only; main tab writes nothing) | 0      | 0    | none | 2               |
| traffic              | 0                                            | 1      | 0    | none | 0               |
| expectations         | 1                                            | 2      | 1    | none | 1               |
| schedule             | 11                                           | 14     | 4    | none | 7               |
| classes              | 0                                            | 1      | 0    | none | 0               |
| recessGear           | 2                                            | 3      | 2    | none | 0               |
| pdf                  | 3                                            | 2      | 1    | none | 0               |
| quiz                 | 7 config + 1 WidgetData field                | 3      | 1    | none | 0               |
| breathing            | 7                                            | 4      | 0    | none | 2               |
| mathTools            | 5                                            | 3      | 3    | none | 2               |
| mathTool             | 7                                            | 6      | 1    | none | 4               |
| nextUp               | 8                                            | 6      | 2    | none | 1               |
| music                | 6                                            | 8      | 1    | none | 4               |
| countdown            | 10                                           | 6      | 0    | none | 2               |
| car-rider-pro        | 0                                            | 1      | 0    | none | 0               |
