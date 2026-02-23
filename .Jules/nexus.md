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

### Weather Widget -> Dashboard Background

**Description:** Automatically changes the dashboard background theme to match the current weather conditions (e.g., Blue gradient for Sunny, Dark gradient for Rainy).
**Implementation:** `WeatherWidget.tsx` monitors the `condition` state and calls `setBackground` on the dashboard context when `syncBackground` is enabled.
**Configuration:** Enabled via the "Sync Background" toggle in Weather Settings.

### TimeTool -> Traffic Light

**Description:** Automatically changes the traffic light color when the timer ends.
**Implementation:** `useTimeTool.ts` checks for `timerEndTrafficLight` config and triggers `updateWidget` on any active `traffic-light` widget.
**Configuration:** Enabled via the "Timer End Action" section in TimeTool Settings.

## Planned Connections

## WILL NOT IMPLEMENT

- **Poll -> Scoreboard:** this is not a connection that adds meaningful value.

## 2024-05-23 - [Traffic Light Integration] **Source:** TimeTool (Timer Ends) **Destination:** Traffic Light (Color Change) **Value:** Automates classroom management by visually signaling when time is up.
