# Catalyst's Journal

## 2025-02-12 - [Batch Actions Pattern]
**Discovery:** Many widgets (Schedule, Checklist) store list data in `config.items` but lack bulk actions in the UI, forcing repetitive clicks.
**Opportunity:** Standardize a "Reset/Clear" pattern using a floating action button (FAB) visible on hover, as implemented in ScheduleWidget and ChecklistWidget. This can be extended to other list-based widgets like Materials or To-Do.
