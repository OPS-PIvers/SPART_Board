// Regression test: the score-visibility radiogroup must support roving-tabindex arrow-key nav.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PublishScoresModal } from '@/components/common/library/PublishScoresModal';

describe('PublishScoresModal — score visibility radiogroup keyboard nav', () => {
  function renderModal() {
    render(
      <PublishScoresModal
        assignmentTitle="Test Quiz"
        currentVisibility={undefined}
        onClose={() => undefined}
        onConfirm={vi.fn()}
      />
    );
  }

  it('only the checked radio is tab-stoppable (roving tabindex)', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    const checked = radios.find(
      (r) => r.getAttribute('aria-checked') === 'true'
    );
    const unchecked = radios.filter((r) => r !== checked);

    expect(checked).toHaveAttribute('tabIndex', '0');
    unchecked.forEach((r) => expect(r).toHaveAttribute('tabIndex', '-1'));
  });

  it('ArrowRight/ArrowDown moves focus and selection to the next radio', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    radios[0].focus();

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });

    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('ArrowLeft wraps focus and selection to the last radio from the first', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    radios[0].focus();

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });

    expect(radios[radios.length - 1]).toHaveFocus();
    expect(radios[radios.length - 1]).toHaveAttribute('aria-checked', 'true');
  });

  it('End moves focus and selection to the last radio', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    radios[0].focus();

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });

    expect(radios[radios.length - 1]).toHaveFocus();
    expect(radios[radios.length - 1]).toHaveAttribute('aria-checked', 'true');
  });
});
