## 2024-05-23 - Checklist Widget **Discovery:** `ChecklistWidget` tracks completion state (`completedNames` or `items[i].completed`). It has "Reset" but no "Export". **Opportunity:** Exporting a checklist (e.g. "Who turned in the permission slip?") is a classic teacher need.

**Decision:** I will implement "Export CSV" for the `ChecklistWidget`. It's a high-value, low-effort feature that uses existing data.

**Plan:**

1.  **Verify:** Create a test case that sets up a checklist and verifies the data structure.
2.  **Implement:** Add `handleExport` to `ChecklistSettings` in `components/widgets/ChecklistWidget.tsx`.
    - It needs to handle 'manual' mode (Task, Status)
    - It needs to handle 'roster' mode (Name, Status)
3.  **UI:** Add an "Export CSV" button to the settings panel.
4.  **Verify:** Run tests and ensure no regressions.
