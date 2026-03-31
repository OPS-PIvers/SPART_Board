import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WidgetLayout } from '@/components/widgets/WidgetLayout/WidgetLayout';

describe('WidgetLayout', () => {
  it('renders content correctly without header or footer', () => {
    render(
      <WidgetLayout content={<div data-testid="test-content">Content</div>} />
    );
    expect(screen.getByTestId('test-content')).toBeInTheDocument();

    // Check that header and footer are not rendered
    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });

  it('renders header, content, and footer', () => {
    render(
      <WidgetLayout
        header={<div data-testid="test-header">Header</div>}
        content={<div data-testid="test-content">Content</div>}
        footer={<div data-testid="test-footer">Footer</div>}
      />
    );

    expect(screen.getByTestId('test-header')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-footer')).toBeInTheDocument();
  });

  it('applies custom padding when provided', () => {
    const { container } = render(
      <WidgetLayout content={<div>Content</div>} padding="p-4" />
    );

    // The main container should have the p-4 class
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('applies custom contentClassName', () => {
    render(
      <WidgetLayout
        content={<div data-testid="test-content">Content</div>}
        contentClassName="custom-content-class"
      />
    );

    const contentWrapper = screen.getByTestId('test-content').parentElement;
    expect(contentWrapper).toHaveClass('custom-content-class');
  });
});
