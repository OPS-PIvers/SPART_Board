# Nexus: Inter-Widget Communication

Nexus is the system that allows widgets to interact with each other, creating a cohesive classroom ecosystem.

## Active Connections

### Random Picker -> Timer

**Description:** Automatically starts a timer when a student/winner is selected.
**Implementation:** `RandomWidget.tsx` checks for `autoStartTimer` config and triggers `updateWidget` on any active `time-tool` widget.
**Configuration:** Enabled via the "Auto-Start Timer" toggle in Random Widget settings (Single mode only).

### Text Widget -> QR Widget (Link Repeater)

**Description:** Automatically generates a QR code for any link pasted into a text widget.
**Implementation:** `QRWidget.tsx` monitors the content of any active text widget and updates its URL if syncing is enabled.
**Configuration:** Enabled via the "Sync with Text Widget" toggle in QR Settings.

### Random Picker -> Poll

**Description:** Instantly creates poll options from randomized groups or selected students.
**Implementation:** `PollWidget.tsx` (in Settings) checks for `activeDashboard`'s `randomWidget` and imports its `lastResult` as poll options.
**Configuration:** Enabled via "Import from Randomizer" button in Poll Settings.

## Planned Connections

- **Poll -> Scoreboard:** Update team scores based on poll results.
- **Timer -> Noise Meter:** Adjust sensitivity based on timer activity (e.g., lower during "quiet time" timers).
- **Instructional Routines -> All:** Bulk-launch tools required for a specific protocol.
- **Noise Meter -> Traffic Light:** Automatically switch Traffic Light to Red when noise level exceeds a threshold.
- **Clock -> Schedule:** Automatically mark schedule items as done based on the current time.
