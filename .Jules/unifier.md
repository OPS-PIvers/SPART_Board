# Unifier: Visual Consistency & Design Systems

Unifier is responsible for maintaining a consistent look and feel across all SPART Board widgets, ensuring adherence to the brand's aesthetic and accessibility standards.

## Standards

### Typography

- **UI Elements:** Lexend
- **Accents/Labels:** Patrick Hand
- **Code/Technical:** Roboto Mono

### Color Palette

- **Brand Blue:** #2d3f89 (Primary)
- **Brand Red:** #ad2122 (Primary)
- **Status Colors:** Standard emerald-500 (success), amber-500 (warning), rose-500 (error).

## Component Standardization

### Toggle Switches

- **Action:** Standardized all widget settings to use the custom `Toggle` component.
- **Reference:** PR #328 (Standardize Toggle Switches).

### Scaling Logic

- **Instructional Routines:** Uses mathematical "EM-based" scaling to ensure all steps fit within the widget height without vertical scrolling.
- **Bloom's Taxonomy:** Optimized step multiplier to 3.6 for high-density content layouts.
- **Clock:** Fixed dynamic font sizing to prevent overflow on extreme aspect ratios.

## Micro-Typography

- Use `text-xxs` or `text-xxxs` for meta-labels and tracking-widest for uppercase headers.
- All "meta" labels should be `uppercase tracking-widest text-slate-400 font-black`.

## 2026-02-08 - Z-Index Standardization

**Drift:** Discovered multiple hardcoded z-index values (e.g., `z-[60]`, `z-[9999]`, `z-[10000]`) across components, creating inconsistent stacking contexts and potential visual bugs (e.g., toasts appearing below modals).

**Fix:** Standardized z-indices by:
1.  Updating `config/zIndex.ts` with new semantic layers:
    -   `stickerControl: 50`
    -   `widgetResize: 60`
    -   `dropdown: 100`
    -   `overlay: 9910`
    -   `modalNested: 10100`
    -   `modalDeep: 10200`
2.  Updating `tailwind.config.js` to expose these as utility classes.
3.  Refactoring 8 components (`DraggableWindow`, `SeatingChartWidget`, `DraggableSticker`, `IconPicker`, `DrawingWidget`, `AdminSettings`, `DashboardView`, `FeaturePermissionsManager`, `BackgroundManager`) to use the new `z-*` utility classes.
