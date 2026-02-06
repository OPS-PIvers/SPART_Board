# Gardener's Journal

## 2025-06-04 - Refactor LunchCountWidget

**Weed:** `LunchCountWidget.tsx` was ~1000 lines, mixing UI components (Widget, Settings, Modal) with complex API fetching logic.
**Root Cause:** "God Component" pattern; new features (Nutrislice sync, reporting modal) were added inline over time.
**Plan:** Decomposed into `components/widgets/LunchCount/` with `Widget.tsx`, `Settings.tsx`, `SubmitReportModal.tsx`, and extracted API logic to `useNutrislice.ts` hook.

## 2025-06-03 - Refactor InstructionalRoutinesWidget

**Weed:** `InstructionalRoutinesWidget.tsx` was >1000 lines, containing the main widget, settings, library manager, and helper components.
**Root Cause:** "God Component" pattern where multiple distinct UI views (Student, Teacher/Settings, Admin/Library) were co-located.
**Plan:** Decomposed into `components/widgets/InstructionalRoutines/` directory with separate files for `Widget`, `Settings`, `LibraryManager`, `IconPicker`, and `constants`. Added basic unit tests.

## 2025-05-30 - Extract Roster Logic from DashboardContext

**Weed:** `DashboardContext.tsx` was over 1400 lines (God Object), mixing global app state with specific Roster management logic (including a mock implementation).
**Root Cause:** Roster features were added directly to the main context provider, coupling distinct domains.
**Plan:** Extracted all roster-related state, effects, and the `MockRosterStore` singleton into a dedicated `useRosters` hook.

## 2025-05-27 - Refactor Dock and Extract Modals

**Weed:** `Dock.tsx` was over 700 lines and contained multiple internal modal components (`WidgetLibrary`, `RenameFolderModal`).
**Root Cause:** Features were added directly to the main file for convenience, leading to a "God Component".
**Plan:** Extracted `WidgetLibrary` and `RenameFolderModal` to `components/layout/dock/` to reduce complexity and file size.

## 2025-02-18 - [Extracted Complex Audio Logic from TimeToolWidget]

**Weed:** Complex logic (audio synthesis with `AudioContext`) mixed with UI component logic (`TimeToolWidget`).
**Root Cause:** Feature grew over time; audio logic is verbose and was implemented inline.
**Plan:** Extracted to `utils/timeToolAudio.ts` with Singleton pattern and SSR safety.

## 2024-05-23 - Refactor Sidebar and Extract SortableDashboardItem

**Weed:** `Sidebar.tsx` was over 1400 lines and contained a large inner component definition (`SortableDashboardItem`) and duplicated background fetching logic found in `useBackgrounds`.
**Root Cause:** Component grew organically as features were added (boards, backgrounds, widgets) without separating concerns.
**Plan:** Extract sub-components and leverage existing hooks to reduce file size and improve readability/maintainability.

## 2025-06-05 - Refactor WeatherWidget

**Weed:** `WeatherWidget.tsx` was ~930 lines, mixing UI components (Widget, Settings), API fetching logic (OpenWeather, EarthNetworks), and Firebase subscription logic in a single file.
**Root Cause:** "God Component" pattern; fetching logic and multiple view modes were co-located.
**Plan:** Decomposed into `components/widgets/Weather/` with `Widget.tsx`, `Settings.tsx`, `useWeather.ts`, `weatherService.ts`, `types.ts`, and `constants.ts`. Extracted API logic to service and state logic to hook.
