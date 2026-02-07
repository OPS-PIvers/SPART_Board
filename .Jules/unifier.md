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

- **Container Query System:** Widgets with `skipScaling: true` (most widgets) use CSS Container Queries. All front-face content sizing must use `min(Xpx, Ycqmin)` or `min(Xcqw, Ycqh)` patterns in inline `style={{}}` props.
- **NEVER** use hardcoded Tailwind text/icon size classes (`text-sm`, `text-xs`, `w-12 h-12`, `size={24}`) in widget content — they don't scale when the widget is resized.
- **Settings panels** (back-face) don't need container query scaling — normal Tailwind classes are fine there.
- **Empty/error states:** Use the shared `ScaledEmptyState` component (`components/common/ScaledEmptyState.tsx`) for all widget empty and error states. It auto-scales via `cqmin` units.
- **Instructional Routines:** Uses mathematical "EM-based" scaling to ensure all steps fit within the widget height without vertical scrolling.
- **Bloom's Taxonomy:** Optimized step multiplier to 3.6 for high-density content layouts.
- **Clock:** Fixed dynamic font sizing to prevent overflow on extreme aspect ratios.
- **Reference implementations:** `ClockWidget.tsx`, `WeatherWidget.tsx`, `PollWidget.tsx`.

## Micro-Typography

- In **settings panels**, use `text-xxs` or `text-xxxs` for meta-labels and tracking-widest for uppercase headers.
- In **widget content**, use `style={{ fontSize: 'min(10px, 2.5cqmin)' }}` instead of Tailwind text classes.
- All "meta" labels should be `uppercase tracking-widest text-slate-400 font-black`.
