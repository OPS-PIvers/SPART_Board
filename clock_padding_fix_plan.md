# Plan: Optimize Clock Widget Space Utilization

## Objective

Eliminate excess padding and maximize the "Hero" time display in the Clock Widget to ensure it fills the available container space as requested by the user.

## Current Issues

1.  **Defensive Internal Padding**: `style={{ padding: 'min(4px, 1cqmin)' }}` adds unnecessary space around the edges.
2.  **Conservative Height Scaling**: `75cqh` for time leaves ~25% of vertical space for the date and empty gaps.
3.  **Restrictive Date Scaling**: `5cqmin` for date text is too small, creating large empty voids in bigger widgets.

## Implementation Steps

### 1. Remove Internal Padding

In `components/widgets/ClockWidget.tsx`, locate the main container `div` and remove the inline padding.

- **Old**: `style={{ padding: 'min(4px, 1cqmin)' }}`
- **New**: Remove the `style` prop or set to `padding: 0`.

### 2. Update Scaling Formulas (Fill-First)

Apply aggressive scaling to allow the content to hit the "walls" of the widget.

| Element          | Old Formula          | New Formula         | Rationale                                                    |
| :--------------- | :------------------- | :------------------ | :----------------------------------------------------------- |
| **Time Display** | `min(75cqh, 25cqw)`  | `min(82cqh, 25cqw)` | Increases height utilization to ~82%.                        |
| **Date Label**   | `min(15cqh, 5cqmin)` | `min(12cqh, 80cqw)` | Scales date relative to width, filling the horizontal space. |
| **Vertical Gap** | `gap-[1cqh]`         | `gap-[0.5cqh]`      | Tightens the space between time and date.                    |

### 3. Code Reference Changes

```tsx
// components/widgets/ClockWidget.tsx

// 1. Remove padding from container
<div
  className={`flex flex-col items-center justify-center h-full w-full gap-[0.5cqh] ...`}
  style={{ padding: 0 }} // Changed from min(4px, 1cqmin)
>
  {/* 2. Increase Time Scaling */}
  <div
    style={{
      fontSize: showSeconds ? 'min(82cqh, 20cqw)' : 'min(82cqh, 25cqw)',
      // ...
    }}
  >
    {/* ... */}
  </div>

  {/* 3. Modernize Date Scaling */}
  <div style={{ fontSize: 'min(12cqh, 80cqw)', fontWeight: 900 }}>
    {/* ... */}
  </div>
</div>
```

## Verification Checklist

- [ ] **Ultra-Wide**: Ensure the time doesn't clip horizontally.
- [ ] **Square**: Check that the vertical gap between time and date is balanced.
- [ ] **Smallest Size**: Verify the date remains legible.
- [ ] **Maximized**: Confirm the time fills the screen without excessive margins.
