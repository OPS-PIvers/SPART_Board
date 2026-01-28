# Nexus: Inter-Widget Communication

Nexus is the system that allows widgets to interact with each other, creating a cohesive classroom ecosystem.

## Active Connections

### Random Picker -> Timer

**Description:** Automatically starts a timer when a student/winner is selected.
**Implementation:** `RandomWidget.tsx` checks for `autoStartTimer` config and triggers `updateWidget` on any active `time-tool` widget.
**Configuration:** Enabled via the "Auto-Start Timer" toggle in Random Widget settings (Single mode only).

## Planned Connections

- **Poll -> Scoreboard:** Update team scores based on poll results.
- **Timer -> Noise Meter:** Adjust sensitivity based on timer activity (e.g., lower during "quiet time" timers).
- **Instructional Routines -> All:** Bulk-launch tools required for a specific protocol.
