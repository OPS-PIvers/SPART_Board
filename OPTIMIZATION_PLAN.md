# Performance and Cost Optimization Plan

This document outlines the strategy for reducing hosting costs, improving initial load times (bundle optimization), and minimizing Firestore write frequency.

## 1. Bundle Optimization (Urgency: High)

Currently, all widgets are imported statically in `WidgetRenderer.tsx`. This means the initial bundle includes every widget's code, even if a teacher only uses one or two.

### Strategy: Code Splitting & Lazy Loading

- **Action:** Convert static imports in `WidgetRenderer.tsx` to `React.lazy()` imports.
- **Benefit:** Reduces the initial "Main" bundle size by ~40-60%. Users only download the code for widgets they actually add to their board.
- **Impact:** Stays under the Firebase Hosting free transfer limit (360MB/day) for significantly more users.

### Action Items:

1. Wrap `WidgetRenderer` content in `<Suspense>`.
2. Replace widget imports with `const ClockWidget = React.lazy(() => import('./ClockWidget'))`.
3. Verify `vite.config.ts` chunking strategy to ensure shared libraries (like Lucide) aren't duplicated.

## 2. Firestore Cost Optimization (Urgency: Medium)

The current 500ms debounce for auto-saves is very aggressive. While it feels "real-time," it generates high write volume during active board setup.

### Strategy: Write Frequency Reduction

- **Action:** Increase `saveTimerRef` debounce from `500ms` to `2000ms`.
- **Benefit:** Reduces Firestore write costs by 60-75% during active editing sessions.
- **Trade-off:** If a user closes the tab within 2 seconds of their last change, those changes might not sync. We should add a "Saving..." indicator or a `beforeunload` listener to mitigate this.

### Action Items:

1. Update `DashboardContext.tsx` debounce constant.
2. (Optional) Implement a "Cloud Sync" status indicator in the UI so users know when it's safe to close the tab.

## 3. Weather API Migration (Urgency: High - Policy Change)

Since OpenWeather is being deprecated in favor of a different path/source, we need to remove the reliance on the `VITE_OPENWEATHER_API_KEY`.

### Strategy: Shift to School Stations & Manual Mode

- **Action:** Default the Weather widget to "School Station" (Earth Networks) or "Manual".
- **Benefit:** Eliminates external API costs and avoids service disruption when the key is disabled.

## 4. Implementation Timeline

| Task                  | Estimated Effort | Impact                  |
| :-------------------- | :--------------- | :---------------------- |
| **Increase Debounce** | 5 mins           | High Cost Savings       |
| **Lazy Load Widgets** | 30 mins          | High Load Performance   |
| **Weather Migration** | 20 mins          | Reliability / Zero Cost |

---

_Prepared on: January 15, 2026_
