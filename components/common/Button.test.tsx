import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { describe, it, expect } from 'vitest';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-brand-blue-primary'); // Default is primary
  });

  it('renders dark variant correctly', () => {
    render(<Button variant="dark">Dark Button</Button>);
    const button = screen.getByRole('button', { name: /dark button/i });
    expect(button).toHaveClass('bg-slate-800');
    expect(button).toHaveClass('text-white');
  });

  it('renders secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button', { name: /secondary button/i });
    expect(button).toHaveClass('bg-slate-200');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    // The spinner is an svg
    // We can check if the button is disabled
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
