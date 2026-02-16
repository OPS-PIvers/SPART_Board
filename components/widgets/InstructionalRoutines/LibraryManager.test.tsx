import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryManager } from './LibraryManager';
import { InstructionalRoutine } from '../../../config/instructionalRoutines';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from 'firebase/auth';

// Mock dependencies
const mockOnChange = vi.fn();
const mockOnSave = vi.fn();
const mockOnCancel = vi.fn();

const mockUser: Partial<User> = {
  uid: 'test-user-id',
};

const mockUploadSticker = vi.fn();
const mockUploadDisplayImage = vi.fn();

vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../../hooks/useStorage', () => ({
  useStorage: () => ({
    uploadSticker: mockUploadSticker,
    uploadDisplayImage: mockUploadDisplayImage,
  }),
}));

const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockHttpsCallable,
}));

vi.mock('../../../config/firebase', () => ({
  functions: {},
}));

vi.mock('../../../utils/imageProcessing', () => ({
  removeBackground: vi
    .fn()
    .mockResolvedValue('data:image/png;base64,mocked-bg-removed'),
  trimImageWhitespace: vi
    .fn()
    .mockResolvedValue('data:image/png;base64,mocked-trimmed'),
}));

// Mock IconPicker to simplify testing
vi.mock('./IconPicker', () => ({
  IconPicker: ({
    currentIcon,
    onSelect,
  }: {
    currentIcon: string;
    onSelect: (icon: string) => void;
  }) => (
    <button onClick={() => onSelect('Zap')} data-testid="icon-picker">
      {currentIcon}
    </button>
  ),
}));

const defaultRoutine: InstructionalRoutine = {
  id: 'test-routine',
  name: 'Test Routine',
  icon: 'Book',
  color: 'blue',
  structure: 'linear',
  audience: 'student',
  gradeLevels: ['k-2', '3-5'],
  grades: 'K-2, 3-5',
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
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(['mock-blob'])),
        ok: true,
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: vi.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: vi.fn(),
        formData: vi.fn(),
        json: vi.fn(),
        text: vi.fn(),
      } as unknown as Response)
    );
  });

  it('renders correctly with initial routine data', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Routine')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Step 1')).toBeInTheDocument();
    // Use getByDisplayValue for input fields, getByText for non-inputs
    // 'Start' is the value of the label input
    expect(screen.getByDisplayValue('Start')).toBeInTheDocument();
  });

  it('calls onChange when routine name is updated', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('e.g. Think-Pair-Share');
    fireEvent.change(nameInput, { target: { value: 'Updated Routine' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultRoutine,
      name: 'Updated Routine',
    });
  });

  it('calls onChange when structure is updated', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const structureSelect = screen.getByDisplayValue('Linear Steps');
    fireEvent.change(structureSelect, { target: { value: 'cycle' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultRoutine,
      structure: 'cycle',
    });
  });

  it('adds a grade level when clicked', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // '6-8' is not in defaultRoutine.gradeLevels
    const gradeButton = screen.getByText('6-8');
    fireEvent.click(gradeButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        gradeLevels: expect.arrayContaining(['k-2', '3-5', '6-8']),
      })
    );
  });

  it('removes a grade level when clicked', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // 'k-2' is in defaultRoutine.gradeLevels
    const gradeButton = screen.getByText('k-2');
    fireEvent.click(gradeButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        gradeLevels: expect.not.arrayContaining(['k-2']),
      })
    );
  });

  it('adds a new step', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const addButton = screen.getByText(/Add Template Step/i);
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultRoutine,
      steps: [
        ...defaultRoutine.steps,
        { text: '', icon: 'Zap', color: 'blue', label: 'Step' },
      ],
    });
  });

  it('removes a step', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByLabelText('Delete step');
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultRoutine,
      steps: [],
    });
  });

  it('updates step text', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const stepInput = screen.getByDisplayValue('Step 1');
    fireEvent.change(stepInput, { target: { value: 'Updated Step' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [expect.objectContaining({ text: 'Updated Step' })] as unknown[],
      })
    );
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/Save to Library/i);
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('calls onCancel when back button is clicked', () => {
    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const backButton = screen.getByLabelText('Go back');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles Magic Design generation', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: {
        name: 'Magic Routine',
        steps: [{ text: 'Magic Step 1', icon: 'Star' }],
      },
    });

    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click Magic Design button
    const magicButton = screen.getByText(/Magic Design/i);
    fireEvent.click(magicButton);

    // Dialog should appear
    expect(
      screen.getByText('Describe the instructional routine you want to create')
    ).toBeInTheDocument();

    // Enter prompt
    const promptInput = screen.getByPlaceholderText(/e.g., "A 3-step routine/i);
    fireEvent.change(promptInput, { target: { value: 'Test Prompt' } });

    // Click Generate/Confirm (which is "Generate" in the component props passed to PromptDialog)
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        type: 'instructional-routine',
        prompt: 'Test Prompt',
      });
    });

    // Check if onChange was called with new data
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Magic Routine',
        steps: expect.arrayContaining([
          expect.objectContaining({ text: 'Magic Step 1' }),
        ]) as unknown[],
      })
    );
  });

  it('handles sticker upload', async () => {
    mockUploadSticker.mockResolvedValue('https://example.com/sticker.png');

    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const uploadInput = screen.getByLabelText('Upload sticker');

    // Create a mock file
    const file = new File(['(⌐□_□)'], 'sticker.png', { type: 'image/png' });

    // Simulate upload
    fireEvent.change(uploadInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadSticker).toHaveBeenCalled();
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            stickerUrl: 'https://example.com/sticker.png',
          }),
        ] as unknown[],
      })
    );
  });

  it('handles display image upload', async () => {
    mockUploadDisplayImage.mockResolvedValue('https://example.com/image.png');

    render(
      <LibraryManager
        routine={defaultRoutine}
        onChange={mockOnChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const uploadInput = screen.getByLabelText('Upload display image');

    const file = new File(['image data'], 'image.jpg', { type: 'image/jpeg' });

    fireEvent.change(uploadInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadDisplayImage).toHaveBeenCalled();
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            imageUrl: 'https://example.com/image.png',
          }),
        ] as unknown[],
      })
    );
  });
});
