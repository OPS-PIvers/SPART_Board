# Standardized Widget Layout System - Implementation Plan

## Executive Summary

Implement a **proper architectural foundation** that ensures consistency, maintainability, and eliminates dead space and scaling issues permanently.

**What we're building:**

- Centralized layout management in `WidgetRenderer`
- Standardized widget return structure
- Automatic responsive scaling for all widgets
- Single source of truth for layout patterns

**Benefits:**

- ✅ **Consistency** - All widgets use the same layout system
- ✅ **Maintainability** - Layout logic lives in one place
- ✅ **No dead space** - Responsive scaling built-in by default
- ✅ **Future-proof** - New widgets automatically work correctly

---

## Architecture Design

### New Widget Return Type

```typescript
// types.ts

export interface WidgetLayout {
  /** Optional header content (stays fixed at top) */
  header?: React.ReactNode;

  /** Main content (grows to fill available space) */
  content: React.ReactNode;

  /** Optional footer content (stays fixed at bottom) */
  footer?: React.ReactNode;

  /** Optional: Override default flex behavior */
  contentClassName?: string;

  /** Optional: Custom padding (default: 'p-2', use 'p-0' for maximum fill) */
  padding?: string;
}

// Widget components can return either:
// 1. WidgetLayout object (new standardized way)
// 2. React.ReactNode (backwards compatible)
export type WidgetOutput = WidgetLayout | React.ReactNode;
```

### Helper Function

```typescript
// utils/widgetHelpers.ts

export const isWidgetLayout = (
  output: WidgetOutput
): output is WidgetLayout => {
  return (
    typeof output === 'object' &&
    output !== null &&
    'content' in output &&
    !React.isValidElement(output)
  );
};
```

### Updated WidgetRenderer

```tsx
// components/widgets/WidgetRenderer.tsx

const finalContent = scalingConfig.skipScaling ? (
  <div
    className="h-full w-full relative"
    style={{
      padding: scalingConfig.padding ?? PADDING, // Opt-out of 16px padding
      containerType: 'size',
    }}
  >
    <WidgetLayoutWrapper
      widget={widget}
      w={effectiveWidth}
      h={effectiveHeight}
    />
  </div>
) : (
  // ScalableWidget for legacy widgets (drawing, seating-chart)
  <ScalableWidget
    // ...
    padding={scalingConfig.padding ?? PADDING}
  >
    {({ internalW, internalH, scale }) => (
      <WidgetLayoutWrapper
        widget={widget}
        w={internalW}
        h={internalH}
        scale={scale}
      />
    )}
  </ScalableWidget>
);
```

### New WidgetLayoutWrapper Component

```tsx
// components/widgets/WidgetLayoutWrapper.tsx

import React from 'react';
import { WidgetData } from '@/types';
import { WIDGET_COMPONENTS } from './WidgetRegistry';
import { isWidgetLayout } from '@/utils/widgetHelpers';

interface WidgetLayoutWrapperProps {
  widget: WidgetData;
  w: number;
  h: number;
  scale?: number;
  isStudentView?: boolean;
}

export const WidgetLayoutWrapper: React.FC<WidgetLayoutWrapperProps> = ({
  widget,
  w,
  h,
  scale,
  isStudentView = false,
}) => {
  const WidgetComponent = WIDGET_COMPONENTS[widget.type];

  if (!WidgetComponent) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Widget under construction
      </div>
    );
  }

  // Render widget and check output type
  const output = (
    <WidgetComponent
      widget={{ ...widget, w, h }}
      scale={scale}
      isStudentView={isStudentView}
    />
  );

  // If widget returns WidgetLayout object, apply standardized layout
  if (isWidgetLayout(output)) {
    const {
      header,
      content,
      footer,
      contentClassName,
      padding = 'p-2',
    } = output;

    return (
      <div className={`h-full flex flex-col ${padding}`}>
        {/* Header - fixed size */}
        {header && <div className="shrink-0 mb-2">{header}</div>}

        {/* Content - grows to fill space */}
        <div
          className={
            contentClassName ||
            'flex-1 min-h-0 flex items-center justify-center'
          }
        >
          {content}
        </div>

        {/* Footer - fixed size */}
        {footer && <div className="shrink-0 mt-2">{footer}</div>}
      </div>
    );
  }

  // Backwards compatible - widget returns ReactNode directly
  return <>{output}</>;
};
```

---

## Migration Strategy

### Phase 1: Infrastructure (COMPLETED ✅)

**Step 1: Add new types** (Done)

**Step 2: Create helper** (Done)

**Step 3: Create WidgetLayoutWrapper** (Done)

**Step 4: Update WidgetRenderer** (Done)

**Step 5: Test backwards compatibility** (Done)

### Phase 2: Migrate Widgets (8-12 hours)

Migrate widgets in priority order based on usage/visibility.

#### Key Scaling Principles (Updated)

1. **Use `min(Xpx, Ycqmin)` or `min(Xcqw, Ycqh)`** for all text, icon, and spacing sizes in widget content. The `min()` function caps the size at a sensible pixel maximum while allowing it to scale down in smaller containers.
2. **Padding `p-0`**: Use `padding="p-0"` in `WidgetLayout` and `padding: 0` in `WIDGET_SCALING_CONFIG` for widgets that should touch the edges.
3. **Responsive Fonts**:
   - Large display text: `fontSize: min(30cqw, 75cqh)` (fills most of the widget)
   - Body text: `fontSize: min(14px, 3.5cqmin)` (caps at 14px, scales down)
   - Small labels: `fontSize: min(10px, 2.5cqmin)` (caps at 10px, scales down)
   - Icons/Buttons: `width/height: min(24px, 6cqmin)` (for interactive elements)
4. **NEVER use hardcoded Tailwind text classes** (`text-sm`, `text-xs`, `text-2xl`, etc.) or fixed icon sizes (`size={24}`, `w-12 h-12`) in widget front-face content. These do not scale when the widget is resized.
5. **Settings panels (back-face)** do NOT need container query scaling — normal Tailwind classes are fine there.
6. **Empty/error states**: Use the shared `ScaledEmptyState` component (`components/common/ScaledEmptyState.tsx`) for all widget empty and error states. It auto-scales via `cqmin` units.
   ```tsx
   import { ScaledEmptyState } from '../common/ScaledEmptyState';
   <ScaledEmptyState
     icon={Clock}
     title="No Schedule"
     subtitle="Flip to add items."
   />;
   ```
7. **`renderCatalystIcon()`** in `catalystHelpers.tsx` accepts both `number` and CSS `string` sizes for container-query-aware icon rendering:
   ```tsx
   renderCatalystIcon(iconName, 'min(32px, 8cqmin)'); // Scaled — use in widget content
   renderCatalystIcon(iconName, 32); // Fixed — use in settings only
   ```

#### High Priority (Batch 1) (COMPLETED ✅)

- [x] **clock** (Done)
- [x] **dice** (Done)
- [x] **time-tool** (Timer) (Done)
- [x] **random** (Done)
- [x] **traffic** (Done)

#### Medium Priority (Batch 2) (COMPLETED ✅)

- [x] **qr** (Done)
- [x] **text** (Done)
- [x] **checklist** (Done)
- [x] **poll** (Done)
- [x] **scoreboard** (Done)

#### Lower Priority (Batch 3) (COMPLETED ✅)

- [x] **weather** (Done)
- [x] **schedule** (Done)
- [x] **calendar** (Done)
- [x] **webcam** (Done)
- [x] **sound** (Done)
- [x] **embed** (Done)
- [x] **expectations** (Done)
- [x] **materials** (Done)
- [x] **classes** (Done)
- [x] **lunchCount** (Done)
- [x] **instructionalRoutines** (Done)
- [x] **catalyst** (Done)
- [x] **catalyst-instruction** (Done)
- [x] **catalyst-visual** (Done)
- [x] **miniApp** (Done)
- [x] **stickers** (Done)
- [x] **smartNotebook** (Done)
- [x] **recessGear** (Done)

### Phase 3: Optimization (2-4 hours)

**Migration Template:**

```tsx
// BEFORE - Old pattern (ReactNode)
export const DiceWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-2 gap-3">
      <div className="flex flex-wrap justify-center gap-[5cqmin] max-h-[70%]">
        {/* Dice faces */}
      </div>
      <button onClick={roll}>Roll Dice</button>
    </div>
  );
};

// AFTER - New pattern (WidgetLayout)
export const DiceWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as DiceConfig;
  const [values, setValues] = useState<number[]>([1, 2, 3]);
  const [isRolling, setIsRolling] = useState(false);

  const roll = async () => {
    // Roll logic...
  };

  return {
    padding: 'p-0',
    content: (
      <div className="flex flex-wrap justify-center items-center gap-[4cqmin] w-full h-full">
        {values.map((v, i) => (
          <DiceFace
            key={i}
            value={v}
            isRolling={isRolling}
            size={diceCount === 1 ? 'min(60cqw, 75cqh)' : 'min(30cqw, 45cqh)'}
          />
        ))}
      </div>
    ),
    footer: (
      <div className="px-2 pb-2">
        <button
          onClick={roll}
          disabled={isRolling}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl
                   font-bold uppercase tracking-wide transition-all
                   hover:bg-purple-700 disabled:bg-slate-300"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>
    ),
  };
};
```

**Key Changes:**

1. Return object instead of JSX
2. Split content and footer
3. Remove manual layout (`flex-col`, `justify-center`, `gap`)
4. Content gets full width/height automatically
5. Footer stays fixed at bottom automatically

### Phase 3: Optimization (2-4 hours)

**Create reusable layout components:**

```tsx
// components/widgets/layouts/ContentWithButton.tsx
export const ContentWithButton = ({
  content,
  buttonText,
  onButtonClick,
  buttonDisabled,
}: {
  content: React.ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  buttonDisabled?: boolean;
}) => ({
  content,
  footer: (
    <button
      onClick={onButtonClick}
      disabled={buttonDisabled}
      className="w-full px-6 py-3 bg-purple-600 text-white rounded-full
                 font-bold uppercase tracking-wide transition-all
                 hover:bg-purple-700 disabled:bg-slate-300"
    >
      {buttonText}
    </button>
  ),
});
```

**Usage:**

```tsx
export const DiceWidget = ({ widget }) => {
  // ... state and logic ...

  return ContentWithButton({
    content: <DiceDisplay values={values} isRolling={isRolling} />,
    buttonText: isRolling ? 'Rolling...' : 'Roll Dice',
    onButtonClick: roll,
    buttonDisabled: isRolling,
  });
};
```

---

## Widget Migration Examples

### Simple Widget (No Header/Footer)

```tsx
// Traffic Light Widget
export const TrafficLightWidget = ({ widget }) => {
  const config = widget.config as TrafficConfig;

  return {
    content: (
      <div className="flex flex-col gap-[4cqmin] w-full h-full max-h-full">
        <TrafficLight color="red" active={config.active === 'red'} />
        <TrafficLight color="yellow" active={config.active === 'yellow'} />
        <TrafficLight color="green" active={config.active === 'green'} />
      </div>
    ),
  };
};
```

### Widget with Header

```tsx
// QR Widget
export const QRWidget = ({ widget }) => {
  const config = widget.config as QRConfig;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(config.url)}`;

  return {
    header: config.syncWithTextWidget ? (
      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
        <Link className="w-3 h-3 text-indigo-500" />
        <span className="text-xs font-bold text-indigo-500">
          Linked to Text
        </span>
      </div>
    ) : undefined,
    content: (
      <div className="bg-white p-2 rounded-xl shadow-inner w-full h-full max-w-full max-h-full">
        <img
          src={qrUrl}
          alt="QR Code"
          className="w-full h-full object-contain"
        />
      </div>
    ),
    footer: (
      <div className="text-xs font-mono text-slate-400 text-center truncate">
        {config.url}
      </div>
    ),
  };
};
```

### Widget with Complex Layout

```tsx
// Clock Widget
export const ClockWidget = ({ widget }) => {
  const [time, setTime] = useState(new Date());
  const config = widget.config as ClockConfig;

  // ... time formatting logic ...

  return {
    padding: 'p-0',
    content: (
      <div className="flex flex-col items-center justify-center gap-[2cqmin]">
        <div
          className="flex items-baseline"
          style={{
            fontSize: config.showSeconds
              ? 'min(20cqw, 65cqh)'
              : 'min(30cqw, 75cqh)',
            color: config.themeColor,
          }}
        >
          <span>{displayHours}</span>
          <span className="opacity-30 mx-[0.25em]">:</span>
          <span>{minutes}</span>
          {config.showSeconds && (
            <>
              <span className="opacity-30 mx-[0.25em]">:</span>
              <span className="opacity-60" style={{ fontSize: '0.7em' }}>
                {seconds}
              </span>
            </>
          )}
        </div>

        <div className="text-[4cqmin] opacity-60 uppercase tracking-wide">
          {dateString}
        </div>
      </div>
    ),
  };
};
```

### Widget with Custom Content Layout

```tsx
// Scoreboard Widget
export const ScoreboardWidget = ({ widget }) => {
  const config = widget.config as ScoreboardConfig;

  return {
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
        {config.teams?.map((team) => (
          <div
            key={team.id}
            className="flex flex-col items-center justify-center"
          >
            <div
              className="text-[20cqmin] font-bold"
              style={{ color: team.color }}
            >
              {team.score}
            </div>
            <div className="text-[6cqmin] uppercase tracking-wide">
              {team.name}
            </div>
          </div>
        ))}
      </div>
    ),
    contentClassName: 'flex-1 min-h-0', // Override default centering
  };
};
```

---

## Widget-by-Widget Migration Checklist

### High Priority (Most Visible)

- [ ] clock - Time display + date
- [ ] dice - Dice + button
- [ ] timer - Timer display + controls
- [ ] random - Picker + button
- [ ] traffic - Just lights (simple)

### Medium Priority

- [ ] qr - QR code + URL footer + optional header
- [ ] text - Rich text editor
- [ ] checklist - List items + input
- [ ] poll - Question + options + results
- [ ] scoreboard - Team scores

### Lower Priority

- [ ] weather - Weather display + location
- [ ] schedule - Time slots + tasks
- [ ] calendar - Month view + events
- [ ] webcam - Video feed + controls
- [ ] sound - Sound meter + controls
- [ ] embed - Iframe wrapper
- [ ] expectations - Symbol selector
- [ ] materials - Material list
- [ ] classes - Class roster
- [ ] lunchCount - Lunch counter
- [ ] instructionalRoutines - Routine list
- [ ] catalyst - Catalyst cards
- [ ] catalyst-instruction - Instruction display
- [ ] catalyst-visual - Visual display
- [ ] miniApp - App runner
- [ ] stickers - Sticker library
- [ ] smartNotebook - Notebook viewer
- [ ] recessGear - Gear selector

### Skip (Legacy System)

- [ ] drawing - Uses ScalableWidget (keep as-is)
- [ ] seating-chart - Uses ScalableWidget (keep as-is)

---

## TypeScript Configuration

Update `types.ts` to export the new widget prop type:

```typescript
// types.ts

export interface WidgetComponentProps {
  widget: WidgetData;
  scale?: number;
  isStudentView?: boolean;
}

// Update component type to return WidgetOutput
export type WidgetComponent = React.FC<WidgetComponentProps> & {
  (): WidgetOutput;
};
```

---

## Testing Strategy

### Unit Tests

Create test for WidgetLayoutWrapper:

```tsx
// components/widgets/WidgetLayoutWrapper.test.tsx

describe('WidgetLayoutWrapper', () => {
  it('renders widget with standard layout when WidgetLayout returned', () => {
    const mockWidget: WidgetData = {
      /* ... */
    };
    const MockComponent = () => ({
      header: <div>Header</div>,
      content: <div>Content</div>,
      footer: <div>Footer</div>,
    });

    // Register mock
    WIDGET_COMPONENTS['test'] = MockComponent;

    const { getByText } = render(
      <WidgetLayoutWrapper widget={mockWidget} w={400} h={400} />
    );

    expect(getByText('Header')).toBeInTheDocument();
    expect(getByText('Content')).toBeInTheDocument();
    expect(getByText('Footer')).toBeInTheDocument();
  });

  it('renders widget directly when ReactNode returned (backwards compat)', () => {
    const MockComponent = () => <div>Direct JSX</div>;

    WIDGET_COMPONENTS['test'] = MockComponent;

    const { getByText } = render(
      <WidgetLayoutWrapper widget={mockWidget} w={400} h={400} />
    );

    expect(getByText('Direct JSX')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test each migrated widget:

```tsx
// components/widgets/DiceWidget.test.tsx

describe('DiceWidget', () => {
  it('returns WidgetLayout with content and footer', () => {
    const widget = createMockWidget('dice');
    const output = <DiceWidget widget={widget} />;

    expect(isWidgetLayout(output)).toBe(true);
    expect(output.content).toBeDefined();
    expect(output.footer).toBeDefined();
  });

  it('fills available space correctly', () => {
    const { container } = render(
      <WidgetLayoutWrapper widget={widget} w={600} h={400} />
    );

    // Content area should have flex-1
    const contentArea = container.querySelector('.flex-1');
    expect(contentArea).toBeInTheDocument();

    // Footer should be fixed (shrink-0)
    const footer = container.querySelector('.shrink-0');
    expect(footer).toBeInTheDocument();
  });
});
```

### Visual Regression Tests

Take screenshots at 3 sizes for each widget:

```typescript
// tests/e2e/widget-layouts.spec.ts

test('all widgets fill space correctly', async ({ page }) => {
  const widgets = ['clock', 'dice', 'timer', 'qr', ...];
  const sizes = [
    { w: 300, h: 200, label: 'small' },
    { w: 600, h: 400, label: 'medium' },
    { w: 900, h: 600, label: 'large' },
  ];

  for (const widget of widgets) {
    await page.goto('/');
    await addWidget(page, widget);

    for (const size of sizes) {
      await resizeWidget(page, size.w, size.h);
      await page.screenshot({
        path: `screenshots/${widget}-${size.label}.png`
      });

      // Verify no excessive dead space
      const coverage = await measureWidgetCoverage(page);
      expect(coverage).toBeGreaterThan(0.85);
    }
  }
});
```

---

## Rollout Strategy

### Week 1: Infrastructure

- Day 1-2: Implement WidgetLayoutWrapper
- Day 3: Test backwards compatibility
- Day 4: Update documentation
- Day 5: Deploy to staging

### Week 2: High Priority Widgets

- Day 1: Migrate clock, dice, timer
- Day 2: Migrate random, traffic
- Day 3: Testing and refinement
- Day 4: Deploy to staging
- Day 5: Monitor and fix issues

### Week 3: Medium Priority Widgets

- Day 1-2: Migrate qr, text, checklist, poll, scoreboard
- Day 3-4: Testing
- Day 5: Deploy to staging

### Week 4: Remaining Widgets

- Day 1-3: Migrate remaining widgets
- Day 4: Full system testing
- Day 5: Deploy to production

---

## Documentation

### For Developers

Create `WIDGET_DEVELOPMENT_GUIDE.md`:

```markdown
# Widget Development Guide

## Creating a New Widget

All widgets should return a `WidgetLayout` object:

\`\`\`tsx
export const MyWidget: React.FC<WidgetComponentProps> = ({ widget }) => {
return {
content: (

<div>Main content here</div>
),
footer: (
<button>Optional footer</button>
),
};
};
\`\`\`

## Layout Structure

- **header**: Fixed at top (optional)
- **content**: Grows to fill space (required)
- **footer**: Fixed at bottom (optional)

## Sizing Guidelines

- **Use container query units** (`cqw`, `cqh`, `cqmin`) via inline `style={{}}` for ALL dynamic sizing in widget content.
- **Use `min(Xpx, Ycqmin)`** to set a max pixel size that scales down in smaller containers. For primary content that should fill the widget aggressively, use `min(Xcqw, Ycqh)` instead.
- **NEVER use hardcoded Tailwind text/size classes** (`text-sm`, `text-xs`, `w-12 h-12`, `size={24}`) in widget front-face content — they don't scale.
- Use `padding="p-0"` in the `WidgetLayout` to remove the internal flex gap/padding.
- Set `padding: 0` in `WIDGET_SCALING_CONFIG` (WidgetRegistry.ts) to remove the 16px container margin.
- **Settings panels (back-face)** don't need container query scaling — use normal Tailwind classes.
- **Empty/error states:** Always use the shared `ScaledEmptyState` component (`components/common/ScaledEmptyState.tsx`) instead of hand-rolling a per-widget empty state. It accepts `icon`, `title`, `subtitle`, and optional `action` props and auto-scales via `cqmin`.

## Examples

See `components/widgets/ClockWidget.tsx`, `WeatherWidget.tsx`, or `PollWidget.tsx` for reference scaling implementations.
\`\`\`

---

## Success Metrics

### Quantitative

- ✅ 100% of widgets fill ≥85% of space
- ✅ Zero layout-related bug reports
- ✅ All unit tests passing
- ✅ All visual regression tests passing

### Qualitative

- ✅ Consistent visual appearance
- ✅ Predictable behavior across widgets
- ✅ Easier to add new widgets
- ✅ Simplified widget component code

---

## Timeline Summary

**Total Estimated Time: 20-28 hours**

- Phase 1 (Infrastructure): 2-3 hours
- Phase 2 (Migration): 8-12 hours (30 widgets × 20 min avg)
- Phase 3 (Optimization): 2-4 hours
- Testing & Documentation: 4-6 hours
- Buffer for issues: 4-6 hours

**Calendar Time: 3-4 weeks** (accounting for testing, monitoring, staged rollout)

---

## Risk Mitigation

### Backwards Compatibility

- ✅ Old widgets continue working unchanged
- ✅ Migration can happen incrementally
- ✅ Can rollback individual widgets if needed

### Testing

- ✅ Unit tests for layout wrapper
- ✅ Integration tests for each widget
- ✅ Visual regression tests
- ✅ Staging environment validation

### Monitoring

- ✅ User feedback channels
- ✅ Error tracking (Sentry)
- ✅ Usage analytics
- ✅ Performance monitoring

---

## Long-term Benefits

1. **Consistency**: All widgets behave the same way
2. **Maintainability**: Layout logic in one place
3. **Scalability**: Easy to add new widgets
4. **Performance**: Can optimize layout rendering globally
5. **Future features**: Easy to add global widget features (animations, themes, etc.)

---
```
