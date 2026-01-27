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

## 2026-01-20 - [Sticky Note Colors]

**Drift:** Found hardcoded pastel hex values for the TextWidget (Sticky Note) scattered across components, defaults, and helpers.
**Fix:** Centralized these values into `STICKY_NOTE_COLORS` in `config/colors.ts` and refactored dependent files to use the single source of truth.

## 2026-02-14 - [Toggle Switch]

**Drift:** Found multiple hardcoded implementations of toggle switches (e.g., in `LunchCountWidget` and `RandomSettings`) with inconsistent sizing and styling.
**Fix:** Created a standardized `Toggle` component in `components/common/Toggle.tsx` and refactored widgets to use it.

## 2026-02-14 - [Auth Bypass Config]

**Conflict:** The `isAuthBypass` flag in `config/firebase.ts` was hardcoded to `false`, contradicting the documentation that it should be controlled by `VITE_AUTH_BYPASS`.
**Fix:** Updated `config/firebase.ts` to respect the environment variable.

## 2026-02-14 - [Micro Typography]

**Drift:** Widespread use of hardcoded pixel values for small text (e.g., `text-[10px]`, `text-[9px]`, `text-[8px]`) creating visual inconsistency and maintenance debt.
**Fix:** Standardized on new `xxs` (10px) and `xxxs` (8px) font size tokens in `tailwind.config.js` and refactored over 30 components to use them.

## 2026-01-27 - [Style Panel Typography]

**Drift:** The Style Panel contained inconsistent micro-typography with hardcoded values (9px, 10px, 11px) mixing hierarchies.
**Fix:** Standardized all micro-labels to `text-xxs` (10px) and `text-xxxs` (8px) using system tokens.
