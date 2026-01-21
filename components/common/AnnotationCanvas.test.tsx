import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AnnotationCanvas } from './AnnotationCanvas';

describe('AnnotationCanvas', () => {
  const defaultProps = {
    paths: [],
    color: '#000000',
    width: 5,
    canvasWidth: 800,
    canvasHeight: 600,
    onPathsChange: vi.fn(),
  };

  it('stops propagation on mousedown always', () => {
    const { container } = render(<AnnotationCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    fireEvent(canvas, event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('stops propagation on mousemove when drawing', () => {
    const { container } = render(<AnnotationCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Start drawing
    fireEvent.mouseDown(canvas);

    const moveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(moveEvent, 'stopPropagation');

    fireEvent(canvas, moveEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('does NOT stop propagation on mousemove when NOT drawing', () => {
    const { container } = render(<AnnotationCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    const moveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(moveEvent, 'stopPropagation');

    fireEvent(canvas, moveEvent);

    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });

  it('stops propagation on mouseup when drawing', () => {
    const { container } = render(<AnnotationCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Start drawing
    fireEvent.mouseDown(canvas);

    const upEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(upEvent, 'stopPropagation');

    fireEvent(canvas, upEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('does NOT stop propagation on mouseup when NOT drawing', () => {
    const { container } = render(<AnnotationCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    const upEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(upEvent, 'stopPropagation');

    fireEvent(canvas, upEvent);

    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });
});
