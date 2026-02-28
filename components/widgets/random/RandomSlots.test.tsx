import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RandomSlots } from './RandomSlots';
import { useDashboard } from '../../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

describe('RandomSlots Component', () => {
  it('renders correctly with default props', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: { globalStyle: DEFAULT_GLOBAL_STYLE },
    });

    render(<RandomSlots displayResult={null} fontSize={32} slotHeight={100} />);

    expect(screen.getByText('Ready?')).toBeInTheDocument();
  });

  it('renders correctly with a display result', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: { globalStyle: DEFAULT_GLOBAL_STYLE },
    });

    render(
      <RandomSlots displayResult="Winner!" fontSize={32} slotHeight={100} />
    );

    expect(screen.getByText('Winner!')).toBeInTheDocument();
  });
});
