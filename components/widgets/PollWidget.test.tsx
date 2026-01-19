import { render, screen } from '@testing-library/react';
import { PollSettings } from './PollWidget';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the dependencies
vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: vi.fn(),
  }),
}));

// Mock the MagicInput component
vi.mock('../common/MagicInput', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MagicInput: ({ onGenerate }: { onGenerate: (data: any) => void }) => (
    <button
      data-testid="magic-button"
      onClick={() =>
        onGenerate({ question: 'Magic Question', options: ['A', 'B'] })
      }
    >
      Generate
    </button>
  ),
}));

describe('PollSettings', () => {
  it('should render the magic generation button', () => {
    const mockWidget = {
      id: 'test-widget',
      type: 'poll' as const,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      z: 0,
      flipped: false,
      config: {
        question: 'Test',
        options: [],
      },
    };

    render(<PollSettings widget={mockWidget} />);
    expect(screen.getByTestId('magic-button')).toBeInTheDocument();
  });
});
