import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MagicInput } from './MagicInput';
import { vi, describe, it, expect } from 'vitest';
import * as aiUtils from '../../utils/ai';

// Mock the ai utils
vi.mock('../../utils/ai', () => ({
  generateList: vi.fn(),
}));

describe('MagicInput', () => {
  it('renders button initially', () => {
    render(<MagicInput onGenerate={vi.fn()} />);
    expect(screen.getByText('Magic List')).toBeInTheDocument();
  });

  it('expands on click and generates', async () => {
    const onGenerate = vi.fn();
    // Use type assertion or proper mocking
    vi.mocked(aiUtils.generateList).mockResolvedValue(['Item A', 'Item B']);

    render(<MagicInput onGenerate={onGenerate} />);

    // Click to expand
    fireEvent.click(screen.getByText('Magic List'));

    // Input should appear
    const input = screen.getByPlaceholderText(/e.g./i);
    expect(input).toBeInTheDocument();

    // Type prompt
    fireEvent.change(input, { target: { value: 'Test Prompt' } });

    // Click generate
    const goButton = screen.getByLabelText('Generate List');
    fireEvent.click(goButton);

    // Wait for generation
    await waitFor(() => {
      expect(aiUtils.generateList).toHaveBeenCalledWith(
        'Test Prompt',
        undefined
      );
      expect(onGenerate).toHaveBeenCalledWith(['Item A', 'Item B']);
    });
  });

  it('handles error state', async () => {
    vi.mocked(aiUtils.generateList).mockRejectedValue(new Error('AI Error'));

    render(<MagicInput onGenerate={vi.fn()} />);
    fireEvent.click(screen.getByText('Magic List'));

    const input = screen.getByPlaceholderText(/e.g./i);
    fireEvent.change(input, { target: { value: 'Fail' } });
    fireEvent.click(screen.getByLabelText('Generate List'));

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to generate. Please try again./i)
      ).toBeInTheDocument();
    });
  });
});
