import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystConfig } from '../../types';
import { CatalystSettings } from './CatalystSettings';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
};

describe('CatalystSettings', () => {
  beforeEach(() => {
    vi.mocked(useDashboard).mockReturnValue(
      mockDashboardContext as ReturnType<typeof useDashboard>
    );
    mockUpdateWidget.mockClear();

    // Mock window interactions
    vi.spyOn(window, 'alert').mockImplementation(vi.fn());
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createWidget = (config: Partial<CatalystConfig> = {}): WidgetData => {
    return {
      id: 'catalyst-1',
      type: 'catalyst',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      z: 1,
      flipped: false,
      config: {
        activeCategory: null,
        activeStrategyId: null,
        ...config,
      },
    } as WidgetData;
  };

  it('renders default categories and routines', () => {
    render(<CatalystSettings widget={createWidget()} />);

    // Default categories should be visible
    expect(screen.getByText('Attention')).toBeInTheDocument();

    // Switch to routines tab
    fireEvent.click(screen.getByText('Routines'));
    expect(screen.getByText('Signal for Silence')).toBeInTheDocument();
  });

  it('allows adding a new category', () => {
    render(<CatalystSettings widget={createWidget()} />);

    fireEvent.click(screen.getByText('Add Category'));

    const labelInput = screen.getByDisplayValue('New Category');
    fireEvent.change(labelInput, { target: { value: 'My Custom Cat' } });

    fireEvent.click(screen.getByText('Save'));

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'catalyst-1',
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          customCategories: expect.arrayContaining([
            expect.objectContaining({
              label: 'My Custom Cat',
            }),
          ]),
        }),
      })
    );
  });

  it('prevents deleting a category that is in use', () => {
    render(<CatalystSettings widget={createWidget()} />);

    // 'Get Attention' category is used by 'Signal for Silence'
    // It's the first category.
    const deleteBtns = screen.getAllByLabelText('Delete Category');
    const deleteBtn = deleteBtns[0]; // Assuming Attention is first

    fireEvent.click(deleteBtn);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('in use')
    );
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('allows editing a routine', () => {
    render(<CatalystSettings widget={createWidget()} />);
    fireEvent.click(screen.getByText('Routines'));

    // Edit 'Signal for Silence' (first routine)
    const editBtns = screen.getAllByLabelText('Edit Routine');
    const editBtn = editBtns[0];

    fireEvent.click(editBtn);

    const titleInput = screen.getByDisplayValue('Signal for Silence');
    fireEvent.change(titleInput, { target: { value: 'Updated Signal' } });

    fireEvent.click(screen.getByText('Save'));

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'catalyst-1',
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          customRoutines: expect.arrayContaining([
            expect.objectContaining({
              title: 'Updated Signal',
            }),
          ]),
        }),
      })
    );
  });

  it('validates JSON in associated widgets', async () => {
    render(<CatalystSettings widget={createWidget()} />);
    fireEvent.click(screen.getByText('Routines'));

    // Add a new routine to test with clean state
    fireEvent.click(screen.getByText('Add Routine'));

    // Add a widget to the new routine
    fireEvent.click(screen.getByText('Add Widget'));

    // Find the textarea for config (it defaults to {})
    const textareas = screen.getAllByRole('textbox');
    // The last one should be the config textarea
    const jsonInput = textareas[textareas.length - 1] as HTMLTextAreaElement;

    // Enter invalid JSON
    fireEvent.change(jsonInput, { target: { value: '{ invalid: json ' } });

    // Expect error message
    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });

    // Try to save
    fireEvent.click(screen.getByText('Save'));
    expect(window.alert).toHaveBeenCalledWith(
      'Please fix JSON errors before saving.'
    );
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Fix JSON
    fireEvent.change(jsonInput, { target: { value: '{ "valid": true }' } });

    // Error should be gone
    await waitFor(() => {
      expect(screen.queryByText('Invalid JSON format')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save'));
    expect(mockUpdateWidget).toHaveBeenCalled();
  });

  it('merges default and custom routines correctly', () => {
    // Create a widget with one custom routine that OVERRIDES a default one
    // and one that is NEW.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const customRoutine = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...CATALYST_ROUTINES[0], // Override first routine
      title: 'Overridden Routine',
    };
    const newRoutine: CatalystRoutine = {
      id: 'new-routine',
      title: 'Brand New Routine',
      category: 'Get Attention',
      icon: 'Zap',
      shortDesc: 'New',
      instructions: 'New',
      associatedWidgets: [],
    };

    const widget = createWidget({
      customRoutines: [customRoutine, newRoutine],
    });

    render(<CatalystSettings widget={widget} />);
    fireEvent.click(screen.getByText('Routines'));

    expect(screen.getByText('Overridden Routine')).toBeInTheDocument();
    expect(screen.getByText('Brand New Routine')).toBeInTheDocument();
    expect(screen.queryByText('Signal for Silence')).not.toBeInTheDocument(); // Original title should be gone
  });
});
