import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextWidget, TextSettings } from './TextWidget';
import { WidgetData, TextConfig } from '../../types';

// Mock useDashboard
const mockUpdateWidget = vi.fn();
vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
  }),
}));

describe('TextWidget', () => {
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
    const contentDiv = container.querySelector('.relative.z-10');
    expect(contentDiv).toHaveStyle({ fontSize: '18px' });
  });

  it('updates content on blur', () => {
    render(<TextWidget widget={mockWidget} />);
    const editableDiv = screen.getByText('Hello World').closest('div[contentEditable="true"]');

    if (editableDiv) {
      fireEvent.blur(editableDiv, { target: { innerHTML: 'New Content' } });
      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
        config: { ...mockConfig, content: 'New Content' },
      });
    } else {
        throw new Error('Editable div not found');
    }
  });
});

describe('TextSettings', () => {
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

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', expect.objectContaining({
        config: expect.objectContaining({
            content: expect.stringContaining('Integrity Code')
        })
    }));
  });

  it('changes background color', () => {
    render(<TextSettings widget={mockWidget} />);
    // Find a color button (e.g., the second one)
    const colorButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('rounded-full'));
    // Assuming the second color is #dcfce7 based on the TextWidget.tsx file
    fireEvent.click(colorButtons[1]);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
        config: { ...mockConfig, bgColor: '#dcfce7' }
    });
  });

  it('changes font size', () => {
    render(<TextSettings widget={mockWidget} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '24' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
        config: { ...mockConfig, fontSize: 24 }
    });
  });
});
