
## 2026-01-25 - [Refactor InstructionalRoutinesWidget God Component]
**Weed:** `InstructionalRoutinesWidget.tsx` was a "God Component" handling library management, settings, routine viewing, and library grid viewing in a single file.
**Root Cause:** Multiple distinct views (Admin, Student, Teacher) were implemented in one file using conditional rendering.
**Plan:** Refactor into a directory structure with focused sub-components (`LibraryManager`, `LibraryView`, `RoutineView`, `Settings`).
