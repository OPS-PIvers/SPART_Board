# Unifier: Visual Consistency & Design Systems

Unifier is responsible for maintaining a consistent look and feel across all School Boards widgets, ensuring adherence to the brand's aesthetic and accessibility standards.

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

## 2026-01-31 - Standardized Widget Header Buttons

**Drift:** `InstructionalRoutinesWidget` used hardcoded `<button>` elements with `text-blue-600` (instead of `brand-blue-primary`) and inconsistent spacing/hover states for "Manage" and "Clear Board" actions.
**Fix:** Refactored to use standard `<Button>` component. Added `ghost-primary` variant to `Button` to support brand-colored text buttons, and refined `Button` gap sizing logic (moved to size-specific styles) for better density controls on small screens.
