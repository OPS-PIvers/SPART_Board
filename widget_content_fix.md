# Plan: Widget Content Scaling Fix

## Problem Analysis

The recent transition to a strict `min(Xpx, Ycqmin)` scaling pattern across all widgets has introduced a regression where content feels "tiny" and "centered with excessive padding." This is caused by:

1.  **Low Pixel Caps**: Caps like `min(16px, ...)` prevent text from growing on large screens.
2.  **Conservative Scale Factors**: Using ~20-30% of the smaller dimension (`cqmin`) is insufficient for "hero" content to fill the window.
3.  **Strict cqmin usage**: In non-square widgets, scaling based solely on the smaller dimension leaves the larger dimension mostly empty.

## Goal

Modify widgets to fill ~80-90% of their container's available space while maintaining readability and the "standardized" container query architecture.

## Implementation Steps

### 1. Identify Target Widgets

Apply fixes to all `skipScaling: true` widgets, prioritizing those with the most visible regression:

- **ClockWidget**: Needs much larger time text. (COMPLETED)
- **WeatherWidget**: Needs larger temperature and icon. (COMPLETED)
- **PollWidget**: Needs larger questions and bars. (COMPLETED)
- **TrafficLightWidget**: Needs the light housing to fill the height. (COMPLETED)
- **DiceWidget**: Needs dice to fill more area. (COMPLETED)
- **ScoreboardWidget**: Needs larger team names and scores. (COMPLETED)
- **ExpectationsWidget**: Needs larger category buttons and list items. (COMPLETED)
- **MaterialsWidget**: Needs larger material buttons. (COMPLETED)
- **InstructionalRoutinesWidget**: Needs larger library cards and icons. (COMPLETED)
- **RandomWheel**: Needs wheel to fill more space.
- **CalendarWidget**: Needs larger grid items.

### 2. Standardize "Filling" Formulas

Replace conservative caps with "Aggressive Scaling" formulas:

- **Hero Text (Clock, Temp, Score)**:
  - _Current_: `min(24px, 25cqmin)`
  - _New_: `clamp(24px, 50cqmin, 400px)` or just `55cqmin` to allow full scaling.
- **Primary Labels (Question, Title)**:
  - _Current_: `min(16px, 4cqmin)`
  - _New_: `min(32px, 8cqmin)` (Doubled cap and scale).
- **Secondary Content (Date, Metadata)**:
  - _Current_: `min(12px, 3cqmin)`
  - _New_: `min(18px, 5cqmin)`.

### 3. Layout Adjustments

- **Container Padding**: Reduce internal `div` padding from `3.5cqmin` to `2cqmin` or `1.5cqmin` where appropriate.
- **Traffic Light**: Increase housing size from `25cqmin` to `80cqh` (since it is a vertical-first widget) or a significantly higher `cqmin` value.

### 4. Verification

- Test each modified widget at:
  - **Mini** (Smallest allowed size)
  - **Standard** (Default size)
  - **Maximized** (Full screen)
- Ensure text remains readable but utilizes the maximum possible real estate.

## Proposed Changes (Example: ClockWidget)

```tsx
// FROM:
style={{ fontSize: showSeconds ? '20cqmin' : '30cqmin' }}
// TO:
style={{ fontSize: showSeconds ? '40cqmin' : '55cqmin' }}
```

## Proposed Changes (Example: PollWidget)

```tsx
// FROM:
style={{ fontSize: 'min(16px, 4cqmin)' }} // Question
// TO:
style={{ fontSize: 'min(32px, 8cqmin)' }}
```
