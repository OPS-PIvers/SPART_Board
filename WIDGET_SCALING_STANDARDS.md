# Widget Scaling Standards

**Last Updated**: 2026-02-13
**Purpose**: Standardized container query scaling rules for all `skipScaling: true` widgets

## Reference Implementations ⭐

These widgets have been user-approved and should serve as templates:

### **TimeToolWidget** (Primary Reference)
- **Hero text**: Uses `clamp(32px, 40cqmin, 400px)` for wide scaling range
- **Secondary UI**: Uses `min(14px, 5cqmin)` for labels, buttons, controls
- **Pattern**: Large primary content with contained auxiliary controls
- **Status**: ✅ User-approved, "works great"

### **Other Approved Widgets**
- **ScheduleWidget**: List pattern with 5-8cqmin for items
- **MaterialsWidget**: Aggressive icon/text scaling with pure cqmin
- **RecessGearWidget**: Card-based layout with 8-10cqmin labels
- **CalendarWidget**: Date display with 25cqmin hero text, 5.5cqmin labels

## Problem Statement

Widgets with `skipScaling: true` were not properly scaling to fill their container, resulting in:

- Tiny text with large empty spaces
- Inconsistent sizing across different widget aspect ratios
- Poor use of available screen real estate

## Core Principles

### 1. Always Use `cqmin` for Text (NEVER Mix Units)

`cqmin` represents 1% of the **smaller** container dimension (width or height), ensuring consistent, proportional scaling regardless of widget aspect ratio.

❌ **WRONG** - Mixed units create unpredictable scaling:

```tsx
// BAD: Three-value pattern is confusing and non-proportional
style={{ fontSize: 'min(14px, 3.5cqmin, 80cqw)' }}
style={{ fontSize: 'min(24px, 6cqmin, 60cqw)' }}

// BAD: Using cqw or cqh alone breaks on different aspect ratios
style={{ fontSize: 'min(20cqw, 15cqh)' }}
```

✅ **CORRECT** - Pure cqmin scales intuitively:

```tsx
// GOOD: Simple, predictable, proportional
style={{ fontSize: 'min(14px, 5cqmin)' }}
style={{ fontSize: 'min(24px, 8cqmin)' }}

// GOOD: For hero text that needs wide range, use clamp
style={{ fontSize: 'clamp(32px, 40cqmin, 400px)' }}
```

**Rule**: If you see `cqw` or `cqh` in a `fontSize` or icon size, it's wrong. Use `cqmin` only.

### 2. Size Elements by Visual Hierarchy (Aggressive Scaling)

**Important**: We use **aggressive cqmin values** to ensure content fills the widget. The pixel value in `min(Xpx, Ycqmin)` is a **maximum cap** - text never exceeds it on huge screens.

| Element Type                                  | Recommended `cqmin` | Example Formula                    | Notes                                                 |
| --------------------------------------------- | ------------------- | ---------------------------------- | ----------------------------------------------------- |
| **Primary content** (hero text, main numbers) | 20-40cqmin          | `clamp(32px, 40cqmin, 400px)` **†** | Use `clamp()` for wide scaling range (see TimeToolWidget) |
| **Large headings** (widget titles)            | 8-10cqmin           | `min(24px, 8cqmin)`                | Major section labels                                  |
| **Medium text** (list items, body)            | 5-5.5cqmin          | `min(14px, 5cqmin)`                | Default for most content                              |
| **Small labels** (metadata, tags)             | 4.5-5cqmin          | `min(12px, 4.5cqmin)`              | Compact tertiary text                                 |
| **Primary icons** (weather, decorative)       | 20-30cqmin          | `min(80px, 25cqmin)`               | Visual anchors                                        |
| **Medium icons** (list bullets, buttons)      | 8-12cqmin           | `min(32px, 10cqmin)`               | Functional icons                                      |
| **Small icons** (UI controls)                 | 5-6cqmin            | `min(24px, 6cqmin)`                | Buttons, toggles                                      |

**† Hero Text Pattern**: For primary display content (clock time, temperature), use `clamp(Xpx, Ycqmin, Zpx)` to allow wide scaling (e.g., `clamp(32px, 40cqmin, 400px)`).

### 3. Minimize Header/Footer Overhead

Headers and footers should use **minimal space** to maximize content area:

✅ **GOOD** (compact header):

```tsx
<div style={{ padding: 'min(12px, 2cqmin) min(16px, 3cqmin)' }}>
  <span style={{ fontSize: 'min(14px, 5cqmin)' }}>HEADER</span>
</div>
```

❌ **BAD** (bloated header):

```tsx
<div className="p-6 gap-4">
  <span className="text-xs">HEADER</span>
</div>
```

### 4. Aggressive Scaling for Primary Content

The most important content should **dominate** the widget:

**Weather Widget** - Temperature should fill 40-50% of widget height:

```tsx
<div style={{ fontSize: 'clamp(60px, 40cqmin, 400px)' }}>{temp}°</div>
```

**Clock Widget** - Time should fill 30-40% of widget height:

```tsx
<div style={{ fontSize: showSeconds ? '40cqmin' : '55cqmin' }}>{time}</div>
```

### 5. Use `cqmin` for Spacing Too

All padding, gaps, and margins should scale:

❌ **WRONG**:

```tsx
<div className="p-4 gap-3">
```

✅ **CORRECT**:

```tsx
<div style={{ padding: 'min(16px, 3cqmin)', gap: 'min(12px, 2.5cqmin)' }}>
```

## Standard Scaling Formulas

### Text Sizing (Current Standards - Feb 2026)

```tsx
// Small labels (footer metadata, category tags, tertiary info)
style={{ fontSize: 'min(12px, 4.5cqmin)' }}

// Medium text (list items, body text, routine labels)
style={{ fontSize: 'min(14px, 5cqmin)' }}

// Large headings (widget titles, section headers)
style={{ fontSize: 'min(24px, 8cqmin)' }}

// Extra large (main category labels, poll options)
style={{ fontSize: 'min(32px, 10cqmin)' }}

// Hero text (clock time, temperature, primary display)
style={{ fontSize: 'clamp(32px, 40cqmin, 400px)' }}
// Note: Use clamp for hero text to allow wide scaling range
```

### Icon Sizing

```tsx
// Small decorative icons
style={{ width: 'min(20px, 5cqmin)', height: 'min(20px, 5cqmin)' }}

// Medium functional icons
style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}

// Large accent icons
style={{ width: 'min(64px, 15cqmin)', height: 'min(64px, 15cqmin)' }}

// Hero icons (main weather icon, etc.)
style={{ width: 'min(120px, 35cqmin)', height: 'min(120px, 35cqmin)' }}
```

### Spacing

```tsx
// Tight gaps (between icon and label)
style={{ gap: 'min(6px, 1.5cqmin)' }}

// Normal gaps (between list items)
style={{ gap: 'min(12px, 2.5cqmin)' }}

// Spacious gaps (between sections)
style={{ gap: 'min(24px, 5cqmin)' }}

// Padding (container insets)
style={{ padding: 'min(12px, 2cqmin)' }}

// Large padding (content areas)
style={{ padding: 'min(16px, 3cqmin)' }}
```

## Layout Best Practices

### 1. Flexbox with `flex-1` for Content Areas

```tsx
<WidgetLayout
  header={<CompactHeader />}
  content={
    <div
      className="flex-1 flex flex-col"
      style={{ gap: 'min(12px, 2.5cqmin)' }}
    >
      {/* Content that scales to fill available space */}
    </div>
  }
  footer={<CompactFooter />}
/>
```

### 2. Minimize Fixed-Size Elements

Avoid `min-h-[140px]` or other fixed heights in widget content. Use `flex-1` and let content scale.

❌ **BAD**:

```tsx
<div className="min-h-[140px]">
```

✅ **GOOD**:

```tsx
<div className="flex-1" style={{ minHeight: '12cqmin' }}>
```

### 3. Use Container Query Breakpoints Sparingly

For grid layouts that need to reflow:

```tsx
<div className="grid grid-cols-1 @[300px]:grid-cols-2" style={{ gap: 'min(12px, 2.5cqmin)' }}>
```

## Common Patterns

### Pattern 1: List Widget (Checklist, Expectations, Materials)

```tsx
<WidgetLayout
  padding="p-0"
  header={
    <div style={{ padding: 'min(8px, 1.5cqmin) min(12px, 2.5cqmin)' }}>
      <span style={{ fontSize: 'min(11px, 4cqmin)' }}>SECTION TITLE</span>
    </div>
  }
  content={
    <div
      className="flex-1 overflow-auto"
      style={{ padding: 'min(12px, 2.5cqmin)' }}
    >
      <div style={{ gap: 'min(8px, 2cqmin)' }}>
        {items.map((item) => (
          <div
            style={{
              fontSize: 'min(14px, 5.5cqmin)',
              padding: 'min(8px, 1.5cqmin)',
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  }
/>
```

### Pattern 2: Dashboard Widget (Weather, Clock)

```tsx
<WidgetLayout
  padding="p-0"
  content={
    <div
      className="flex flex-col items-center justify-center h-full"
      style={{ gap: 'min(16px, 4cqmin)', padding: 'min(16px, 3.5cqmin)' }}
    >
      {/* Small metadata */}
      <div style={{ fontSize: 'min(12px, 4cqmin)' }}>LOCATION</div>

      {/* Hero content */}
      <div style={{ fontSize: 'min(24px, 25cqmin)' }}>72°</div>

      {/* Secondary info */}
      <div style={{ fontSize: 'min(14px, 5.5cqmin)' }}>Partly Cloudy</div>
    </div>
  }
/>
```

### Pattern 3: Data Grid Widget (LunchCount, Scoreboard)

```tsx
<WidgetLayout
  padding="p-0"
  header={<CompactHeader />}
  content={
    <div
      className="flex-1 grid grid-cols-3"
      style={{ gap: 'min(12px, 2.5cqmin)', padding: 'min(12px, 2.5cqmin)' }}
    >
      {categories.map((cat) => (
        <div className="flex flex-col" style={{ gap: 'min(8px, 2cqmin)' }}>
          <span style={{ fontSize: 'min(11px, 4.5cqmin)' }}>{cat.label}</span>
          <span style={{ fontSize: 'min(18px, 8cqmin)' }}>{cat.count}</span>
        </div>
      ))}
    </div>
  }
/>
```

## Testing Checklist

For every widget, test at these sizes:

1. **Minimum** (250x200px): Text should be readable (hitting min pixel values)
2. **Standard** (400x300px): Text should look balanced, not too small
3. **Large** (800x600px): Text should scale up proportionally, filling space
4. **Ultra-wide** (1000x300px): Text should use `cqmin` logic to avoid distortion
5. **Tall** (300x800px): Same as above, text should not become too large

## Migration Guide

To fix an existing widget:

1. **Find all inline styles and Tailwind classes** with fixed sizes
2. **Replace text classes** (`text-xs`, `text-sm`, etc.) with `style={{ fontSize: 'min(Xpx, Ycqmin)' }}`
3. **Replace spacing classes** (`p-4`, `gap-3`, etc.) with scaled versions
4. **Increase cqmin values** until content fills the container appropriately
5. **Test at multiple widget sizes** to verify scaling
6. **Reduce header/footer size** if content feels cramped

## Examples of Before/After

### Before (Mixed Units - Bad):

```tsx
<div className="p-4 gap-3">
  <span style={{ fontSize: 'min(16px, 4cqmin, 80cqw)' }}>Routine Name</span>
  <span style={{ fontSize: 'min(12px, 3cqmin, 70cqw)' }}>Grades</span>
</div>
```

### After (Pure cqmin - Good):

```tsx
<div style={{ padding: 'min(16px, 3cqmin)', gap: 'min(12px, 2.5cqmin)' }}>
  <span style={{ fontSize: 'min(16px, 5.5cqmin)' }}>Routine Name</span>
  <span style={{ fontSize: 'min(12px, 4.5cqmin)' }}>Grades</span>
</div>
```

### Hero Content Example (TimeToolWidget):

```tsx
// Main display - uses clamp for wide scaling
<div style={{ fontSize: 'clamp(32px, 40cqmin, 400px)' }}>
  {hours}:{minutes}:{seconds}
</div>

// Controls - uses min for contained scaling
<button style={{ fontSize: 'min(14px, 5cqmin)' }}>
  Start
</button>
```

## Reference: Actual cqmin Values

For a **400x300px widget**:

- `cqmin = 300px` (smaller dimension)
- `1cqmin = 3px`
- `5cqmin = 15px`
- `10cqmin = 30px`
- `25cqmin = 75px`

For an **800x600px widget**:

- `cqmin = 600px`
- `1cqmin = 6px`
- `5cqmin = 30px`
- `10cqmin = 60px`
- `25cqmin = 150px`

This is why **larger cqmin values** are critical - they allow content to actually scale up when the widget grows!

## Recently Fixed Widgets (Feb 2026)

These widgets were updated to follow the new aggressive pure-cqmin standards:

1. **MaterialsWidget** - Removed hardcoded icon sizes, increased label scaling to 5cqmin
2. **RecessGearWidget** - Increased all text to match ScheduleWidget (8cqmin labels)
3. **CalendarWidget** - Removed mixed units, increased to 5.5cqmin labels / 25cqmin dates
4. **ClassesWidget** - Fixed 2 mixed unit instances (8cqmin / 5cqmin)
5. **ExpectationsWidget** - Fixed 11 mixed unit instances across all views
6. **PollWidget** - Fixed 2 mixed unit instances (10cqmin question / 5.5cqmin options)
7. **InstructionalRoutines** - Fixed 2 mixed unit instances (5.5cqmin / 4.5cqmin)

All changes follow the **TimeToolWidget** pattern (user-approved ✅).
