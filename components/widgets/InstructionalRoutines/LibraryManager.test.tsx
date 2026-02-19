import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryManager } from './LibraryManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InstructionalRoutine } from '../../../config/instructionalRoutines';

// Mock dependencies
const mockUploadSticker = vi.fn();
const mockUploadDisplayImage = vi.fn();
const mockHttpsCallable = vi.fn();

vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
  }),
}));

vi.mock('../../../hooks/useStorage', () => ({
  useStorage: () => ({
    uploadSticker: mockUploadSticker,
    uploadDisplayImage: mockUploadDisplayImage,
  }),
}));

vi.mock('../../../config/firebase', () => ({
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockHttpsCallable,
}));

vi.mock('../../../utils/imageProcessing', () => ({
  removeBackground: vi.fn().mockResolvedValue('data:image/png;base64,mock-no-bg'),
  trimImageWhitespace: vi.fn().mockResolvedValue('data:image/png;base64,mock-trimmed'),
}));

// Mock IconPicker component since it's complex
vi.mock('./IconPicker', () => ({
  IconPicker: ({ onSelect, currentIcon }: { onSelect: (icon: string) => void; currentIcon: string }) => (
    <button onClick={() => onSelect('Star')} aria-label="Icon Picker">
      {currentIcon}
    </button>
  ),
}));

// Mock PromptDialog component
vi.mock('./PromptDialog', () => ({
  PromptDialog: ({ onConfirm, onCancel }: { onConfirm: (text: string) => void; onCancel: () => void }) => (
    <div role="dialog">
      <button onClick={() => onConfirm('Test Prompt')}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockRoutine: InstructionalRoutine = {
  id: 'test-routine',
  name: 'Test Routine',
  icon: 'Zap',
  color: 'blue',
  structure: 'linear',
  audience: 'student',
  gradeLevels: ['k-2'],
  grades: 'K-2',
  steps: [
    {
      text: 'Step 1',
      icon: 'Zap',
      color: 'blue',
      label: 'Start',
    },
  ],
};

describe('LibraryManager', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for image upload
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['mock-blob'], { type: 'image/png' })),
    } as unknown as Response);
  });

  it('renders correctly', () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Routine')).toBeInTheDocument();
    // Use getAllByRole for options or check display values if they are selected
    // Since 'linear' and 'student' are default values in mockRoutine, they should be the selected values of the comboboxes
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
    // Alternatively, check if the option exists
    expect(screen.getByRole('option', { name: 'Linear Steps' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'For Students' })).toBeInTheDocument();
    // Grade levels are rendered as buttons with text from ALL_GRADE_LEVELS (e.g. 'k-2')
    // CSS transforms it to uppercase, but text content remains 'k-2'
    expect(screen.getByText('k-2')).toBeInTheDocument();
  });

  it('updates routine name', () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByDisplayValue('Test Routine');
    // Using fireEvent.change for controlled component without state update in test
    fireEvent.change(input, { target: { value: 'New Name' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Name',
      })
    );
  });

  it('updates dropdowns', async () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find selects by current value or role
    // Structure select (currently Linear Steps)
    // The label is "Structure & Audience" but it's not associated with `htmlFor`.
    // Let's find by display value
    const linearOption = screen.getByRole('option', { name: 'Linear Steps' }) as HTMLOptionElement;
    const structureSelectElement = linearOption.closest('select');

    if (structureSelectElement) {
       await userEvent.selectOptions(structureSelectElement, 'cycle');
       expect(mockOnChange).toHaveBeenCalledWith(
         expect.objectContaining({ structure: 'cycle' })
       );
    }

    // Audience select (currently For Students)
    const studentOption = screen.getByRole('option', { name: 'For Students' }) as HTMLOptionElement;
    const audienceSelectElement = studentOption.closest('select');

    if (audienceSelectElement) {
       await userEvent.selectOptions(audienceSelectElement, 'teacher');
       expect(mockOnChange).toHaveBeenCalledWith(
         expect.objectContaining({ audience: 'teacher' })
       );
    }
  });

  it('toggles grade levels', async () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // 'k-2' is selected. Clicking it should remove it.
    const k2Button = screen.getByText('k-2');
    await userEvent.click(k2Button);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeLevels: [],
        grades: 'None',
      })
    );

    // Click '3-5' to add it.
    const g35Button = screen.getByText('3-5');
    await userEvent.click(g35Button);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeLevels: ['k-2', '3-5'], // Note: mockRoutine is not updated in re-renders unless we wrap or use state in test wrapper, but here we just check the call
      })
    );
  });

  it('adds a step', async () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Add step
    const addButton = screen.getByText(/Add Template Step/i);
    await userEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          ...mockRoutine.steps,
          expect.objectContaining({ text: '', label: 'Step' }),
        ],
      })
    );
  });

  it('removes a step', async () => {
    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Remove step
    const deleteBtn = screen.getByRole('button', { name: /Delete step/i });
    await userEvent.click(deleteBtn);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [],
      })
    );
  });

  it('handles Magic Design flow', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: {
        name: 'Magic Routine',
        steps: [{ text: 'Magic Step 1' }],
      },
    });

    render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const magicButton = screen.getByText(/Magic Design/i);
    await userEvent.click(magicButton);

    const confirmButton = screen.getByText('Confirm');
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        type: 'instructional-routine',
        prompt: 'Test Prompt',
      });
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Magic Routine',
        steps: expect.arrayContaining([expect.objectContaining({ text: 'Magic Step 1' })]),
      })
    );
  });

  it('handles image upload', async () => {
    mockUploadSticker.mockResolvedValue('https://mock-url.com/sticker.png');

    const { container } = render(
      <LibraryManager
        routine={mockRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find the file input for sticker
    // The component has: <input type="file" ... onChange={handleStickerUpload} ... />
    // It's hidden but associated with a label.
    // We can find by selector `input[type="file"]`. There are two per step (sticker, display).
    // First one is sticker.

    const fileInputs = container.querySelectorAll('input[type="file"]');
    const stickerInput = fileInputs[0];

    const file = new File(['(⌐□_□)'], 'sticker.png', { type: 'image/png' });

    await userEvent.upload(stickerInput, file);

    await waitFor(() => {
      expect(mockUploadSticker).toHaveBeenCalled();
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({ stickerUrl: 'https://mock-url.com/sticker.png' }),
        ]),
      })
    );
  });
});
