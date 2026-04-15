import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RosterEditorModal } from './RosterEditorModal';
import { ClassRoster } from '@/types';

describe('RosterEditorModal', () => {
  it('renders single name field by default for a new roster', () => {
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/class name/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste full names or group names here/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/paste first names/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /\+ last name/i })
    ).toBeInTheDocument();
  });

  it('toggles to dual name fields', async () => {
    const user = userEvent.setup();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /\+ last name/i }));

    expect(
      screen.getByPlaceholderText(/paste first names/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste last names/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('calls onSave with single-field full names and closes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={onClose}
        onSave={onSave}
      />
    );

    await user.type(screen.getByPlaceholderText(/class name/i), 'New Class');
    await user.type(
      screen.getByPlaceholderText(/paste full names or group names here/i),
      'Alice Smith\nBob Jones'
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New Class', [
        expect.objectContaining({ firstName: 'Alice Smith', lastName: '' }),
        expect.objectContaining({ firstName: 'Bob Jones', lastName: '' }),
      ]);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with split first/last names when in dual mode', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const existing: ClassRoster = {
      id: 'r1',
      name: 'Existing Class',
      students: [],
      driveFileId: null,
      studentCount: 0,
      createdAt: Date.now(),
    };

    render(
      <RosterEditorModal
        isOpen={true}
        roster={existing}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole('button', { name: /\+ last name/i }));
    const firsts = screen.getByPlaceholderText(/paste first names/i);
    await user.clear(firsts);
    await user.type(firsts, 'Alice\nBob');
    await user.type(
      screen.getByPlaceholderText(/paste last names/i),
      'Smith\nJones'
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'Existing Class',
        expect.arrayContaining([
          expect.objectContaining({ firstName: 'Alice', lastName: 'Smith' }),
          expect.objectContaining({ firstName: 'Bob', lastName: 'Jones' }),
        ])
      );
    });
  });

  it('splits full names when toggling single → dual', async () => {
    const user = userEvent.setup();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/paste full names or group names here/i),
      'Alice Smith\nBob Jones\nCharlie'
    );
    await user.click(screen.getByRole('button', { name: /\+ last name/i }));

    expect(screen.getByPlaceholderText(/paste first names/i)).toHaveValue(
      'Alice\nBob\nCharlie'
    );
    expect(screen.getByPlaceholderText(/paste last names/i)).toHaveValue(
      'Smith\nJones\n'
    );
  });

  it('merges names when toggling dual → single', async () => {
    const user = userEvent.setup();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /\+ last name/i }));
    await user.type(
      screen.getByPlaceholderText(/paste first names/i),
      'Alice\nBob'
    );
    await user.type(
      screen.getByPlaceholderText(/paste last names/i),
      'Smith\nJones'
    );
    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(
      screen.getByPlaceholderText(/paste full names or group names here/i)
    ).toHaveValue('Alice Smith\nBob Jones');
  });

  it('shows "+ Quiz PIN" button and toggles PIN column', async () => {
    const user = userEvent.setup();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByPlaceholderText(/^01/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /\+ quiz pin/i }));
    expect(screen.getByPlaceholderText(/^01/)).toBeInTheDocument();
  });

  it('persists PINs through save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    await user.type(screen.getByPlaceholderText(/class name/i), 'PIN Class');
    await user.type(
      screen.getByPlaceholderText(/paste full names or group names here/i),
      'Alice\nBob'
    );
    await user.click(screen.getByRole('button', { name: /\+ quiz pin/i }));
    await user.type(screen.getByPlaceholderText(/^01/), 'dragon\n42');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('PIN Class', [
        expect.objectContaining({ firstName: 'Alice', pin: 'dragon' }),
        expect.objectContaining({ firstName: 'Bob', pin: '42' }),
      ]);
    });
  });

  it('shows duplicate PIN warning', async () => {
    const user = userEvent.setup();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/paste full names or group names here/i),
      'Alice\nBob'
    );
    await user.click(screen.getByRole('button', { name: /\+ quiz pin/i }));
    await user.type(screen.getByPlaceholderText(/^01/), 'same\nsame');

    await waitFor(() => {
      expect(screen.getByText(/duplicate pins/i)).toBeInTheDocument();
    });
  });

  it('does not call onSave when name is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <RosterEditorModal
        isOpen={true}
        roster={null}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).toBeDisabled();
    await user.click(saveBtn);
    expect(onSave).not.toHaveBeenCalled();
  });
});
