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

## UNIFIER'S JOURNAL

## 2024-05-23 - DraggableWindow Toolbar Standardization

**Drift:** The `DraggableWindow` component was using hardcoded HTML `<button>` elements with `p-1 hover:bg-slate-800/10` classes for its toolbar actions (Settings, Close, Minimize) and confirmation dialogs. This created visual inconsistencies ("Snowflakes") and made it harder to maintain shared behaviors.
**Fix:**

1. Enhanced the `Button` component with:
   - `size="icon-sm"` (mapped to `p-1.5`) for dense toolbars.
   - `variant="ghost-secondary"` (neutral gray hover) for unobtrusive actions.
   - `variant="destructive"` (filled red) for confirmation actions.
2. Refactored `DraggableWindow.tsx` to use these standardized components.
