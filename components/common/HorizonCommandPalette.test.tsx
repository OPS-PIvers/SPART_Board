import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HorizonCommandPalette } from './HorizonCommandPalette';
import { useDashboard } from '../../context/useDashboard';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

// Mock TOOLS
vi.mock('../../config/tools', () => ({
  TOOLS: [
    { type: 'timer', label: 'Timer', icon: () => null },
    { type: 'text', label: 'Text', icon: () => null },
  ],
}));

describe('HorizonCommandPalette', () => {
  const mockAddWidget = vi.fn();
  const mockLoadDashboard = vi.fn();
  const mockClearAllWidgets = vi.fn();

  beforeEach(() => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      dashboards: [
        { id: '1', name: 'Math Board' },
        { id: '2', name: 'Science Board' },
      ],
      activeDashboard: { id: '1' },
      addWidget: mockAddWidget,
      loadDashboard: mockLoadDashboard,
      clearAllWidgets: mockClearAllWidgets,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden by default', () => {
    render(<HorizonCommandPalette />);
    expect(
      screen.queryByPlaceholderText('Type a command or search...')
    ).toBeNull();
  });

  it('opens on Cmd+K', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();
  });

  it('opens on Ctrl+K', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    // It might need animation time, but usually react testing library waits or we query immediately
    // Since it's conditional rendering, it should be gone.
    // However, the component returns null if !isOpen, so it should be immediate.
    expect(
      screen.queryByPlaceholderText('Type a command or search...')
    ).toBeNull();
  });

  it('shows smart suggestions when query is empty', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    expect(screen.getAllByText(/Quick Launch/).length).toBeGreaterThan(0);
    // Recent board 'Science Board' should be visible (id 2, active is 1)
    expect(screen.getByText('Science Board')).toBeInTheDocument();
  });

  it('filters results by query', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'time' } });

    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.queryByText('Text')).toBeNull();
  });

  it('executes action on click', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'time' } });

    fireEvent.click(screen.getByText('Timer'));
    expect(mockAddWidget).toHaveBeenCalledWith('timer');
  });

  it('executes board switch', () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'Science' } });

    fireEvent.click(screen.getByText('Science Board'));
    expect(mockLoadDashboard).toHaveBeenCalledWith('2');
  });
});
