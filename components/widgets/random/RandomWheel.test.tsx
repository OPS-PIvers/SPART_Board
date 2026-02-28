import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RandomWheel } from './RandomWheel';
import { useDashboard } from '../../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

describe('RandomWheel Component', () => {
  it('renders correctly', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: { globalStyle: DEFAULT_GLOBAL_STYLE },
    });

    render(
      <RandomWheel
        students={['Alice', 'Bob']}
        rotation={0}
        wheelSize={300}
        displayResult={null}
        isSpinning={false}
        resultFontSize={32}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows display result when not spinning', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: { globalStyle: DEFAULT_GLOBAL_STYLE },
    });

    render(
      <RandomWheel
        students={['Alice', 'Bob']}
        rotation={0}
        wheelSize={300}
        displayResult="Winner!"
        isSpinning={false}
        resultFontSize={32}
      />
    );

    expect(screen.getByText('Winner!')).toBeInTheDocument();
  });

  it('does not show display result when spinning', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: { globalStyle: DEFAULT_GLOBAL_STYLE },
    });

    render(
      <RandomWheel
        students={['Alice', 'Bob']}
        rotation={0}
        wheelSize={300}
        displayResult="Winner!"
        isSpinning={true}
        resultFontSize={32}
      />
    );

    expect(screen.queryByText('Winner!')).not.toBeInTheDocument();
  });
});
