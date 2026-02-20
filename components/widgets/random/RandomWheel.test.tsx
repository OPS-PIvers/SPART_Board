import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RandomWheel } from './RandomWheel';

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

describe('RandomWheel', () => {
  const defaultProps = {
    students: ['Alice', 'Bob', 'Charlie'],
    rotation: 0,
    wheelSize: 300,
    displayResult: null,
    isSpinning: false,
    resultFontSize: 24,
  };

  it('renders a slice for each student', () => {
    render(<RandomWheel {...defaultProps} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders the correct number of slices', () => {
    const { container } = render(<RandomWheel {...defaultProps} />);
    // The component renders a path for each student.
    const paths = container.querySelectorAll('svg > g > path');
    expect(paths.length).toBe(3);
  });

  it('displays the result when not spinning', () => {
    render(
      <RandomWheel
        {...defaultProps}
        displayResult="Winner!"
        isSpinning={false}
      />
    );
    expect(screen.getByText('Winner!')).toBeInTheDocument();
  });

  it('does not display the result when spinning', () => {
    render(
      <RandomWheel
        {...defaultProps}
        displayResult="Winner!"
        isSpinning={true}
      />
    );
    expect(screen.queryByText('Winner!')).not.toBeInTheDocument();
  });

  it('handles empty student list gracefully', () => {
    const { container } = render(
      <RandomWheel {...defaultProps} students={[]} />
    );
    const paths = container.querySelectorAll('svg > g > path');
    expect(paths.length).toBe(0);
  });
});
