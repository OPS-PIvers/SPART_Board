import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptDialog } from './PromptDialog';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PromptDialog', () => {
  const onConfirmMock = vi.fn();
  const onCancelMock = vi.fn();

  const defaultProps = {
    title: 'Test Prompt',
    message: 'Please enter a value',
    onConfirm: onConfirmMock,
    onCancel: onCancelMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    render(<PromptDialog {...defaultProps} />);

    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Please enter a value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders with optional props', () => {
    render(
      <PromptDialog
        {...defaultProps}
        placeholder="Enter text here"
        defaultValue="Initial Value"
        confirmLabel="Go"
        cancelLabel="Stop"
      />
    );

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
    expect(textarea).toHaveValue('Initial Value');
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('allows typing in the textarea', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} />);

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });
    await user.type(textarea, 'Test Value');

    expect(textarea).toHaveValue('Test Value');
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} />);

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });
    await user.type(textarea, 'Test Value');

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirmMock).toHaveBeenCalledWith('Test Value');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancelMock).toHaveBeenCalled();
  });

  it('disables confirm button when input is empty', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });
    await user.type(textarea, '   '); // Whitespace only
    expect(confirmButton).toBeDisabled();

    await user.clear(textarea);
    await user.type(textarea, 'Valid');
    expect(confirmButton).not.toBeDisabled();
  });

  it.each([
    ['Cmd+Enter', '{Meta>}{Enter}{/Meta}'],
    ['Ctrl+Enter', '{Control>}{Enter}{/Control}'],
  ])('submits with %s', async (_, keypress) => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} defaultValue="Test Value" />);

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });

    await user.type(textarea, keypress);

    expect(onConfirmMock).toHaveBeenCalledWith('Test Value');
  });
});
