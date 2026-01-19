## 2025-02-14 - TrafficLightWidget Refactor
**Weed:** Inaccessible buttons in `TrafficLightWidget.tsx` (missing `aria-label` and `aria-pressed`).
**Root Cause:** Rapid prototyping likely skipped accessibility best practices.
**Plan:** Added `aria-label` to each button describing its color, and `aria-pressed` to reflect its active state. This enabled robust testing via `getByRole`.
