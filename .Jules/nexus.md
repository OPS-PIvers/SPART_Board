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

### Poll -> Scoreboard

**Description:** Updates team scores based on poll results where option labels match team names.
**Implementation:** `ScoreboardWidget.tsx` pulls data from any active `poll` widget.
**Configuration:** Triggered via "Import from Poll" button in Scoreboard Settings.

### Noise Meter -> Traffic Light

**Description:** Automatically switches Traffic Light to Red when noise level exceeds a threshold.
**Implementation:** `SoundWidget.tsx` monitors volume levels and updates the Traffic Light widget if enabled.
**Configuration:** Enabled via "Auto-Control Traffic Light" in Sound Widget settings.

### Clock -> Schedule

**Description:** Automatically marks schedule items as done based on the current time.
**Implementation:** `ScheduleWidget.tsx` compares schedule times with the system clock.
**Configuration:** Enabled via "Connect to Clock" toggle in Schedule Settings.

## Planned Connections

- **Timer -> Noise Meter:** Adjust sensitivity based on timer activity (e.g., lower during "quiet time" timers).
- **Instructional Routines -> All:** Bulk-launch tools required for a specific protocol.
