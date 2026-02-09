## 2026-02-09 - Accessibility for Testing
**Gap:** ScoreboardItem buttons were inaccessible and untestable with semantic queries because they lacked text or ARIA labels.
**Fix:** Added `aria-label` attributes to the buttons, enabling robust `getByRole` queries and improving accessibility.
