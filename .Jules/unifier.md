# Unifier Journal

## 2024-05-21 - [Z-Index Wars]

**Drift:** Found widespread use of arbitrary and competing z-indices (e.g., `z-[10100]`, `z-[20000]`, `z-[9999]`) leading to layering conflicts and maintenance headaches.
**Fix:** Establishing a centralized Z-Index Registry in `tailwind.config.js` and standardizing components to use semantic layer names (e.g., `z-modal`, `z-tooltip`).

## 2026-01-18 - SoundWidget Color Standardization

**Drift:** `SoundWidget.tsx` contained hardcoded hex values duplicating the centralized `STANDARD_COLORS` palette.
**Fix:** Replaced hardcoded hex strings with `STANDARD_COLORS` imports to ensure consistency and single source of truth.
