import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SentenceStemsWidget } from './SentenceStemsWidget';
import { WidgetData } from '@/types';

// Mock useDashboard since the widget might use it
vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: vi.fn(),
  }),
}));

const mockWidget: WidgetData = {
  id: 'test-widget',
  type: 'sentence-stems',
  x: 0,
  y: 0,
  w: 320,
  h: 450,
  z: 1,
  flipped: false,
  config: {},
};

describe('SentenceStemsWidget', () => {
  it('renders correctly and defaults to "Listen Closely" expanded', () => {
    render(<SentenceStemsWidget widget={mockWidget} />);

    // Check if the title "Discussion Stems" is visible
    expect(screen.getByText('Discussion Stems')).toBeDefined();

    // Check if the category label is visible
    expect(screen.getByText('Listen Closely')).toBeDefined();

    // Check if a specific stem from "Listen Closely" is visible
    expect(screen.getByText(/What do you mean by/)).toBeDefined();
  });

  it('toggles accordion sections when clicked', () => {
    render(<SentenceStemsWidget widget={mockWidget} />);

    // Find and click the "Share What You Think" button
    const shareButton = screen.getByText('Share What You Think');
    fireEvent.click(shareButton);

    // Check if a specific stem from "Share What You Think" is now visible
    expect(
      screen.getByText(/I think ________ because ________./)
    ).toBeDefined();

    // "Listen Closely" stems should no longer be visible as the accordion toggled
    expect(screen.queryByText(/What do you mean by/)).toBeNull();

    // Click it again to collapse it
    fireEvent.click(shareButton);
    expect(screen.queryByText(/I think ________ because ________./)).toBeNull();
  });
});
