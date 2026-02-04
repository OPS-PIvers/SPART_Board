import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRWidget, QRSettings } from './QRWidget';
import { WidgetData, QRConfig } from '../../types';

// Mock the context
const mockUpdateWidget = vi.fn();
const mockActiveDashboard = {
  widgets: [] as WidgetData[],
};

vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    activeDashboard: mockActiveDashboard,
    updateWidget: mockUpdateWidget,
  }),
}));

const createMockWidget = (config: Partial<QRConfig> = {}): WidgetData => ({
  id: 'test-widget-id',
  type: 'qr',
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  z: 1,
  flipped: false,
  config: {
    url: 'https://example.com',
    ...config,
  },
});

describe('QRWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveDashboard.widgets = [];
  });

  it('renders with default URL', () => {
    const widget = createMockWidget();
    render(<QRWidget widget={widget} />);

    const img = screen.getByAltText('QR Code');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain(encodeURIComponent('https://example.com'));
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders with custom URL', () => {
    const url = 'https://vitest.dev';
    const widget = createMockWidget({ url });
    render(<QRWidget widget={widget} />);

    const img = screen.getByAltText('QR Code');
    expect(img.src).toContain(encodeURIComponent(url));
    expect(screen.getByText(url)).toBeInTheDocument();
  });

  it('shows linked badge when synced', () => {
    const widget = createMockWidget({ syncWithTextWidget: true });
    render(<QRWidget widget={widget} />);

    expect(screen.getByText('Linked')).toBeInTheDocument();
  });

  it('does not show linked badge when not synced', () => {
    const widget = createMockWidget({ syncWithTextWidget: false });
    render(<QRWidget widget={widget} />);

    expect(screen.queryByText('Linked')).not.toBeInTheDocument();
  });
});

describe('QRSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveDashboard.widgets = [];
  });

  // Note: Using fireEvent instead of userEvent here because the component is fully controlled
  // via the useDashboard hook. In a unit test with mocks, the prop doesn't update
  // after the event, causing userEvent.type to "snap back" the value on each keystroke,
  // making it impossible to type a full string. fireEvent.change simulates the final state.

  it('updates URL when input changes', () => {
    const widget = createMockWidget();
    render(<QRSettings widget={widget} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://new-url.com' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        url: 'https://new-url.com',
      }) as unknown,
    });
  });

  it('disables input when synced', () => {
    const widget = createMockWidget({ syncWithTextWidget: true });
    render(<QRSettings widget={widget} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('toggles sync setting', () => {
    const widget = createMockWidget({ syncWithTextWidget: false });
    render(<QRSettings widget={widget} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({ syncWithTextWidget: true }) as unknown,
    });
  });

  it('shows warning when synced but no text widget exists', () => {
    mockActiveDashboard.widgets = []; // Ensure no widgets
    const widget = createMockWidget({ syncWithTextWidget: true });
    render(<QRSettings widget={widget} />);

    expect(screen.getByText(/No Text Widget found/i)).toBeInTheDocument();
  });
});
