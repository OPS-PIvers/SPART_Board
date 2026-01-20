# Unifier Journal

## 2024-05-21 - [Z-Index Wars]

**Drift:** Found widespread use of arbitrary and competing z-indices (e.g., `z-[10100]`, `z-[20000]`, `z-[9999]`) leading to layering conflicts and maintenance headaches.
**Fix:** Establishing a centralized Z-Index Registry in `tailwind.config.js` and standardizing components to use semantic layer names (e.g., `z-modal`, `z-tooltip`).

## 2025-10-27 - Standardizing Sticky Note Colors

**Drift:** The `TextWidget` (Sticky Note) uses a hardcoded array of hex colors `['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6']` which are disconnected from the central design system.
**Fix:** Moved these colors to `config/colors.ts` as `STICKY_NOTE_COLORS` to ensure they are reusable and maintained in one place.

## 2026-01-18 - SoundWidget Color Standardization

**Drift:** `SoundWidget.tsx` contained hardcoded hex values duplicating the centralized `STANDARD_COLORS` palette.
**Fix:** Replaced hardcoded hex strings with `STANDARD_COLORS` imports to ensure consistency and single source of truth.
