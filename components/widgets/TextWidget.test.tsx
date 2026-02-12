import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextWidget } from './TextWidget';
import { TextSettings } from './TextSettings';
import { WidgetData, TextConfig } from '../../types';
import { useDashboard } from '../../context/useDashboard';

// Mock useDashboard
const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
};

vi.mock('../../context/useDashboard');

describe('TextWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  const mockConfig: TextConfig = {
    content: 'Hello World',
    bgColor: '#fef9c3',
    fontSize: 18,
  };

  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'text',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: false,
    config: mockConfig,
  };

  it('renders content correctly', () => {
    render(<TextWidget widget={mockWidget} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies background color', () => {
    const { container } = render(<TextWidget widget={mockWidget} />);
    // The background color is applied to an overlay div
    const overlay = container.querySelector('.absolute.inset-0');
    expect(overlay).toHaveStyle({ backgroundColor: '#fef9c3' });
  });

  it('applies font size', () => {
    const { container } = render(<TextWidget widget={mockWidget} />);
    const contentDiv = container.querySelector('.relative.z-10') as HTMLElement;
    // JSDOM does not support container units (cqw/cqh) and will strip them from the style attribute.
    // We verify that the style object is being passed by checking for lineHeight which is supported.
    const styleAttr = contentDiv.getAttribute('style') ?? '';
    expect(styleAttr).toContain('line-height: 1.5');
  });

  it('updates content on blur', () => {
    render(<TextWidget widget={mockWidget} />);
    const editableDiv = screen
      .getByText('Hello World')
      .closest('div[contentEditable="true"]');

    expect(editableDiv).not.toBeNull();
    if (editableDiv) {
      editableDiv.innerHTML = 'New Content';
      fireEvent.blur(editableDiv);
      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
        config: { ...mockConfig, content: 'New Content' },
      });
    }
  });
});

describe('TextSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  const mockConfig: TextConfig = {
    content: '',
    bgColor: '#fef9c3',
    fontSize: 18,
  };

  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'text',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: true,
    config: mockConfig,
  };

  it('applies template when clicked', () => {
    render(<TextSettings widget={mockWidget} />);
    const templateButton = screen.getByText('Integrity Code');
    fireEvent.click(templateButton);

    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);

    const lastCall = mockUpdateWidget.mock.lastCall;
    expect(lastCall).toBeDefined();

    if (lastCall) {
      expect(lastCall[0]).toBe('test-widget');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(lastCall[1].config.content).toContain('Integrity Code');
    }
  });

  it('changes background color', () => {
    render(<TextSettings widget={mockWidget} />);
    // Find the button for the second color (#dcfce7 - Green)
    const colorButton = screen.getByLabelText('Select green background');
    fireEvent.click(colorButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: { ...mockConfig, bgColor: '#dcfce7' },
    });
  });

  it('changes font size', () => {
    render(<TextSettings widget={mockWidget} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '24' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: { ...mockConfig, fontSize: 24 },
    });
  });
});
