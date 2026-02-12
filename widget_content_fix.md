# Plan: Widget Content Scaling Fix (Final Pass - Fill-First)

## Problem Analysis (Final)

1.  **Too much padding (Clock)**: Using `cqmin` (height in wide widgets) with conservative values like `55%` leaves ~45% empty vertical space.
2.  **Cutoff (Weather)**: Lack of proper width constraints or absolute minimum padding causes text to hit the edges and clip.
3.  **Core Issue**: `cqmin` is too defensive. To "fill the window," we need content to scale relative to _both_ width and height explicitly.

## Goal

Implement "Fill-First Scaling" using `min(Xcqh, Ycqw)` for hero content. This forces content to grow until it hits _either_ the vertical or horizontal "wall" of the container, utilizing ~85-95% of available real estate.

## Implementation Steps

### 1. The "Fill-First" Formula

Instead of `cqmin`, we will use:

- **Hero Text (Clock, Temp)**: `min(80cqh, 25cqw)`
  - _Translation_: Be 80% of the height, but never wider than 25% of the width (tuned for ~5-6 characters).
- **Primary Labels**: `min(10cqh, 95cqw)`
- **Padding**: Standardize on `min(4px, 1cqmin)` for "slight padding" requested by the user.

### 2. Targeted Adjustments

- **Clock**: Time will use `min(75cqh, 25cqw)`. Date will use `min(15cqh, 80cqw)`.
- **Weather**: Temp icon + text will use `min(60cqh, 90cqw)`.
- **Traffic Light**: Housing will use `min(95cqh, 90cqw)`.
- **Poll**: Bars will expand vertically to fill remaining space.

### 3. Standards Update

Update `WIDGET_SCALING_STANDARDS.md` to move away from `cqmin`-only logic for hero content.

### 4. Verification

Test in:

- **Ultra-Wide**: 1000x200
- **Ultra-Tall**: 200x800
- **Square**: 400x400
- **Maximized**: 1920x1080
