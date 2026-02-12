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

  it('submits with Cmd+Enter', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} defaultValue="Test Value" />);

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });

    // userEvent.type handles modifier keys differently than fireEvent
    // {Meta>} holds the key down, {Enter} presses enter, {/Meta} releases
    await user.type(textarea, '{Meta>}{Enter}{/Meta}');

    expect(onConfirmMock).toHaveBeenCalledWith('Test Value');
  });

  it('submits with Ctrl+Enter', async () => {
    const user = userEvent.setup();
    render(<PromptDialog {...defaultProps} defaultValue="Test Value" />);

    const textarea = screen.getByRole('textbox', {
      name: 'Please enter a value',
    });

    // {Control>} holds the key down, {Enter} presses enter, {/Control} releases
    await user.type(textarea, '{Control>}{Enter}{/Control}');

    expect(onConfirmMock).toHaveBeenCalledWith('Test Value');
  });
});
