# Widget Scaling Standards

**Last Updated**: 2026-02-09
**Purpose**: Standardized container query scaling rules for all `skipScaling: true` widgets

## Problem Statement

Widgets with `skipScaling: true` were not properly scaling to fill their container, resulting in:

- Tiny text with large empty spaces
- Inconsistent sizing across different widget aspect ratios
- Poor use of available screen real estate

## Core Principles

### 1. Always Use `cqmin` for Text (Not `cqw` or `cqh`)

`cqmin` represents 1% of the **smaller** container dimension (width or height), ensuring consistent scaling regardless of widget aspect ratio.

❌ **WRONG**:

```tsx
style={{ fontSize: 'min(14px, 3.5cqw, 5cqh)' }}
```

✅ **CORRECT**:

```tsx
style={{ fontSize: 'min(14px, 5cqmin)' }}
```

### 2. Size Elements by Visual Hierarchy

**Important**: When using `min(Xpx, Ycqmin)`, the pixel value (`Xpx`) is a **maximum cap**, not a minimum. Text will never exceed `Xpx` even on huge containers. For primary content that should scale without limits, consider using `clamp()` or just `cqmin` alone.

| Element Type                                  | Recommended `cqmin` | Example Formula                            | Notes                                   |
| --------------------------------------------- | ------------------- | ------------------------------------------ | --------------------------------------- |
| **Primary content** (hero text, main numbers) | 20-30cqmin          | `clamp(24px, 25cqmin, 120px)` or `25cqmin` | Should scale aggressively to fill space |
| **Secondary content** (subheadings, labels)   | 5-8cqmin            | `min(16px, 7cqmin)`                        | Readable at all sizes                   |
| **Tertiary content** (metadata, small labels) | 3.5-5cqmin          | `min(12px, 4.5cqmin)`                      | Compact but legible                     |
| **Icons (decorative)**                        | 8-15cqmin           | `min(48px, 12cqmin)`                       | Balance with text                       |
| **Icons (primary)**                           | 20-30cqmin          | `min(80px, 20cqmin)`                       | Visual anchors                          |

### 3. Minimize Header/Footer Overhead

Headers and footers should use **minimal space** to maximize content area:

✅ **GOOD** (compact header):

```tsx
<div style={{ padding: 'min(8px, 1.5cqmin) min(12px, 2.5cqmin)' }}>
  <span style={{ fontSize: 'min(11px, 4cqmin)' }}>HEADER</span>
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
<div style={{ fontSize: 'min(24px, 25cqmin)' }}>{temp}°</div>
```

**Clock Widget** - Time should fill 30-40% of widget height:

```tsx
<div style={{ fontSize: 'min(20px, 22cqmin)' }}>{time}</div>
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

### Text Sizing

```tsx
// Tiny labels (footer metadata, category tags)
style={{ fontSize: 'min(10px, 3.5cqmin)' }}

// Small labels (widget headers, section titles)
style={{ fontSize: 'min(12px, 4.5cqmin)' }}

// Medium text (list items, body text)
style={{ fontSize: 'min(14px, 5.5cqmin)' }}

// Large text (subheadings, secondary data)
style={{ fontSize: 'min(16px, 7cqmin)' }}

// Hero text (primary numbers, main headings)
style={{ fontSize: 'min(24px, 25cqmin)' }}
```

### Icon Sizing

```tsx
// Small decorative icons
style={{ width: 'min(16px, 4cqmin)', height: 'min(16px, 4cqmin)' }}

// Medium functional icons
style={{ width: 'min(24px, 6cqmin)', height: 'min(24px, 6cqmin)' }}

// Large accent icons
style={{ width: 'min(48px, 12cqmin)', height: 'min(48px, 12cqmin)' }}

// Hero icons (main weather icon, etc.)
style={{ width: 'min(80px, 20cqmin)', height: 'min(80px, 20cqmin)' }}
```

### Spacing

```tsx
// Tight gaps (between icon and label)
style={{ gap: 'min(4px, 1cqmin)' }}

// Normal gaps (between list items)
style={{ gap: 'min(8px, 2cqmin)' }}

// Spacious gaps (between sections)
style={{ gap: 'min(16px, 3.5cqmin)' }}

// Padding (container insets)
style={{ padding: 'min(12px, 2.5cqmin)' }}

// Large padding (content areas)
style={{ padding: 'min(16px, 3.5cqmin)' }}
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

### Before (Too Conservative):

```tsx
<div className="p-4 gap-3">
  <span className="text-xs">Label</span>
  <span className="text-2xl">{value}</span>
</div>
```

### After (Properly Scaled):

```tsx
<div style={{ padding: 'min(16px, 3.5cqmin)', gap: 'min(12px, 2.5cqmin)' }}>
  <span style={{ fontSize: 'min(11px, 4cqmin)' }}>Label</span>
  <span style={{ fontSize: 'min(24px, 20cqmin)' }}>{value}</span>
</div>
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
