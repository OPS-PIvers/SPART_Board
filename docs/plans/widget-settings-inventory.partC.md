# Part C

Widgets covered: `blending-board`, `specialist-schedule`, `graphic-organizer`, `reveal-grid`,
`numberLine`, `syntax-framer`, `hotspot-image`, `concept-web`, `starter-pack`, `video-activity`,
`guided-learning`, `custom-widget`, `activity-wall`, `work-symbols`, `blooms-taxonomy`,
`talking-tool`, `need-do-put-then`, `stations`, `stickers`.

None of these 19 widgets' settings/appearance files import `react-i18next` or call `t()` — every
visible label and help string below is a hardcoded English literal. Shared field primitives used
across this part (`TypographySettings`, `SurfaceColorSettings`, `TextSizePresetSettings` —
`components/common/*.tsx`) are likewise not translated. Per D4's documented interim behavior, every
widget below whose per-widget appearance component writes `fontFamily`/`fontColor`/`cardColor`/
`cardOpacity`/`textSizePreset` is a **duplicate-of-Style** case today: the Window tier (D18) already
exposes a frame background + window font + window text size control, and until this widget migrates
its legacy appearance component renders a second, content-tier font/color/size control alongside it.
This is flagged once per widget below rather than repeated per key.

## blending-board - components/widgets/BlendingBoard/Settings.tsx (28 lines)

No table — `BlendingBoardSettings` and `BlendingBoardAppearanceSettings` both render a static
read-only notice (`CentrallyManagedNotice`) and call no `updateWidget`/`updateConfig`. Zero config
keys written. `BlendingBoardConfig` is `Record<string, never>` and `widgetDefaults.ts` gives it
`config: {}`. The appearance component is a deliberate override that **suppresses** the default
`UniversalStyleSettings` Style-tab fallback (per its own comment) because the widget is an
admin-controlled iframe with no visual knobs.

Labels: 0 labels, 0 help strings, t(): none (no fields to label; the notice text itself is not a
field help string).

Pre-migration config fixture:

```json
{}
```

## specialist-schedule - components/widgets/SpecialistSchedule/Settings.tsx (731 lines)

| key            | control                                                                                                                                    | group guess | keep/remove/rename       | in-defaults?      | notes                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| cycleDays      | list (per-day array of `{dayNumber, items[]}`, each item text+time inputs)                                                                 | content     | keep                     | yes (`[]`)        | Rotation tab. Read as `cycleDays = []` fallback in front face too.             |
| recurringItems | list (daily/weekly items, text+time+day-of-week select)                                                                                    | content     | keep                     | no                | Front-face fallback `recurringItems = []` (`SpecialistScheduleWidget.tsx`).    |
| fontFamily     | fontFamily (via `TypographySettings`)                                                                                                      | style       | keep, duplicate-of-Style | no                | Fallback `'global'` in front face. Duplicate-of-Style (see header note).       |
| fontColor      | color (via `TypographySettings`)                                                                                                           | style       | keep, duplicate-of-Style | no                | Fallback `'#334155'` in front face. Duplicate-of-Style.                        |
| textSizePreset | textSizePreset (via `TextSizePresetSettings`, `writeScaleMultiplier` not passed → defaults `false`, so `scaleMultiplier` is never written) | style       | keep, duplicate-of-Style | no                | Read via `resolveTextPresetMultiplier(textSizePreset, 1)`. Duplicate-of-Style. |
| cardColor      | surfaceColor (via `SurfaceColorSettings`)                                                                                                  | style       | keep, duplicate-of-Style | yes (`'#ffffff'`) | Duplicate-of-Style.                                                            |
| cardOpacity    | slider (via `SurfaceColorSettings`)                                                                                                        | style       | keep, duplicate-of-Style | yes (`1`)         | Duplicate-of-Style.                                                            |

Also note: the widget-level building-admin config (`cycleLength`, `dayLabel`, `customDayNames`,
`specialistOptions`) is read here but written only through Feature Permissions admin UI, not this
settings panel — not a widget-config key.

Labels: 15 labels (10 `SettingsLabel` instances in-file — Rotation/Recurring tab content headers
"Schedule", "Every Day", "Specific Day of Week", "Activity Name" ×2, "Start Time" ×2, "End Time" ×2,
"Repeat Every" — plus 5 from the shared components: Typography's "Typography" + "Text Color",
TextSizePresetSettings' "Text Size", SurfaceColorSettings' "Surface" + "Opacity"), 0 help strings,
t(): none.

Pre-migration config fixture:

```json
{
  "cycleDays": [
    {
      "dayNumber": 1,
      "items": [
        {
          "id": "i1",
          "startTime": "09:00",
          "endTime": "09:30",
          "task": "Music"
        }
      ]
    }
  ],
  "recurringItems": [
    {
      "id": "r1",
      "startTime": "11:30",
      "endTime": "12:00",
      "task": "🛝 Recess",
      "type": "daily"
    }
  ],
  "fontFamily": "font-sans",
  "fontColor": "#334155",
  "textSizePreset": "medium",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## graphic-organizer - components/widgets/GraphicOrganizer/Settings.tsx (89 lines)

| key          | control                                                      | group guess | keep/remove/rename       | in-defaults?      | notes                                                                                       |
| ------------ | ------------------------------------------------------------ | ----------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| templateType | select                                                       | content     | keep                     | yes (`'frayer'`)  | Includes a dynamic `<optgroup>` of admin-defined custom templates from Feature Permissions. |
| fontFamily   | fontFamily (`TypographySettings`, `showColorPicker={false}`) | style       | keep, duplicate-of-Style | no                | Fallback chain `config.fontFamily ?? templateFontFamily ?? 'global'` in front face.         |
| cardColor    | surfaceColor (`SurfaceColorSettings`)                        | style       | keep, duplicate-of-Style | yes (`'#ffffff'`) |                                                                                             |
| cardOpacity  | slider (`SurfaceColorSettings`)                              | style       | keep, duplicate-of-Style | yes (`1`)         |                                                                                             |

Labels: 4 labels ("Template Type" `<label>` + Typography's "Typography" [no Text Color since
`showColorPicker={false}`] + Surface's "Surface" + "Opacity"), 0 help strings, t(): none.

Pre-migration config fixture:

```json
{
  "templateType": "frayer",
  "nodes": {},
  "fontFamily": "font-sans",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## reveal-grid - components/widgets/RevealGrid/Settings.tsx (703 lines)

| key                  | control                                                                      | group guess | keep/remove/rename       | in-defaults?       | notes                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------- | ----------- | ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| columns              | segmented (2/3/4/5 buttons)                                                  | display     | keep                     | yes (`3`)          |                                                                                                                                                                                                                                             |
| isMemoryMode         | segmented (Review/Memory buttons)                                            | behavior    | keep                     | no                 | Fallback `undefined`→falsy in front face.                                                                                                                                                                                                   |
| revealMode           | segmented (flip/fade)                                                        | display     | keep                     | yes (`'flip'`)     |                                                                                                                                                                                                                                             |
| setName              | text                                                                         | content     | keep                     | no                 | Not read by the front-face widget at all — only used by the settings panel itself for Drive save/load bookkeeping (file name). Not a dead control in the strict sense (it drives a real save action) but has no visual effect on the board. |
| activeDriveFileId    | custom: hidden Drive-sync id (set on save/load, not directly editable)       | behavior    | keep                     | no                 | Same as `setName` — Drive bookkeeping only, not rendered on the board.                                                                                                                                                                      |
| cards                | list (paste-from-sheet / CSV upload / manual add, each with front/back text) | content     | keep                     | yes (3 seed cards) |                                                                                                                                                                                                                                             |
| fontFamily           | fontFamily (`TypographySettings`, `showColorPicker={false}`)                 | style       | keep, duplicate-of-Style | no                 | Fallback `'global'`.                                                                                                                                                                                                                        |
| defaultCardColor     | color                                                                        | style       | keep                     | no                 | Fallback `'#dbeafe'`; applies to new cards only (per-card `bgColor` overrides).                                                                                                                                                             |
| defaultCardBackColor | color                                                                        | style       | keep                     | no                 | Fallback `'#dcfce7'`.                                                                                                                                                                                                                       |

Labels: 14 labels (7 `SettingsLabel`: "Columns", "Game Mode", "Reveal Mode", "Practice Set",
"Cards (N)", "Default Card Front Color", "Default Card Back Color"; 6 `<label>`: "Set Name", "Load
Existing Set", "Paste two columns (Term, Definition)", "Front (Question / Term)", "Back (Answer /
Definition)", plus one more inline label; 1 from Typography's "Typography" [`showColorPicker=false`
suppresses "Text Color"]), 3 help strings ("In Memory mode, the grid acts as a matching game...",
"Applied to all new cards (per-card colors override this)", "Background color for revealed cards"),
t(): none.

Pre-migration config fixture:

```json
{
  "columns": 3,
  "cards": [
    {
      "id": "1",
      "frontContent": "Question 1",
      "backContent": "Answer 1",
      "isRevealed": false
    }
  ],
  "revealMode": "flip",
  "isMemoryMode": false,
  "fontFamily": "font-sans",
  "defaultCardColor": "#dbeafe",
  "defaultCardBackColor": "#dcfce7",
  "setName": "Biology Ch 4",
  "activeDriveFileId": null
}
```

## numberLine - components/widgets/NumberLine/Settings.tsx (447 lines)

| key         | control                                           | group guess | keep/remove/rename       | in-defaults?       | notes                                                                                          |
| ----------- | ------------------------------------------------- | ----------- | ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------- |
| min         | number (blur-committed, Escape-cancel)            | content     | keep                     | yes (`0`)          | Clamped to ±1000 and to `<= max`.                                                              |
| max         | number (blur-committed, Escape-cancel)            | content     | keep                     | yes (`10`)         | Clamped to ±1000 and to `>= min`.                                                              |
| step        | number (blur-committed, Escape-cancel)            | content     | keep                     | yes (`1`)          | Clamped so total ticks stay under 5000.                                                        |
| displayMode | select (integers/decimals/fractions)              | display     | keep                     | yes (`'integers'`) |                                                                                                |
| showArrows  | toggle                                            | display     | keep                     | yes (`true`)       |                                                                                                |
| markers     | list (value + label text + per-item color picker) | content     | keep                     | yes (`[]`)         | New markers auto-colored from `WIDGET_PALETTE`.                                                |
| jumps       | list (start/end/label add-form)                   | content     | keep                     | yes (`[]`)         |                                                                                                |
| fontFamily  | fontFamily (`TypographySettings`)                 | style       | keep, duplicate-of-Style | no                 | Fallback `undefined` (no `'global'` sentinel needed — front face treats undefined as inherit). |
| fontColor   | color (`TypographySettings`)                      | style       | keep, duplicate-of-Style | no                 | Fallback `'#1e293b'`.                                                                          |
| cardColor   | surfaceColor (`SurfaceColorSettings`)             | style       | keep, duplicate-of-Style | yes (`'#ffffff'`)  |                                                                                                |
| cardOpacity | slider (`SurfaceColorSettings`)                   | style       | keep, duplicate-of-Style | yes (`1`)          |                                                                                                |

Labels: 16 labels (8 `SettingsLabel`: "Axis Configuration", "Markers", "Jumps", "Value", "Label",
"Start", "End", plus one more via `htmlFor`; 4 `<label>`: "Min Value", "Max Value", "Step
(Interval)", "Display Mode"; 2 from Typography [Typography + Text Color, `showColorPicker` default
true]; 2 from Surface [Surface + Opacity]), plus one visible "Show arrows on ends" toggle caption
(counted as a label). 0 help strings, t(): none.

Pre-migration config fixture:

```json
{
  "min": -10,
  "max": 10,
  "step": 1,
  "displayMode": "integers",
  "showArrows": true,
  "markers": [{ "id": "m1", "value": 5, "label": "Start", "color": "#3b82f6" }],
  "jumps": [{ "id": "j1", "startValue": 0, "endValue": 5, "label": "+5" }],
  "fontFamily": "font-sans",
  "fontColor": "#1e293b",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## syntax-framer - components/widgets/SyntaxFramer/Settings.tsx (189 lines)

No appearance component registered for `syntax-framer` (not present in
`WIDGET_APPEARANCE_COMPONENTS`), so its Style tab today shows only the universal fallback.

| key       | control                                                                                                                                            | group guess | keep/remove/rename | in-defaults?     | notes                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ---------------- | -------------------------------------------- |
| tokens    | custom: text-to-token retokenizer (textarea, auto-splits on save/mode-change, preserves existing token ids/colors/mask state where a word repeats) | content     | keep               | yes (`[]`)       |                                              |
| mode      | segmented (Text/Math)                                                                                                                              | content     | keep               | yes (`'text'`)   | Changing mode re-tokenizes the current text. |
| alignment | segmented (Left/Center icons)                                                                                                                      | display     | keep               | yes (`'center'`) |                                              |

Labels: 3 labels ("Content", "Mode", "Alignment" — all `SettingsLabel`), 2 help strings ("Words are
automatically converted to draggable blocks." / "Numbers and math operators are separated into
blocks." toggled by mode, plus the "Tip: Shift+Click a token..." box), t(): none.

Pre-migration config fixture:

```json
{
  "mode": "text",
  "tokens": [{ "id": "t1", "value": "The", "isMasked": false }],
  "alignment": "center"
}
```

## hotspot-image - components/widgets/HotspotImage/Settings.tsx (427 lines)

| key          | control                                                                      | group guess | keep/remove/rename | in-defaults?    | notes                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------- | ----------- | ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| baseImageUrl | imageUpload (Firebase Storage via `useStorage`)                              | content     | keep               | yes (`''`)      | Also drives the "Saved Library" load/save flow (`savedWidgetPresets['hotspot-image']`, a separate profile field, not this widget's config). |
| hotspots     | list (click-to-place pins; per-pin title text, detail textarea, icon picker) | content     | keep               | yes (`[]`)      |                                                                                                                                             |
| popoverTheme | segmented (Light/Dark/Glass)                                                 | style       | keep               | yes (`'light'`) | Appearance tab; hidden entirely until `baseImageUrl` is set.                                                                                |

Labels: 7 labels (4 `SettingsLabel`: "Base Image", "Saved Library", "Interactive Pins (N)", "Popover
Theme"; 3 `<label>`: "Title (Pin N)", "Detail Text", "Icon"), 2 help strings ("Click on the image to
add a new pin.", "Upload an image first to configure appearance options."), t(): none.

Pre-migration config fixture:

```json
{
  "baseImageUrl": "https://example.com/img.png",
  "hotspots": [
    {
      "id": "h1",
      "xPct": 40,
      "yPct": 60,
      "title": "Nucleus",
      "detailText": "Controls the cell",
      "icon": "info",
      "isViewed": false
    }
  ],
  "popoverTheme": "light"
}
```

## concept-web - components/widgets/ConceptWeb/Settings.tsx (124 lines)

| key               | control                                                                                       | group guess | keep/remove/rename       | in-defaults?      | notes                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- | ----------- | ------------------------ | ----------------- | ---------------------------------------------------------- |
| nodes             | custom: "Clear All Nodes & Edges" button only (node CRUD happens on the board face, not here) | content     | keep                     | yes (`[]`)        | Settings tab only offers a bulk-clear action.              |
| edges             | (cleared together with `nodes` by the same button)                                            | content     | keep                     | yes (`[]`)        |                                                            |
| defaultNodeWidth  | slider (5–50%)                                                                                | display     | keep                     | no                | Fallback `15`. Live preview box shown beneath the sliders. |
| defaultNodeHeight | slider (5–50%)                                                                                | display     | keep                     | no                | Fallback `15`.                                             |
| fontFamily        | fontFamily (`TypographySettings`, `showColorPicker={false}`)                                  | style       | keep, duplicate-of-Style | no                | Fallback `'global'`.                                       |
| cardColor         | surfaceColor (`SurfaceColorSettings`)                                                         | style       | keep, duplicate-of-Style | yes (`'#ffffff'`) |                                                            |
| cardOpacity       | slider (`SurfaceColorSettings`)                                                               | style       | keep, duplicate-of-Style | yes (`1`)         |                                                            |

`ConceptWebConfig.fontColor` exists in `types.ts` (written by the shared `TypographySettings` when
`showColorPicker` is true) but this widget passes `showColorPicker={false}`, so `fontColor` is never
written here — a config field that exists on the type but has no writer in this widget's panel.

Labels: 5 labels (2 `<label>`: "Default Node Width (N%)", "Default Node Height (N%)"; 1 Typography
"Typography" [no Text Color]; 2 Surface "Surface" + "Opacity"), 1 help string ("These dimensions
apply to new nodes. You can still resize nodes individually!"), t(): none.

Pre-migration config fixture:

```json
{
  "nodes": [{ "id": "n1", "text": "Idea", "x": 40, "y": 40 }],
  "edges": [],
  "defaultNodeWidth": 15,
  "defaultNodeHeight": 15,
  "fontFamily": "font-sans",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## starter-pack - components/widgets/StarterPack/Settings.tsx (176 lines)

`StarterPackSettings` writes **no `widget.config` keys at all**. "Pack Name" is local component
state (`useState`) used only as the document `name` field for a new Firestore document under
`artifacts/{appId}/users/{uid}/starterPacks` (personal) or `artifacts/{appId}/public/data/
starterPacks` (admin-only global save) — a one-shot capture-and-save action, not a persisted widget
setting. `StarterPackAppearanceSettings` is a static "No additional style settings available."
placeholder with zero controls (dead by construction — it exists only to suppress the universal
Style-tab fallback, same pattern as `blending-board`).

Labels: 1 label ("Pack Name"), 3 help strings ("Captures all open widgets — their types, positions,
and sizes...", "Private — only visible to you", "Building-wide — visible to all teachers"), t():
none.

Pre-migration config fixture:

```json
{}
```

## video-activity - components/widgets/VideoActivityWidget/Settings.tsx (115 lines)

No appearance component registered for `video-activity`.

| key                  | control | group guess | keep/remove/rename | in-defaults? | notes                                             |
| -------------------- | ------- | ----------- | ------------------ | ------------ | ------------------------------------------------- |
| autoPlay             | toggle  | behavior    | keep               | no           | Fallback `false` in both settings and front face. |
| requireCorrectAnswer | toggle  | behavior    | keep               | no           | Fallback `true`.                                  |
| allowSkipping        | toggle  | behavior    | keep               | no           | Fallback `false`.                                 |

Labels: 3 labels ("Auto-Play Video", "Require Correct Answers", "Allow Skipping" — bold captions
next to each toggle, not `<label>` elements but the only visible name for each control), 3 help
strings (the muted description under each toggle), t(): none.

Pre-migration config fixture:

```json
{
  "autoPlay": false,
  "requireCorrectAnswer": true,
  "allowSkipping": false
}
```

## guided-learning - components/widgets/GuidedLearning/Settings.tsx (34 lines)

No appearance component registered for `guided-learning`.

| key  | control                                                                                                    | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| view | custom: single "Go to Library" button that force-navigates the widget's internal view state to `'library'` | behavior    | keep               | no           | No fallback literal needed here — the widget's own view-state machine defaults `view` elsewhere; this panel only ever writes the one literal `'library'`. |

Labels: 1 label ("Go to Library" button, the only actionable control), 1 help string ("Use the main
widget panel to create, edit, and assign guided learning sets. Settings are configured per-set
inside the editor."), t(): none.

Pre-migration config fixture:

```json
{ "view": "library" }
```

## custom-widget - components/widgets/CustomWidget/Settings.tsx (159 lines)

No appearance component registered for `custom-widget` (visual styling, if any, is defined inside
the admin-built widget's own blocks, not this panel).

| key           | control                                                                                                                                                                                                              | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| adminSettings | custom: dynamically-rendered form (text/number/boolean/select) driven by the `CustomWidgetSettingDef[]` the widget's admin author defined; edited in local state and committed by an explicit "Save Settings" button | content     | keep               | no           | Per D13, `CustomWidgetSettingDef` is meant to become a subset of the new field schema; this is the one widget whose "schema" is itself admin-authored data, not a static list, so it is a strong candidate for the custom escape hatch even post-migration. |

Static labels: 0 fixed field labels (all field labels are `def.label ?? def.key`, defined per admin
schema and therefore variable in count and text). 0 help strings (no per-field help wired from
`CustomWidgetSettingDef`). t(): none (and cannot be, since labels are admin-authored runtime data,
not code literals).

Pre-migration config fixture:

```json
{
  "customWidgetId": "widget-doc-1",
  "adminSettings": { "showTimer": true, "maxAttempts": 3 }
}
```

## activity-wall - components/widgets/ActivityWall/Settings.tsx (33 lines)

`ActivityWallSettings` (Content/Behavior/Display tabs) writes **no config keys** — it is two lines
of static text directing the teacher to the front-face Library button, where wall selection/
creation/editing actually happens (each wall's own layout/appearance/rules live on the wall document
itself, not `widget.config`).

| key         | control                               | group guess | keep/remove/rename       | in-defaults? | notes                                                          |
| ----------- | ------------------------------------- | ----------- | ------------------------ | ------------ | -------------------------------------------------------------- |
| fontFamily  | fontFamily (`TypographySettings`)     | style       | keep, duplicate-of-Style | no           | Fallback `'global'` in front face.                             |
| fontColor   | color (`TypographySettings`)          | style       | keep, duplicate-of-Style | no           | Fallback via `pickReadableForeground(cardColor)`.              |
| cardColor   | surfaceColor (`SurfaceColorSettings`) | style       | keep, duplicate-of-Style | no           | Fallback `'#0f172a'` (dark, unlike most widgets' `'#ffffff'`). |
| cardOpacity | slider (`SurfaceColorSettings`)       | style       | keep, duplicate-of-Style | no           | Fallback `0.7`.                                                |

Labels: 4 labels (all from the shared Typography + Surface components: Typography, Text Color,
Surface, Opacity — the Settings tab itself has no field labels), 2 help strings ("Walls are managed
from the widget face.", "Use the Library button to pick, create, edit, duplicate, or delete a
wall..."), t(): none.

Pre-migration config fixture:

```json
{
  "fontFamily": "font-sans",
  "fontColor": "#ffffff",
  "cardColor": "#0f172a",
  "cardOpacity": 0.7
}
```

## work-symbols - components/widgets/WorkSymbols/Settings.tsx (64 lines)

`WorkSymbolsSettings` (Content/Behavior/Display) is `() => null` — a dead component that renders
nothing and writes nothing. All configurable state lives in the appearance panel.

| key            | control                                   | group guess | keep/remove/rename       | in-defaults? | notes                                                                                                                                                                |
| -------------- | ----------------------------------------- | ----------- | ------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fontFamily     | fontFamily (`TypographySettings`)         | style       | keep, duplicate-of-Style | no           | Fallback `'global'`.                                                                                                                                                 |
| fontColor      | color (`TypographySettings`)              | style       | keep, duplicate-of-Style | no           | Fallback `'#1e293b'`.                                                                                                                                                |
| textSizePreset | textSizePreset (`TextSizePresetSettings`) | style       | keep, duplicate-of-Style | no           | Read via `resolveTextPresetMultiplier`.                                                                                                                              |
| titlePosition  | segmented (Bottom/Top)                    | display     | keep                     | no           | Fallback `'bottom'`; arguably a Display-group key that's stranded in the Style tab today rather than a true style key — worth revisiting the group during migration. |

Labels: 4 labels (Typography's "Typography" + "Text Color", TextSizePreset's "Text Size", own
"Title Position"), 0 help strings, t(): none.

Pre-migration config fixture:

```json
{
  "fontFamily": "font-sans",
  "fontColor": "#1e293b",
  "textSizePreset": "medium",
  "titlePosition": "bottom"
}
```

## blooms-taxonomy - components/widgets/BloomsTaxonomy/Settings.tsx (81 lines)

No appearance component registered for `blooms-taxonomy`.

| key               | control                                                     | group guess | keep/remove/rename | in-defaults? | notes                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------- | ----------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enabledCategories | list (checkboxes, one per admin-available content category) | content     | keep               | no           | Not in `widgetDefaults.ts` (`config: {}`); fallback chain is `config.enabledCategories ?? defaultEnabledCategories ?? [...CONTENT_CATEGORIES]`, where `defaultEnabledCategories` comes from the admin's Feature Permissions building config. The set of checkboxes shown is further filtered by the admin's `availableCategories`. |

Labels: 1 heading label ("Content Categories") plus one checkbox label per visible category
(`CATEGORY_LABELS[cat]`, count varies with admin config — typically all `CONTENT_CATEGORIES`, a
small fixed list defined in `./constants`). 1 help string ("Choose which categories appear when you
click a level."), t(): none.

Pre-migration config fixture:

```json
{ "enabledCategories": ["remember", "understand", "apply"] }
```

## talking-tool - components/widgets/TalkingTool/Settings.tsx (33 lines)

`TalkingToolSettings` (Content/Behavior/Display) writes no config keys — static text pointing to
admin-managed Feature Permissions for the actual talking-stem content.

| key         | control                               | group guess | keep/remove/rename       | in-defaults? | notes                                                                                                                                                                                                                     |
| ----------- | ------------------------------------- | ----------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fontFamily  | fontFamily (`TypographySettings`)     | style       | **dead control**         | no           | Never read anywhere in `components/widgets/TalkingTool/` — the front face destructures only `cardColor`/`cardOpacity` off its config (as `widgetConfig`, not `config`). Written by this panel but has zero visual effect. |
| fontColor   | color (`TypographySettings`)          | style       | **dead control**         | no           | Same — never read by the front face.                                                                                                                                                                                      |
| cardColor   | surfaceColor (`SurfaceColorSettings`) | style       | keep, duplicate-of-Style | no           | Consumed: `widgetConfig.cardColor ?? '#ffffff'`.                                                                                                                                                                          |
| cardOpacity | slider (`SurfaceColorSettings`)       | style       | keep, duplicate-of-Style | no           | Consumed: `widgetConfig.cardOpacity ?? 1`.                                                                                                                                                                                |

Labels: 4 labels (Typography's "Typography" + "Text Color", Surface's "Surface" + "Opacity"), 2 help
strings ("Global content settings" caption + "Talking stems and categories are configured by an
admin via Feature Permissions."), t(): none.

Pre-migration config fixture:

```json
{
  "fontFamily": "font-sans",
  "fontColor": "#334155",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## need-do-put-then - components/widgets/NeedDoPutThen/Settings.tsx (379 lines)

| key            | control                                                                                         | group guess | keep/remove/rename       | in-defaults?               | notes                                            |
| -------------- | ----------------------------------------------------------------------------------------------- | ----------- | ------------------------ | -------------------------- | ------------------------------------------------ |
| needItems      | list (icon picker + label text + color + per-item show/hide checkbox, in a collapsible section) | content     | keep                     | yes (`DEFAULT_NEED_ITEMS`) |                                                  |
| doItems        | list (plain numbered textarea steps, no icon/color/checkbox)                                    | content     | keep                     | yes (`DEFAULT_DO_ITEMS`)   | Uses the simpler `ListEditor`, not `TileEditor`. |
| putItems       | list (icon/label/color/checkbox, same shape as `needItems`)                                     | content     | keep                     | yes (`DEFAULT_PUT_ITEMS`)  |                                                  |
| thenItems      | list (icon/label/color, no visibility checkbox — `TileEditor` with `showCheckbox` omitted)      | content     | keep                     | yes (`DEFAULT_THEN_ITEMS`) |                                                  |
| fontFamily     | fontFamily (`TypographySettings`)                                                               | style       | keep, duplicate-of-Style | no                         | Fallback `'global'`.                             |
| fontColor      | color (`TypographySettings`)                                                                    | style       | keep, duplicate-of-Style | no                         | Fallback `'#1e293b'`.                            |
| textSizePreset | textSizePreset (`TextSizePresetSettings`, `writeScaleMultiplier={false}` explicit)              | style       | keep, duplicate-of-Style | no                         |                                                  |
| cardColor      | surfaceColor (`SurfaceColorSettings`)                                                           | style       | keep, duplicate-of-Style | no                         | Fallback `'#ffffff'`.                            |
| cardOpacity    | slider (`SurfaceColorSettings`)                                                                 | style       | keep, duplicate-of-Style | no                         | Fallback `1`.                                    |

`NeedDoPutThenConfig.drawerSize` exists in `types.ts` but is not written by either settings
component here — it is a `WidgetData`-adjacent runtime field set elsewhere (front-face drag/resize
of the drawer tray), out of scope for this inventory row.

Labels: 9 labels (4 `CollapsibleSection` headers: "What you need", "What you do", "Where it goes",
"What's next"; plus Typography ×2, TextSizePreset ×1, Surface ×2), 0 help strings (only `title`
tooltip attributes on icon buttons, e.g. "Restore defaults", "Remove item" — not visible help text),
t(): none.

Pre-migration config fixture:

```json
{
  "needItems": [
    {
      "id": "n1",
      "label": "Pencil",
      "icon": "Pencil",
      "color": "#3b82f6",
      "checked": true
    }
  ],
  "doItems": ["Read the passage", "Answer the questions"],
  "putItems": [
    {
      "id": "p1",
      "label": "Turn-in bin",
      "icon": "Package",
      "color": "#22c55e",
      "checked": true
    }
  ],
  "thenItems": [
    {
      "id": "t1",
      "label": "Read quietly",
      "icon": "BookOpen",
      "color": "#f59e0b"
    }
  ],
  "fontFamily": "font-sans",
  "fontColor": "#1e293b",
  "textSizePreset": "medium",
  "cardColor": "#ffffff",
  "cardOpacity": 1
}
```

## stations - components/widgets/Stations/Settings.tsx (324 lines)

| key         | control                                                                                                                                                                                                                                  | group guess | keep/remove/rename       | in-defaults? | notes                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| stations    | list (delegated to `./components/StationEditor`: title text, color, image upload, reorder up/down, delete)                                                                                                                               | content     | keep                     | yes (`[]`)   | Reorder always renormalizes `order` to `0..N-1`.                                                                         |
| assignments | custom: cleared/remapped as a side effect of station add/delete/preset-load; no direct field in this file (assignment itself happens on the widget face, drag-and-drop)                                                                  | behavior    | keep                     | yes (`{}`)   | Only ever written here to strip a deleted station's id or wipe on preset load — not a user-facing control in this panel. |
| —           | button: "Send Station Names to Randomizer" (writes into a _different_ widget's config — `RandomConfig.firstNames`/`lastNames`/`rosterMode` on the board's Randomizer widget, a cross-widget "Nexus" action, not a `stations` config key) | behavior    | n/a                      | n/a          | Flagging because it is a config-writing control that belongs to another widget type entirely.                            |
| —           | delegated to `./components/SavedPresetsPanel` (load/save/delete named presets to `savedWidgetPresets.stations`, a profile field, not board config)                                                                                       | content     | n/a                      | n/a          | Not inventoried further — out of this file's own JSX, and writes to `savedWidgetPresets`, not `widget.config`.           |
| fontFamily  | fontFamily (`TypographySettings`)                                                                                                                                                                                                        | style       | keep, duplicate-of-Style | no           | Fallback `'global'`.                                                                                                     |
| fontColor   | color (`TypographySettings`)                                                                                                                                                                                                             | style       | keep, duplicate-of-Style | no           | No fallback default in front face (`const fontColor = config.fontColor;`, used directly, may be `undefined`).            |
| cardColor   | surfaceColor (`SurfaceColorSettings`, `label="Card surface"`)                                                                                                                                                                            | style       | keep, duplicate-of-Style | no           | Fallback `'#f8fafc'`.                                                                                                    |
| cardOpacity | slider (`SurfaceColorSettings`)                                                                                                                                                                                                          | style       | keep, duplicate-of-Style | no           | Fallback `0.4`.                                                                                                          |

Labels: at least 6 labels in this file (own "Stations", "Connect with Randomizer"; Typography ×2;
Surface's "Card surface" + "Opacity") — `StationEditor` and `SavedPresetsPanel` are separate files
with their own labels not enumerated here (out of scope: they are not `Settings.tsx`). 0 help
strings in this file's own JSX beyond one conditional info box ("Add a Randomizer widget to send
your station names to it." — counts as 1 help string, so 7 labels/1 help combined for the file
proper), t(): none.

Pre-migration config fixture:

```json
{
  "stations": [
    { "id": "s1", "title": "Reading", "color": "#3b82f6", "order": 0 }
  ],
  "assignments": { "student-1": "s1" },
  "fontFamily": "font-sans",
  "fontColor": "#1e293b",
  "cardColor": "#f8fafc",
  "cardOpacity": 0.4
}
```

## stickers - components/widgets/stickers/StickerBookSettings.tsx (21 lines)

No `WIDGET_SETTINGS_COMPONENTS` entry exists for `stickers` — only an appearance component is
registered (per the registry's own comment: "All sticker configuration lives in the appearance
panel"). Sticker CRUD (upload, favorite, reorder) happens on the widget face via drag-and-drop, not
through any settings/appearance panel.

| key         | control                               | group guess | keep/remove/rename | in-defaults?      | notes                                                                                                                                          |
| ----------- | ------------------------------------- | ----------- | ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| fontFamily  | fontFamily (`TypographySettings`)     | style       | **dead control**   | no                | Never referenced anywhere in `StickerBookWidget.tsx` (no `fontFamily`/`fontColor`/`cardColor`/`cardOpacity` matches at all in the front face). |
| fontColor   | color (`TypographySettings`)          | style       | **dead control**   | no                | Same — never read.                                                                                                                             |
| cardColor   | surfaceColor (`SurfaceColorSettings`) | style       | **dead control**   | yes (`'#ffffff'`) | In `widgetDefaults.ts` but still never read by the front face — a default written for a key nothing consumes.                                  |
| cardOpacity | slider (`SurfaceColorSettings`)       | style       | **dead control**   | yes (`1`)         | Same — defaulted but unread.                                                                                                                   |

This is the one widget in Part C where the entire Style tab is dead: every key it writes is either
never read by the front face at all, or is seeded into `widgetDefaults.ts` for a widget that never
looks at it. Worth flagging to the orchestrator as a real (not `duplicate-of-Style`) bug independent
of this migration.

Labels: 4 labels (Typography ×2, Surface ×2), 0 help strings, t(): none.

Pre-migration config fixture:

```json
{
  "uploadedUrls": ["https://example.com/sticker1.png"],
  "favorites": [],
  "stickerOrder": [],
  "cardColor": "#ffffff",
  "cardOpacity": 1,
  "fontFamily": "font-sans",
  "fontColor": "#334155"
}
```

## Summary

| widget              | keys                 | labels        | help | t()  | not-in-defaults                                                                |
| ------------------- | -------------------- | ------------- | ---- | ---- | ------------------------------------------------------------------------------ |
| blending-board      | 0                    | 0             | 0    | none | n/a                                                                            |
| specialist-schedule | 7                    | 15            | 0    | none | recurringItems, fontFamily, fontColor, textSizePreset                          |
| graphic-organizer   | 4                    | 4             | 0    | none | fontFamily                                                                     |
| reveal-grid         | 9                    | 14            | 3    | none | setName, activeDriveFileId, fontFamily, defaultCardColor, defaultCardBackColor |
| numberLine          | 11                   | 16            | 0    | none | fontFamily, fontColor                                                          |
| syntax-framer       | 3                    | 3             | 2    | none | (none — all 3 keys are in defaults)                                            |
| hotspot-image       | 3                    | 7             | 2    | none | (none — all 3 keys are in defaults)                                            |
| concept-web         | 7                    | 5             | 1    | none | defaultNodeWidth, defaultNodeHeight, fontFamily                                |
| starter-pack        | 0                    | 1             | 3    | none | n/a                                                                            |
| video-activity      | 3                    | 3             | 3    | none | autoPlay, requireCorrectAnswer, allowSkipping                                  |
| guided-learning     | 1                    | 1             | 1    | none | view                                                                           |
| custom-widget       | 1                    | 0 (dynamic)   | 0    | none | adminSettings                                                                  |
| activity-wall       | 4                    | 4             | 2    | none | fontFamily, fontColor, cardColor, cardOpacity                                  |
| work-symbols        | 4                    | 4             | 0    | none | fontFamily, fontColor, textSizePreset, titlePosition                           |
| blooms-taxonomy     | 1                    | 1 + N dynamic | 1    | none | enabledCategories                                                              |
| talking-tool        | 4                    | 4             | 2    | none | fontFamily (dead), fontColor (dead), cardColor, cardOpacity                    |
| need-do-put-then    | 9                    | 9             | 0    | none | fontFamily, fontColor, textSizePreset, cardColor, cardOpacity                  |
| stations            | 4 (+2 cross-cutting) | 7             | 1    | none | fontFamily, fontColor, cardColor, cardOpacity                                  |
| stickers            | 4 (all dead)         | 4             | 0    | none | fontFamily, fontColor (cardColor/cardOpacity are in defaults but still dead)   |
