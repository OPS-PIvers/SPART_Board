import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GuidedLearningPlayer } from './GuidedLearningPlayer';
import { GuidedLearningSet } from '@/types';

vi.mock('./interactions/TooltipInteraction', () => ({
  TooltipInteraction: ({
    step,
  }: {
    step: { xPct: number; yPct: number; text?: string };
  }) => <div data-testid="tooltip-coords">{`${step.xPct},${step.yPct}`}</div>,
}));

class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 400,
            height: 200,
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            right: 400,
            bottom: 200,
            toJSON: () => ({}),
          },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver
    );
  }

  disconnect = () => undefined;

  unobserve = () => undefined;
}

describe('GuidedLearningPlayer', () => {
  const originalGetBoundingClientRectDescriptor =
    Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect'
    );

  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 1000,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      configurable: true,
      get: () => 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value() {
        return {
          width: 400,
          height: 200,
          top: 0,
          left: 0,
          right: 400,
          bottom: 200,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    if (originalGetBoundingClientRectDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        'getBoundingClientRect',
        originalGetBoundingClientRectDescriptor
      );
    }
    vi.unstubAllGlobals();
  });

  it('converts tooltip and pin positions from image space into container space', () => {
    const set: GuidedLearningSet = {
      id: 'set-1',
      title: 'Player Test',
      imageUrls: ['https://example.com/image.png'],
      steps: [
        {
          id: 'step-1',
          xPct: 10,
          yPct: 80,
          imageIndex: 0,
          interactionType: 'tooltip',
          text: 'Hello',
        },
      ],
      mode: 'structured',
      createdAt: 0,
      updatedAt: 0,
    };

    render(<GuidedLearningPlayer set={set} />);

    fireEvent.load(screen.getByAltText('Player Test'));

    expect(screen.getByTestId('tooltip-coords')).toHaveTextContent('30,80');
    expect(
      screen.getByRole('button', { name: /step 1/i }).parentElement
    ).toHaveStyle({
      left: '30%',
      top: '80%',
    });
  });
});
