# Audit: Widget Space Utilization & Content Scaling

**Date**: 2026-02-15
**Goal**: Identify wasted space, excessive padding, and conservative scaling across all widgets.

## Executive Summary

Most widgets have been updated to the `skipScaling: true` standard, removing the global 16px padding. However, many widgets still use defensive `cqmin` values or internal padding that prevents content from truly filling the window. The "Hero" widgets (Clock, Weather, TimeTool) suffer most from conservative height constraints.

---

## Widget Audit Details

| Widget             | Skip Scaling | Padding Strategy                                  | Content Scaling Rules                         | Rating | Notes                                                           |
| :----------------- | :----------: | :------------------------------------------------ | :-------------------------------------------- | :----: | :-------------------------------------------------------------- |
| **Clock**          |      ✅      | `p-0` (Global) + `min(4px, 1cqmin)` (Internal)    | `min(75cqh, 25cqw)` (Time)                    |  3/5   | DISCUSSION: Planned fix to 82cqh and 0 padding.                 |
| **Weather**        |      ✅      | `p-0` (Global) + `min(8px, 2cqmin)` (Internal)    | `clamp(32px, 35cqmin, 400px)`                 |  5/5   | Exemplary hero scaling.                                         |
| **Traffic Light**  |      ✅      | `p-0` (Global) + `p-[min(4px,1cqmin)]` (Internal) | `h-[95%] w-[95%]` + `min(28cqh, 80cqw)`       |  5/5   | Great use of space.                                             |
| **Text**           |      ✅      | `p-0` (Global) + `min(16px, 3.5cqmin)` (Internal) | `min(fontSize, fontSize * 0.5cqmin)`          |  4/5   | Padding is appropriate for legibility.                          |
| **Checklist**      |      ✅      | `p-0` (Global) + `min(12px, 2.5cqmin)` (Internal) | `min(20px, 5cqmin)`                           |  2/5   | **WASTED SPACE**: Scaling is too conservative for wide widgets. |
| **Random**         |      ✅      | `p-0` (Global) + Var. Internal                    | `45cqmin` (Hero) / `min(24px, 6cqmin)` (List) |  4/5   | Single result fills well; groups can be tight.                  |
| **Dice**           |      ✅      | `p-0` (Global) + `p-[4cqmin]` (Internal)          | `75cqmin` / `55cqmin` / `42cqmin`             |  4/5   | Good logic for multiple dice.                                   |
| **Sound**          |      ✅      | `p-0` (Global) + `p-2` (Internal)                 | N/A (SVG based)                               |  3/5   | **WASTED SPACE**: Uses fixed `p-2` instead of scaled padding.   |
| **Webcam**         |      ✅      | `p-0` (Global) + `0` (Internal)                   | `object-cover`                                |  5/5   | Full bleed content.                                             |
| **Embed**          |      ✅      | `p-0` (Global) + `0` (Internal)                   | `w-full h-full`                               |  5/5   | Full bleed content.                                             |
| **Drawing**        |      ❌      | `p-0` (Global)                                    | Canvas-based                                  |  4/5   | Functional necessity for fixed coordinates.                     |
| **QR**             |      ✅      | `p-0` (Global) + `min(8px, 1.5cqmin)` (Internal)  | `object-contain`                              |  4/5   | Good balance.                                                   |
| **Scoreboard**     |      ✅      | `p-0` (Global) + `min(16px, 3.5cqmin)` (Internal) | `min(60cqh, 50cqw)` (Score)                   |  5/5   | Aggressive and fills well.                                      |
| **Expectations**   |      ✅      | `p-0` (Global) + `min(16px, 3cqmin)` (Internal)   | `min(32px, 10cqmin)` (Labels)                 |  4/5   | Modern and clean.                                               |
| **Poll**           |      ✅      | `p-0` (Global) + `min(16px, 3cqmin)` (Internal)   | `min(32px, 10cqmin)` (Question)               |  4/5   | Fills container width well.                                     |
| **Schedule**       |      ✅      | `p-0` (Global) + `min(12px, 2.5cqmin)` (Internal) | `min(36px, 10cqmin, 80cqw)`                   |  4/5   | Good use of width constraints.                                  |
| **Calendar**       |      ✅      | `p-0` (Global) + `min(16px, 3.5cqmin)` (Internal) | `min(48px, 25cqmin)` (Date)                   |  5/5   | Aggressive scaling for primary info.                            |
| **LunchCount**     |      ✅      | `p-0` (Global) + `min(10px, 2cqmin)` (Internal)   | `min(16px, 6cqmin)` (Items)                   |  4/5   | Dense content, well distributed.                                |
| **Classes**        |      ✅      | `p-0` (Global) + `min(12px, 2.5cqmin)` (Internal) | `min(24px, 8cqmin)` (Titles)                  |  4/5   | Consistent with modern standard.                                |
| **Materials**      |      ✅      | `p-0` (Global) + `min(16px, 3.5cqmin)` (Internal) | `min(18px, 6cqmin)` (Labels)                  |  4/5   | Items reflow and scale well.                                    |
| **TimeTool**       |      ✅      | `p-0` (Global) + `min(4px, 1cqmin)` (Internal)    | `min(75cqh, 25cqw)` (Digital)                 |  3/5   | **WASTED SPACE**: Shares Clock's conservative 75% height.       |
| **CatalystVisual** |      ✅      | `p-0` (Global) + `min(24px, 5cqmin)` (Internal)   | `40cqmin` (Icon)                              |  3/5   | **WASTED SPACE**: Icons could be 60-70% height in "Go Mode".    |
| **RecessGear**     |      ✅      | `p-0` (Global) + `min(12px, 2.5cqmin)` (Internal) | `min(48px, 16cqmin)` (Icon)                   |  4/5   | Card-based reflow works well.                                   |

---

## Identified Opportunities for Improvement

### 1. The "75% Height" Ceiling (Clock, TimeTool)

- **Problem**: Digits are capped at `75cqh` to prevent clipping, but this leaves large gaps at the top and bottom.
- **Solution**: Increase to `82-85cqh` and reduce vertical gaps.

### 2. Conservative `cqmin` (Checklist, Sound)

- **Problem**: Using `5cqmin` for text means the content only grows to 5% of the smaller dimension. In a large window, this looks tiny.
- **Solution**: Transition to higher `cqmin` values (8-10%) or use "Fill-First" width/height constraints.

### 3. Static Padding (Sound)

- **Problem**: `SoundWidget` uses hardcoded `p-2` instead of `min(Xpx, Ycqmin)`.
- **Solution**: Standardize on `min(16px, 3cqmin)` for general padding.

### 4. Catalyst Visuals

- **Problem**: The icon in `CatalystVisualWidget` is only `40cqmin`.
- **Solution**: Increase to `min(70cqh, 60cqw)` to make the visual anchor truly dominant.

## Rating Legend

- **5/5**: Content hits the edges or uses space optimally.
- **4/5**: Good utilization, slight padding but appropriate for the component type.
- **3/5**: Noticeable wasted space; content feels a bit small for the container.
- **2/5**: Poor utilization; large margins or tiny content.
- **1/5**: Significant layout issues or extremely small content.
