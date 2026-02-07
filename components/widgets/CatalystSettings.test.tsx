import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystConfig, CatalystRoutine } from '../../types';
import { CatalystSettings } from './CatalystSettings';
import { CATALYST_ROUTINES } from '../../config/catalystRoutines';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();

// Type the mock as the return type of useDashboard
type DashboardHookReturn = ReturnType<typeof useDashboard>;

const mockDashboardContext: Partial<DashboardHookReturn> = {
  updateWidget: mockUpdateWidget,
};

describe('CatalystSettings', () => {
  beforeEach(() => {
    vi.mocked(useDashboard).mockReturnValue(
      mockDashboardContext as DashboardHookReturn
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

    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateWidget.mock.calls[0];
    expect(callArgs[0]).toBe('catalyst-1');
    const updateArg = callArgs[1] as Partial<WidgetData>;
    expect(updateArg.config).toBeDefined();
    const config = updateArg.config as CatalystConfig;
    expect(config.customCategories).toBeDefined();
    expect(
      config.customCategories?.some((cat) => cat.label === 'My Custom Cat')
    ).toBe(true);
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

    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateWidget.mock.calls[0];
    expect(callArgs[0]).toBe('catalyst-1');
    const updateArg = callArgs[1] as Partial<WidgetData>;
    expect(updateArg.config).toBeDefined();
    const config = updateArg.config as CatalystConfig;
    expect(config.customRoutines).toBeDefined();
    expect(
      config.customRoutines?.some((r) => r.title === 'Updated Signal')
    ).toBe(true);
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
    const customRoutine = {
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

  it('persists deleted default categories as tombstones', () => {
    // Since default categories all have routines, we need to test with a scenario
    // where we first add a custom category, then delete a routine to free up a default category
    // For simplicity, let's just test that deleting a routine causes tombstone persistence
    // and the category tombstone test can be implicit through the initialization test

    // Actually, let's create a more isolated scenario: initialize with removed routines
    // so a category becomes deletable, then delete it
    const widget = createWidget({
      removedRoutineIds: ['signal-silence', 'call-response'], // Remove all routines from 'Get Attention'
    });

    render(<CatalystSettings widget={widget} />);

    // Now 'Get Attention' (Attention) should be deletable since no routines use it
    const deleteBtns = screen.getAllByLabelText('Delete Category');
    // Click the first delete button (should be 'Attention' / 'Get Attention')
    fireEvent.click(deleteBtns[0]);

    // Check that updateWidget was called with removedCategoryIds
    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateWidget.mock.calls[0];
    const updateArg = callArgs[1] as Partial<WidgetData>;
    const config = updateArg.config as CatalystConfig;

    // Should have removedCategoryIds tracking the deleted default
    expect(config.removedCategoryIds).toBeDefined();
    expect(config.removedCategoryIds?.length).toBeGreaterThan(0);
    expect(config.removedCategoryIds).toContain('Get Attention');
  });

  it('persists deleted default routines as tombstones', () => {
    render(<CatalystSettings widget={createWidget()} />);
    fireEvent.click(screen.getByText('Routines'));

    // Delete the first routine
    const deleteBtns = screen.getAllByLabelText('Delete Routine');
    fireEvent.click(deleteBtns[0]);

    // Check that updateWidget was called with removedRoutineIds
    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateWidget.mock.calls[0];
    const updateArg = callArgs[1] as Partial<WidgetData>;
    const config = updateArg.config as CatalystConfig;

    // Should have removedRoutineIds tracking the deleted default
    expect(config.removedRoutineIds).toBeDefined();
    expect(config.removedRoutineIds?.length).toBeGreaterThan(0);
  });

  it('excludes removed categories from initialization', () => {
    const widget = createWidget({
      removedCategoryIds: ['Get Attention', 'Engage'], // Remove two defaults
    });

    render(<CatalystSettings widget={widget} />);

    // Should not see removed categories in the list
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
    expect(screen.queryByText('Engage')).not.toBeInTheDocument();

    // Should still see remaining defaults
    expect(screen.getByText('Set Up')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('excludes removed routines from initialization', () => {
    const widget = createWidget({
      removedRoutineIds: ['signal-silence'], // Remove a default routine
    });

    render(<CatalystSettings widget={widget} />);
    fireEvent.click(screen.getByText('Routines'));

    // Should not see removed routine
    expect(screen.queryByText('Signal for Silence')).not.toBeInTheDocument();
  });
});
