import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { WorkSymbolsWidget, WorkSymbolsSettings } from './WorkSymbolsWidget';
import { useDashboard } from '../../context/useDashboard';
import { DashboardContextValue } from '../../context/DashboardContextValue';
import { WidgetData, WorkSymbolsConfig } from '../../types';

// Mock dependencies
vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();

const mockWidget: WidgetData = {
  id: 'work-symbols-1',
  type: 'workSymbols',
  x: 0,
  y: 0,
  w: 320,
  h: 350,
  z: 1,
  flipped: false,
  config: {
    voiceLevel: null,
    workMode: null,
    interactionMode: null,
  } as WorkSymbolsConfig,
};

describe('WorkSymbolsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
    } as Partial<DashboardContextValue>);
  });

  it('renders category buttons initially', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    expect(screen.getByText('Volume')).toBeDefined();
    expect(screen.getByText('Group Size')).toBeDefined();
    expect(screen.getByText('Interaction')).toBeDefined();
  });

  it('navigates to Volume category and shows options', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Volume'));

    expect(screen.getByText('Volume Level')).toBeDefined();
    expect(screen.getByText('Silence')).toBeDefined();
    expect(screen.getByText('Whisper')).toBeDefined();
    expect(screen.getByText('Conversation')).toBeDefined();
  });

  it('selects a volume level', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Volume'));
    fireEvent.click(screen.getByText('Silence'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('work-symbols-1', {
      config: {
        ...mockWidget.config,
        voiceLevel: 0,
      },
    });
  });

  it('applies two-column grid layout for elementary', () => {
    const elementaryWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        layout: 'elementary',
      } as WorkSymbolsConfig,
    };
    render(<WorkSymbolsWidget widget={elementaryWidget} />);

    // The main container should have 'grid grid-cols-2'
    const volumeButton = screen.getByText('Volume').closest('button');
    const container = volumeButton?.parentElement;
    expect(container).toHaveClass('grid grid-cols-2');

    // Volume button should have 'col-span-2'
    expect(volumeButton).toHaveClass('col-span-2');
  });

  it('navigates back from a category', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Volume'));

    // Find back button by icon (it has ArrowLeft)
    // In our mock/implementation we use lucide-react, which we didn't mock here specifically
    // but the test should find the button.
    const backButton = screen.getByRole('button', { name: '' }); // The one with ArrowLeft
    fireEvent.click(backButton);

    expect(screen.getByText('Volume')).toBeDefined();
  });

  it('selects a group mode', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Group Size'));
    fireEvent.click(screen.getByText('Partner'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('work-symbols-1', {
      config: {
        ...mockWidget.config,
        workMode: 'partner',
      },
    });
  });

  it('selects an interaction mode', () => {
    render(<WorkSymbolsWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Interaction'));
    fireEvent.click(screen.getByText('Respectful'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('work-symbols-1', {
      config: {
        ...mockWidget.config,
        interactionMode: 'respectful',
      },
    });
  });
});

describe('WorkSymbolsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
    } as Partial<DashboardContextValue>);
  });

  it('renders layout options', () => {
    render(<WorkSymbolsSettings widget={mockWidget} />);
    expect(screen.getByText('Secondary')).toBeDefined();
    expect(screen.getByText('Elementary')).toBeDefined();
  });

  it('updates layout to elementary', () => {
    render(<WorkSymbolsSettings widget={mockWidget} />);
    fireEvent.click(screen.getByText('Elementary'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('work-symbols-1', {
      config: {
        ...mockWidget.config,
        layout: 'elementary',
      },
    });
  });

  it('updates layout back to secondary', () => {
    const elementaryWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        layout: 'elementary',
      } as WorkSymbolsConfig,
    };
    render(<WorkSymbolsSettings widget={elementaryWidget} />);
    fireEvent.click(screen.getByText('Secondary'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('work-symbols-1', {
      config: {
        ...mockWidget.config,
        layout: 'secondary',
      },
    });
  });
});
