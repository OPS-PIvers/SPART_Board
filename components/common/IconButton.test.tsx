import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IconButton } from './IconButton';
import React from 'react';

describe('IconButton', () => {
  it('renders with icon and aria-label', () => {
    render(<IconButton icon={<span>Icon</span>} label="Test Button" />);
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button.innerHTML).toContain('<span>Icon</span>');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={<span>Icon</span>}
        label="Test Button"
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes', () => {
    render(
      <IconButton
        icon={<span>Icon</span>}
        label="Test Button"
        variant="danger"
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-red-500');
  });

  it('applies active classes', () => {
    render(
      <IconButton
        icon={<span>Icon</span>}
        label="Test Button"
        variant="ghost"
        active
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-slate-100');
  });

  it('handles disabled state', () => {
    render(
      <IconButton icon={<span>Icon</span>} label="Test Button" disabled />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:opacity-50');
  });
});
