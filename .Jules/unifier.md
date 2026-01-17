## 2025-10-27 - Standardizing Sticky Note Colors

**Drift:** The `TextWidget` (Sticky Note) uses a hardcoded array of hex colors `['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6']` which are disconnected from the central design system.
**Fix:** Moved these colors to `config/colors.ts` as `STICKY_NOTE_COLORS` to ensure they are reusable and maintained in one place.
