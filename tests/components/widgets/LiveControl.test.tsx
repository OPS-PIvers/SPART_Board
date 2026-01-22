import { render, screen, fireEvent } from '@testing-library/react';
import { LiveControl } from '@/components/widgets/LiveControl';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LiveStudent } from '@/types';

// Helper to render component with common props
const renderLiveControl = (overrides = {}) => {
  const defaultProps = {
    isLive: true, // Default to live so we can see the menu button
    studentCount: 2,
    students: [
      { id: 's1', name: 'Alice', status: 'active' },
      { id: 's2', name: 'Bob', status: 'frozen' },
    ] as LiveStudent[],
    code: 'ABC-123',
    joinUrl: 'https://app.school.com/join',
    onToggleLive: vi.fn(),
    onFreezeStudent: vi.fn(),
    onRemoveStudent: vi.fn(),
    onFreezeAll: vi.fn(),
  };

  const props = { ...defaultProps, ...overrides };
  return {
    ...render(<LiveControl {...props} />),
    props,
  };
};

describe('LiveControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cast button without dark background when not live', () => {
    const { props } = renderLiveControl({ isLive: false });
    const button = screen.getByLabelText('Start live session');
    expect(button.className).not.toContain('bg-slate-950/40');
    expect(button.className).toContain('hover:bg-slate-800/10');

    // Menu button should not be visible
    expect(screen.queryByLabelText(/connected student/)).not.toBeInTheDocument();
  });

  it('renders cast button with red background when live', () => {
    renderLiveControl({ isLive: true });
    const button = screen.getByLabelText('End live session');
    expect(button.className).toContain('bg-red-500');

    // Menu button should be visible
    expect(screen.getByLabelText(/connected students/)).toBeInTheDocument();
  });

  it('toggles live session when cast button is clicked', () => {
    const { props } = renderLiveControl({ isLive: false });
    const button = screen.getByLabelText('Start live session');
    fireEvent.click(button);
    expect(props.onToggleLive).toHaveBeenCalledTimes(1);
  });

  it('opens menu when student count button is clicked', () => {
    renderLiveControl();
    const menuButton = screen.getByLabelText(/connected students/);

    // Menu should initially be hidden
    expect(screen.queryByText('Classroom (2)')).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    // Menu content (portal) should now be visible
    expect(screen.getByText('Classroom (2)')).toBeInTheDocument();
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('app.school.com/join')).toBeInTheDocument();
  });

  it('renders student list correctly in menu', () => {
    renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Verify status indicators (implementation detail check via class, or accessible status)
    // Alice is active (green dot implied), Bob is frozen (line-through text)
    const bobName = screen.getByText('Bob');
    expect(bobName.className).toContain('line-through');

    const aliceName = screen.getByText('Alice');
    expect(aliceName.className).not.toContain('line-through');
  });

  it('calls onFreezeStudent when freeze button is clicked', () => {
    const { props } = renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));

    const freezeAliceBtn = screen.getByLabelText('Freeze Alice');
    fireEvent.click(freezeAliceBtn);

    expect(props.onFreezeStudent).toHaveBeenCalledWith('s1', 'active');
  });

  it('calls onFreezeStudent (unfreeze) when unfreeze button is clicked', () => {
    const { props } = renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));

    const unfreezeBobBtn = screen.getByLabelText('Unfreeze Bob');
    fireEvent.click(unfreezeBobBtn);

    expect(props.onFreezeStudent).toHaveBeenCalledWith('s2', 'frozen');
  });

  it('calls onRemoveStudent when trash button is clicked', () => {
    const { props } = renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));

    const removeAliceBtn = screen.getByLabelText('Remove Alice');
    fireEvent.click(removeAliceBtn);

    expect(props.onRemoveStudent).toHaveBeenCalledWith('s1');
  });

  it('calls onFreezeAll when "Freeze / Unfreeze All" is clicked', () => {
    const { props } = renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));

    // Accessible name is set via aria-label to "Freeze all students" (or "Unfreeze...")
    const freezeAllBtn = screen.getByRole('button', { name: /Freeze all students/i });
    fireEvent.click(freezeAllBtn);

    expect(props.onFreezeAll).toHaveBeenCalledTimes(1);
  });

  it('closes menu when X button is clicked', () => {
    renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));
    expect(screen.getByText('Classroom (2)')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Close menu');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Classroom (2)')).not.toBeInTheDocument();
  });

  it('closes menu when pressing Escape', () => {
    renderLiveControl();
    fireEvent.click(screen.getByLabelText(/connected students/));
    expect(screen.getByText('Classroom (2)')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Classroom (2)')).not.toBeInTheDocument();
  });
});
