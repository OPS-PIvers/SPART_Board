import { render } from '@testing-library/react';
import { QRWidget } from '../../../components/widgets/QRWidget';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData, QRConfig, TextConfig } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';

// Mock useDashboard
vi.mock('../../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

describe('QRWidget Link Repeater Connection', () => {
  const mockUpdateWidget = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates QR url when Text Widget content changes and sync is enabled', () => {
    // Setup dashboard with a Text Widget
    const textWidget: WidgetData = {
      id: 'text-1',
      type: 'text',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: {
        content: 'https://example.com/synced',
        bgColor: '#fff',
        fontSize: 12,
      } as TextConfig,
    };

    const qrWidget: WidgetData = {
      id: 'qr-1',
      type: 'qr',
      x: 2,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: {
        url: 'https://google.com',
        syncWithTextWidget: true,
      } as QRConfig,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: {
        widgets: [textWidget, qrWidget],
      },
      updateWidget: mockUpdateWidget,
    });

    render(<QRWidget widget={qrWidget} />);

    // Expect updateWidget to be called with the text content
    expect(mockUpdateWidget).toHaveBeenCalledWith('qr-1', {
      config: { ...qrWidget.config, url: 'https://example.com/synced' },
    });
  });

  it('does not update if sync is disabled', () => {
    // Setup dashboard with a Text Widget
    const textWidget: WidgetData = {
      id: 'text-1',
      type: 'text',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: {
        content: 'https://example.com/synced',
        bgColor: '#fff',
        fontSize: 12,
      } as TextConfig,
    };

    const qrWidget: WidgetData = {
      id: 'qr-1',
      type: 'qr',
      x: 2,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: {
        url: 'https://google.com',
        syncWithTextWidget: false,
      } as QRConfig,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: {
        widgets: [textWidget, qrWidget],
      },
      updateWidget: mockUpdateWidget,
    });

    render(<QRWidget widget={qrWidget} />);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('does not update if URLs match', () => {
    const textWidget: WidgetData = {
      id: 'text-1',
      type: 'text',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: {
        content: 'https://same.com',
        bgColor: '#fff',
        fontSize: 12,
      } as TextConfig,
    };

    const qrWidget: WidgetData = {
      id: 'qr-1',
      type: 'qr',
      x: 2,
      y: 0,
      w: 2,
      h: 2,
      z: 1,
      flipped: false,
      config: { url: 'https://same.com', syncWithTextWidget: true } as QRConfig,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: {
        widgets: [textWidget, qrWidget],
      },
      updateWidget: mockUpdateWidget,
    });

    render(<QRWidget widget={qrWidget} />);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});
