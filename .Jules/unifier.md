# Unifier Journal

## 2024-05-21 - [Z-Index Wars] **Drift:** Found widespread use of arbitrary and competing z-indices (e.g., `z-[10100]`, `z-[20000]`, `z-[9999]`) leading to layering conflicts and maintenance headaches. **Fix:** Establishing a centralized Z-Index Registry in `tailwind.config.js` and standardizing components to use semantic layer names (e.g., `z-modal`, `z-tooltip`).

## 2026-01-20 - [Sticky Note Colors] **Drift:** Found hardcoded pastel hex values for the TextWidget (Sticky Note) scattered across components, defaults, and helpers. **Fix:** Centralized these values into `STICKY_NOTE_COLORS` in `config/colors.ts` and refactored dependent files to use the single source of truth.
