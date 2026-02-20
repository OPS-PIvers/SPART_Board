import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RandomSlots } from './RandomSlots';

// Mock useDashboard
vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    activeDashboard: {
      globalStyle: {
        fontFamily: 'inter',
      },
    },
  }),
}));

describe('RandomSlots', () => {
  const defaultProps = {
    displayResult: null,
    fontSize: 24,
    slotHeight: 100,
  };

  it('displays the result when provided', () => {
    render(<RandomSlots {...defaultProps} displayResult="Winner!" />);
    expect(screen.getByText('Winner!')).toBeInTheDocument();
  });

  it('displays "Ready?" when no result is provided', () => {
    render(<RandomSlots {...defaultProps} displayResult={null} />);
    expect(screen.getByText('Ready?')).toBeInTheDocument();
  });

  it('applies font size correctly', () => {
    render(
      <RandomSlots
        {...defaultProps}
        fontSize={48}
        displayResult="Test Result"
      />
    );
    // Find the element by its text content, avoiding implementation details like class names
    const textElement = screen.getByText('Test Result');
    // The style is calculated as `min(250px, ${fontStyle})`
    expect(textElement).toHaveStyle({ fontSize: 'min(250px, 48px)' });
  });
});
