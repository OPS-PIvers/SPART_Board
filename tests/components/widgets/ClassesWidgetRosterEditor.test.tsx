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
    render(<ClassesWidget widget={{ id: '1', type: 'classes', x: 0, y: 0, w: 6, h: 4 }} />);

    // Open add modal
    await user.click(screen.getByRole('button', { name: /create new class/i }));

    expect(screen.getByPlaceholderText(/class name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste full names or group names here/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/first names/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/last names/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ add last name/i })).toBeInTheDocument();
  });

  it('toggles to dual name fields', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={{ id: '1', type: 'classes', x: 0, y: 0, w: 6, h: 4 }} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    expect(screen.getByPlaceholderText(/first names/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last names/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('saves correctly in single field mode', async () => {
    const user = userEvent.setup();
    render(<ClassesWidget widget={{ id: '1', type: 'classes', x: 0, y: 0, w: 6, h: 4 }} />);

    await user.click(screen.getByRole('button', { name: /create new class/i }));

    const nameInput = screen.getByPlaceholderText(/class name/i);
    await user.type(nameInput, 'New Class');

    const namesTextarea = screen.getByPlaceholderText(/paste full names or group names here/i);
    await user.type(namesTextarea, 'Alice\nBob');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddRoster).toHaveBeenCalled();
    });

    expect(mockAddRoster).toHaveBeenCalledWith(
      'New Class',
      [
        expect.objectContaining({ firstName: 'Alice', lastName: '' }),
        expect.objectContaining({ firstName: 'Bob', lastName: '' }),
      ]
    );
  });

  it('saves correctly in dual field mode', async () => {
    const user = userEvent.setup();
    const existingRoster = { id: 'roster-1', name: 'Existing Class', students: [] };
    (useDashboard as Mock).mockReturnValue({
      rosters: [existingRoster],
      addRoster: mockAddRoster,
      updateRoster: mockUpdateRoster,
      deleteRoster: mockDeleteRoster,
    });

    render(<ClassesWidget widget={{ id: '1', type: 'classes', x: 0, y: 0, w: 6, h: 4 }} />);

    // Open edit modal
    await user.click(screen.getByRole('button', { name: /edit class/i }));

    // Toggle to last names
    await user.click(screen.getByRole('button', { name: /\+ add last name/i }));

    const firstsTextarea = screen.getByPlaceholderText(/first names/i);
    await user.type(firstsTextarea, 'Alice\nBob');

    const lastsTextarea = screen.getByPlaceholderText(/last names/i);
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
});
