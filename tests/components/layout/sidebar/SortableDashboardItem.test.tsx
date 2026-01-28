import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortableDashboardItem } from '../../../../components/layout/sidebar/SortableDashboardItem';
import { Dashboard } from '../../../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Mock dnd-kit utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('SortableDashboardItem', () => {
  const mockDashboard: Dashboard = {
    id: '123',
    name: 'Test Dashboard',
    background: 'bg-blue-500',
    widgets: [],
    createdAt: 1625097600000,
    isDefault: false,
  };

  const mockProps = {
    db: mockDashboard,
    isActive: false,
    onLoad: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
    onDuplicate: vi.fn(),
    onShare: vi.fn(),
    canShare: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SortableDashboardItem {...mockProps} />);
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    // Check if background div is rendered
    // Since it's 'bg-blue-500', it should render a div with that class
    // We can't easily query by class unless we use container.querySelector or similar,
    // but we can check if the image is NOT present
    const images = screen.queryAllByRole('img');
    expect(images.length).toBe(0);
  });

  it('renders image background correctly', () => {
    const imageDb = {
      ...mockDashboard,
      background: 'https://example.com/image.jpg',
    };
    const { container } = render(
      <SortableDashboardItem {...mockProps} db={imageDb} />
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('calls onLoad when clicked', () => {
    render(<SortableDashboardItem {...mockProps} />);
    // The main container has the onClick. It's the parent div.
    // We can find it by text and go up, or click the text which bubbles up.
    fireEvent.click(screen.getByText('Test Dashboard'));
    expect(mockProps.onLoad).toHaveBeenCalledWith(mockDashboard.id);
  });

  it('calls onSetDefault when star button is clicked', () => {
    render(<SortableDashboardItem {...mockProps} />);
    const button = screen.getByTitle('Set as Default');
    fireEvent.click(button);
    expect(mockProps.onSetDefault).toHaveBeenCalledWith(mockDashboard.id);
  });

  it('calls onRename when rename button is clicked', () => {
    render(<SortableDashboardItem {...mockProps} />);
    const button = screen.getByTitle('Rename');
    fireEvent.click(button);
    expect(mockProps.onRename).toHaveBeenCalledWith(
      mockDashboard.id,
      mockDashboard.name
    );
  });

  it('calls onDuplicate when duplicate button is clicked', () => {
    render(<SortableDashboardItem {...mockProps} />);
    const button = screen.getByTitle('Duplicate');
    fireEvent.click(button);
    expect(mockProps.onDuplicate).toHaveBeenCalledWith(mockDashboard.id);
  });

  it('calls onShare when share button is clicked', () => {
    render(<SortableDashboardItem {...mockProps} />);
    const button = screen.getByTitle('Share');
    fireEvent.click(button);
    expect(mockProps.onShare).toHaveBeenCalledWith(mockDashboard);
  });

  it('does not render share button when canShare is false', () => {
    render(<SortableDashboardItem {...mockProps} canShare={false} />);
    const button = screen.queryByTitle('Share');
    expect(button).not.toBeInTheDocument();
  });

  it('handles delete flow correctly', () => {
    const { container } = render(<SortableDashboardItem {...mockProps} />);

    // 1. Click trash icon (label)
    const deleteTrigger = container.querySelector(
      `label[for="delete-dashboard-${mockDashboard.id}"]`
    );
    expect(deleteTrigger).toBeInTheDocument();

    if (deleteTrigger) {
      fireEvent.click(deleteTrigger);
    }

    // Now the checkbox should be checked.
    // In React testing library with fireEvent, clicking a label for a checkbox toggles the checkbox IF it's a real click.
    // However, the CSS relies on `peer-checked`.
    // Let's simply fire click on the checkbox itself to simulate the state change if label click fails,
    // but label click *should* work.

    // Let's check if the modal text is visible.
    // Note: The modal is hidden via CSS `peer-checked:flex hidden`.
    // JSDOM doesn't compute styles fully so `toBeVisible()` might assume it's visible unless `display: none` is explicit on the element style or parent.
    // Here it relies on class names.
    // But testing-library focuses on accessibility.
    // Let's assume for this unit test we want to assert the text is present in the document.

    expect(screen.getByText('Delete board')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();

    // 2. Click Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check onDelete NOT called
    expect(mockProps.onDelete).not.toHaveBeenCalled();

    // 3. Click Delete (Confirm)
    // We need to open it again because Cancel usually unchecks the box?
    // The Cancel button is a label for the same checkbox!
    // <label htmlFor... className="...">Cancel</label>
    // So clicking it toggles the checkbox off.

    // Open again
    if (deleteTrigger) {
      fireEvent.click(deleteTrigger);
    }

    const deleteConfirmButton = screen.getByText('Delete', {
      selector: 'button',
    });
    fireEvent.click(deleteConfirmButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(mockDashboard.id);
  });
});
