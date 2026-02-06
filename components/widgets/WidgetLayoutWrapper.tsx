import React, { Suspense } from 'react';
import { WidgetData, WidgetOutput, WidgetComponentProps } from '@/types';
import { WIDGET_COMPONENTS } from './WidgetRegistry';
import { isWidgetLayout } from '@/utils/widgetHelpers';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

interface WidgetLayoutWrapperProps {
  widget: WidgetData;
  w: number;
  h: number;
  scale?: number;
  isStudentView?: boolean;
}

/**
 * Standardized wrapper for all widgets.
 * Handles both the new WidgetLayout return type and traditional ReactNode returns.
 */
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

  const componentProps: WidgetComponentProps = {
    widget: { ...widget, w, h },
    scale,
    isStudentView,
  };

  // If the component is a standard function, we can try to call it to check for WidgetLayout.
  // If it's a lazy component, this will just be a React component we can render.
  let output: WidgetOutput;

  // We use a type cast to check for $$typeof (lazy component marker)
  const CompCandidate = WidgetComponent as unknown as {
    $$typeof?: symbol;
    (props: WidgetComponentProps): WidgetOutput;
  };

  if (typeof CompCandidate === 'function' && !CompCandidate.$$typeof) {
    try {
      // Attempt to call as a function to see if it returns a WidgetLayout object
      output = CompCandidate(componentProps);
    } catch (_err) {
      // If it throws (e.g. using hooks incorrectly by calling as function),
      // fallback to standard rendering as a component
      output = React.createElement(WidgetComponent, componentProps);
    }
  } else {
    // It's likely a lazy component or class component, render normally
    output = React.createElement(WidgetComponent, componentProps);
  }

  const renderContent = () => {
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
              contentClassName ??
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

  return <Suspense fallback={<LoadingFallback />}>{renderContent()}</Suspense>;
};
