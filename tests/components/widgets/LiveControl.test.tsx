import { render, screen } from '@testing-library/react';
import { LiveControl } from '@/components/widgets/LiveControl';
import { vi, describe, it, expect } from 'vitest';

describe('LiveControl', () => {
  it('renders cast button without dark background when not live', () => {
    const props = {
      isLive: false,
      studentCount: 0,
      students: [],
      onToggleLive: vi.fn(),
      onFreezeStudent: vi.fn(),
      onRemoveStudent: vi.fn(),
      onFreezeAll: vi.fn(),
    };

    render(<LiveControl {...props} />);
    const button = screen.getByLabelText('Start live session');
    expect(button.className).not.toContain('bg-slate-950/40');
    expect(button.className).toContain('hover:bg-slate-800/10');
  });

  it('renders cast button with red background when live', () => {
    const props = {
      isLive: true,
      studentCount: 0,
      students: [],
      onToggleLive: vi.fn(),
      onFreezeStudent: vi.fn(),
      onRemoveStudent: vi.fn(),
      onFreezeAll: vi.fn(),
    };

    render(<LiveControl {...props} />);
    const button = screen.getByLabelText('End live session');
    expect(button.className).toContain('bg-red-500');
  });
});
