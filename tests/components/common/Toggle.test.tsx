import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../../../components/common/Toggle';
import React from 'react';

describe('Toggle Component', () => {
  it('renders correctly', () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const button = screen.getByRole('switch');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('renders correctly when checked', () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} />);
    const button = screen.getByRole('switch');
    fireEvent.click(button);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} disabled />);
    const button = screen.getByRole('switch');
    fireEvent.click(button);
    expect(handleChange).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <Toggle checked={false} onChange={vi.fn()} className="custom-class" />
    );
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('custom-class');
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <Toggle checked={false} onChange={vi.fn()} size="sm" />
    );
    let button = screen.getByRole('switch');
    expect(button).toHaveClass('w-10'); // sm width

    rerender(<Toggle checked={false} onChange={vi.fn()} size="md" />);
    button = screen.getByRole('switch');
    expect(button).toHaveClass('w-12'); // md width

    rerender(<Toggle checked={false} onChange={vi.fn()} size="xs" />);
    button = screen.getByRole('switch');
    expect(button).toHaveClass('w-8'); // xs width
  });
});
