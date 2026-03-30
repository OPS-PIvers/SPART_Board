## 2026-04-18 - Refactored ScheduleWidget

**Weed:** `ScheduleWidget.tsx` was over 900 lines long, containing multiple internal components (`CountdownDisplay`, `ScheduleRow`) and numerous helper functions, acting as a "God Component" for the scheduling logic.
**Root Cause:** "God Component" pattern where the feature was built out incrementally over time, mixing UI, time parsing, formatting, and complex layout logic into a single file without separating concerns.
**Plan:** Extracted the utility functions (`parseScheduleTime`, `formatCountdown`, `hexToRgba`, etc.) into `components/widgets/Schedule/utils.ts`. Extracted the internal sub-components (`ScheduleRow`, `CountdownDisplay`) into `components/widgets/Schedule/components/ScheduleRow.tsx`. Kept the main orchestration logic in `ScheduleWidget.tsx`.
