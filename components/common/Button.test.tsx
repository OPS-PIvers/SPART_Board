import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const icon = <span data-testid="test-icon">icon</span>;
    render(<Button icon={icon}>With Icon</Button>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /with icon/i })
    ).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
  });

  it('shows loading spinner and hides content when isLoading is true', () => {
    const { container } = render(<Button isLoading>Content</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    // Verify spinner is present (SVG with animate-spin class)
    // Using querySelector here is acceptable as there's no accessible role for the spinner currently
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // Verifying "toBeDisabled" is sufficient as standard HTML behavior guarantees no click events.
  // Attempting to userEvent.click a disabled element can cause test errors depending on environment config.
});
