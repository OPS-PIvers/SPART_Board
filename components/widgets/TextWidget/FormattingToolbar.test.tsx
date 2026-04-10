import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormattingToolbar } from './FormattingToolbar';

// Mock useDialog
const mockShowPrompt = vi.fn();
vi.mock('@/context/useDialog', () => ({
  useDialog: () => ({
    showPrompt: mockShowPrompt,
  }),
}));

describe('FormattingToolbar', () => {
  const mockEditorRef = {
    current: document.createElement('div'),
  } as React.RefObject<HTMLDivElement>;
  const mockVerticalAlignChange = vi.fn();
  let execCommandMock: ReturnType<
    typeof vi.fn<
      (commandId: string, showUI?: boolean, value?: string) => boolean
    >
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.execCommand
    execCommandMock = vi.fn(
      (_commandId: string, _showUI?: boolean, _value?: string) => true
    );
    document.execCommand = execCommandMock;
  });

  it('renders all main formatting buttons', () => {
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Underline')).toBeInTheDocument();
    expect(screen.getByTitle('Align Left')).toBeInTheDocument();
    expect(screen.getByTitle('Align Center')).toBeInTheDocument();
    expect(screen.getByTitle('Align Right')).toBeInTheDocument();
    expect(screen.getByTitle('Bulleted List')).toBeInTheDocument();
    expect(screen.getByTitle('Numbered List')).toBeInTheDocument();
    expect(screen.getByTitle('Decrease Indent')).toBeInTheDocument();
    expect(screen.getByTitle('Increase Indent')).toBeInTheDocument();
    expect(screen.getByTitle('Hyperlink (Ctrl+K)')).toBeInTheDocument();
    expect(screen.getByTitle('Align Top')).toBeInTheDocument();
    expect(screen.getByTitle('Align Middle')).toBeInTheDocument();
    expect(screen.getByTitle('Align Bottom')).toBeInTheDocument();
  });

  it('calls execCommand when bold button is clicked', () => {
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );
    const boldButton = screen.getByTitle('Bold');
    fireEvent.click(boldButton);
    expect(execCommandMock).toHaveBeenCalledWith('bold', false, '');
  });

  it('opens font family menu and selects a font', () => {
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );
    const fontButton = screen.getByTitle('Font Family');
    fireEvent.click(fontButton);
    const lexendFont = screen.getByText('Lexend');
    fireEvent.click(lexendFont);

    expect(execCommandMock).toHaveBeenCalledWith(
      'fontName',
      false,
      'Lexend, sans-serif'
    );
  });

  it('increments font size via stepper button', () => {
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );
    const increaseButton = screen.getByTitle('Increase font size');
    fireEvent.click(increaseButton);

    // The marker-replacement technique calls fontSize with '7' as a marker
    expect(execCommandMock).toHaveBeenCalledWith('fontSize', false, '7');
  });

  it('calls showPrompt when link button is clicked', async () => {
    mockShowPrompt.mockResolvedValue('https://google.com');
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );
    const linkButton = screen.getByTitle('Hyperlink (Ctrl+K)');

    // Use mousedown to prevent default
    fireEvent.mouseDown(linkButton);
    fireEvent.click(linkButton);

    expect(mockShowPrompt).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith(
        'createLink',
        false,
        'https://google.com'
      );
    });
  });

  it('updates vertical alignment from toolbar buttons', () => {
    render(
      <FormattingToolbar
        editorRef={mockEditorRef}
        verticalAlign="top"
        onVerticalAlignChange={mockVerticalAlignChange}
      />
    );

    fireEvent.click(screen.getByTitle('Align Bottom'));

    expect(mockVerticalAlignChange).toHaveBeenCalledWith('bottom');
  });
});
