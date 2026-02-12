# Plan: Widget Content Scaling Fix

## Problem Analysis (Updated)

The aggressive `cqmin` scaling implemented in the previous pass caused content to scale to the vertical height of the container without respecting the horizontal boundaries. In wide/short widgets, the text became too wide for the container and was cut off on the sides.

## Goal

Implement "Double-Constrained Scaling" using `min(Vertical_Aggressive, Horizontal_Safe)` to ensure content fills the height where possible but shrinks to fit the width when necessary.

## Implementation Steps

### 1. Identify Target Widgets

Apply fixes to all `skipScaling: true` widgets, prioritizing those with the most visible regression:

- **ClockWidget**: Needs much larger time text but must fit width.
- **WeatherWidget**: Needs larger temperature and icon.
- **PollWidget**: Needs larger questions and bars.
- **TrafficLightWidget**: Needs the light housing to fill the height.
- **DiceWidget**: Needs dice to fill more area.
- **ScoreboardWidget**: Needs larger team names and scores.
- **ExpectationsWidget**: Needs larger category buttons and list items.
- **MaterialsWidget**: Needs larger material buttons.
- **InstructionalRoutinesWidget**: Needs larger library cards and icons.
- **RandomWheel**: Needs wheel to fill more space.
- **CalendarWidget**: Needs larger grid items.

### 2. Standardize "Filling" Formulas (Updated)

Replace conservative caps with "Safe Aggressive Scaling" formulas:

- **Hero Text (Clock, Temp, Score)**:
  - _Current_: `55cqmin`
  - _New_: `min(55cqmin, 22cqw)` (Constrain width to ~80-90% of container)
- **Primary Labels (Question, Title)**:
  - _Current_: `min(32px, 8cqmin)`
  - _New_: `min(32px, 8cqmin, 90cqw)`
- **Secondary Content (Date, Metadata)**:
  - _Current_: `min(24px, 5cqmin)`
  - _New_: `min(24px, 5cqmin, 80cqw)`.

### 3. Layout Adjustments

- **Container Padding**: Maintain low padding (`min(12px, 2cqmin)`) to maximize real estate.
- **Traffic Light**: Increase housing size but ensure it doesn't overflow horizontally.

### 4. Verification

- Test each modified widget at:
  - **Mini** (Smallest allowed size)
  - **Standard** (Default size)
  - **Maximized** (Full screen)
  - **Ultra-Wide** (Short and very wide)
  - **Tall/Narrow** (Very tall and skinny)
- Ensure text remains readable but utilizes the maximum possible real estate without cutoff.
