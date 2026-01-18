## 2026-01-18 - SoundWidget Color Standardization

**Drift:** `SoundWidget.tsx` contained hardcoded hex values duplicating the centralized `STANDARD_COLORS` palette.
**Fix:** Replaced hardcoded hex strings with `STANDARD_COLORS` imports to ensure consistency and single source of truth.
