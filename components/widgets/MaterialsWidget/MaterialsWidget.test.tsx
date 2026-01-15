import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaterialsWidget } from './index';
import { WidgetData, MaterialsConfig } from '../../../types';

// Mock useDashboard
const mockUpdateWidget = vi.fn();

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
  }),
}));

describe('MaterialsWidget', () => {
  const createWidget = (config: Partial<MaterialsConfig> = {}): WidgetData => {
    return {
      id: 'materials-1',
      type: 'materials',
      x: 0,
      y: 0,
      w: 300,
      h: 200,
      z: 1,
      config: {
        selectedItems: ['computer', 'pencil'],
        activeItems: ['computer'],
        ...config,
      },
    } as WidgetData;
  };

  it('renders selected items', () => {
    render(<MaterialsWidget widget={createWidget()} />);
    expect(screen.getByText('Computer')).toBeInTheDocument();
    expect(screen.getByText('Pencil')).toBeInTheDocument();
  });

  it('does not render unselected items', () => {
    render(<MaterialsWidget widget={createWidget()} />);
    expect(screen.queryByText('Notebook')).not.toBeInTheDocument();
  });

  it('renders "No materials selected" when list is empty', () => {
    render(<MaterialsWidget widget={createWidget({ selectedItems: [] })} />);
    expect(screen.getByText('No materials selected')).toBeInTheDocument();
  });
});
