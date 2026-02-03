import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ClassesWidget from '../../../components/widgets/ClassesWidget';
import { useDashboard } from '../../../context/useDashboard';

vi.mock('../../../context/useDashboard');

describe('ClassesWidget RosterEditor', () => {
  const mockAddRoster = vi.fn();
  const mockUpdateRoster = vi.fn();
  const mockDeleteRoster = vi.fn();

  const mockWidget = {
    id: '1',
    type: 'classes' as const,
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    z: 1,
    flipped: false,
    config: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as Mock).mockReturnValue({
      rosters: [],
      addRoster: mockAddRoster,
      updateRoster: mockUpdateRoster,
      deleteRoster: mockDeleteRoster,
    });
  });

  it('renders single name field by default', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    // Open add modal
    await user.click(screen.getByRole('button', { name: /create new class/i }));

    expect(screen.getByPlaceholderText(/class name/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste full names or group names here/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/first names/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/last names/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /\+ add last name/i })
    ).toBeInTheDocument();
  });

  it('toggles to dual name fields', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    expect(
      screen.getByPlaceholderText(/paste first names/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste last names/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('saves correctly in single field mode with full names', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    const nameInput = screen.getByPlaceholderText(/class name/i);
    await user.type(nameInput, 'New Class');

    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    await user.type(namesTextarea, 'Alice Smith\nBob Jones');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddRoster).toHaveBeenCalled();
    });

    // In single-field mode, full names go into firstName, lastName is empty
    expect(mockAddRoster).toHaveBeenCalledWith('New Class', [
      expect.objectContaining({ firstName: 'Alice Smith', lastName: '' }),
      expect.objectContaining({ firstName: 'Bob Jones', lastName: '' }),
    ]);
  });

  it('saves correctly in dual field mode', async () => {
    const user = userEvent.setup();
    const existingRoster = {
      id: 'roster-1',
      name: 'Existing Class',
      students: [],
    };
    (useDashboard as Mock).mockReturnValue({
      rosters: [existingRoster],
      addRoster: mockAddRoster,
      updateRoster: mockUpdateRoster,
      deleteRoster: mockDeleteRoster,
    });

    render(<ClassesWidget widget={mockWidget} />);

    // Open edit modal
    await user.click(screen.getByRole('button', { name: /edit class/i }));

    // Toggle to last names
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    const firstsTextarea = screen.getByPlaceholderText(/paste first names/i);
    await user.clear(firstsTextarea);
    await user.type(firstsTextarea, 'Alice\nBob');

    const lastsTextarea = screen.getByPlaceholderText(/paste last names/i);
    await user.type(lastsTextarea, 'Smith\nJones');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateRoster).toHaveBeenCalled();
    });

    expect(mockUpdateRoster).toHaveBeenCalledWith(
      'roster-1',
      expect.objectContaining({
        name: 'Existing Class',
        students: [
          expect.objectContaining({ firstName: 'Alice', lastName: 'Smith' }),
          expect.objectContaining({ firstName: 'Bob', lastName: 'Jones' }),
        ],
      })
    );
  });

  it('auto-splits names when toggling from single to dual-field mode', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    // Enter full names in single field
    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    await user.type(namesTextarea, 'Alice Smith\nBob Jones\nCharlie');

    // Toggle to dual-field mode
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    // Verify names are split
    const firstsTextarea = screen.getByPlaceholderText(/paste first names/i);
    const lastsTextarea = screen.getByPlaceholderText(/paste last names/i);

    expect(firstsTextarea).toHaveValue('Alice\nBob\nCharlie');
    expect(lastsTextarea).toHaveValue('Smith\nJones\n');
  });

  it('merges names when toggling from dual to single-field mode', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    // Toggle to dual-field mode
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    // Enter separate first and last names
    const firstsTextarea = screen.getByPlaceholderText(/paste first names/i);
    const lastsTextarea = screen.getByPlaceholderText(/paste last names/i);

    await user.type(firstsTextarea, 'Alice\nBob');
    await user.type(lastsTextarea, 'Smith\nJones');

    // Toggle back to single-field mode
    await user.click(screen.getByRole('button', { name: /remove/i }));

    // Verify names are merged
    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    expect(namesTextarea).toHaveValue('Alice Smith\nBob Jones');
  });

  it('preserves data correctly when toggling modes and then saving', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    const nameInput = screen.getByPlaceholderText(/class name/i);
    await user.type(nameInput, 'Test Class');

    // Start with full names
    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    await user.type(namesTextarea, 'Alice Smith\nBob Jones');

    // Toggle to dual mode (should split)
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    // Toggle back to single mode (should merge)
    await user.click(screen.getByRole('button', { name: /remove/i }));

    // Save in single mode
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddRoster).toHaveBeenCalled();
    });

    // Data should be preserved as full names
    expect(mockAddRoster).toHaveBeenCalledWith('Test Class', [
      expect.objectContaining({ firstName: 'Alice Smith', lastName: '' }),
      expect.objectContaining({ firstName: 'Bob Jones', lastName: '' }),
    ]);
  });

  it('handles names without spaces when toggling to dual mode', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    // Enter names without spaces
    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    await user.type(namesTextarea, 'Alice\nBob\nCharlie');

    // Toggle to dual-field mode
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    // Names without spaces should stay in first name field
    const firstsTextarea = screen.getByPlaceholderText(/paste first names/i);
    const lastsTextarea = screen.getByPlaceholderText(/paste last names/i);

    expect(firstsTextarea).toHaveValue('Alice\nBob\nCharlie');
    expect(lastsTextarea).toHaveValue('\n\n');
  });

  it('handles mixed names (some with spaces, some without) when toggling', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={mockWidget} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    // Mix of full names and single names
    const namesTextarea = screen.getByPlaceholderText(
      /paste full names or group names here/i
    );
    await user.type(namesTextarea, 'Alice Smith\nBob\nCharlie Brown');

    // Toggle to dual-field mode
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    const firstsTextarea = screen.getByPlaceholderText(/paste first names/i);
    const lastsTextarea = screen.getByPlaceholderText(/paste last names/i);

    expect(firstsTextarea).toHaveValue('Alice\nBob\nCharlie');
    expect(lastsTextarea).toHaveValue('Smith\n\nBrown');
  });
});
