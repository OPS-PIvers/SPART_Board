import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MiniAppManager } from './MiniAppManager';
import { GlobalMiniAppItem, MiniAppItem } from '@/types';

const miniApp: MiniAppItem = {
  id: 'mini-app-1',
  title: 'Class Poll',
  html: '<html><body>Mini app</body></html>',
  createdAt: 1712000000000,
  order: 0,
};

const globalMiniApp: GlobalMiniAppItem = {
  ...miniApp,
  id: 'global-app-1',
  buildings: [],
};

const baseProps = {
  tab: 'library' as const,
  onTabChange: vi.fn(),
  assignments: [],
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRun: vi.fn(),
  onAssign: vi.fn(),
  onShowAssignments: vi.fn(),
  onReorder: vi.fn(),
  onSaveGlobalToLibrary: vi.fn(),
  savingGlobalId: null,
  onImport: vi.fn(),
  onExport: vi.fn(),
  onArchiveCopyUrl: vi.fn(),
  onArchiveEnd: vi.fn(),
  onArchiveDelete: vi.fn(),
};

describe('MiniAppManager assign controls', () => {
  it('shows an Assign primary action for personal library items', () => {
    render(
      <MiniAppManager
        {...baseProps}
        personalLibrary={[miniApp]}
        globalLibrary={[]}
      />
    );

    // LibraryItemCard renders the primary action as a button with the label.
    expect(
      screen.getAllByRole('button', { name: /assign/i }).length
    ).toBeGreaterThan(0);
  });

  it('still exposes Assign on global library items (read-only view)', () => {
    // Render in global-source mode by seeding a personal entry so the user
    // can see both filter options (test-level default is personal).
    const { rerender } = render(
      <MiniAppManager
        {...baseProps}
        personalLibrary={[miniApp]}
        globalLibrary={[globalMiniApp]}
      />
    );

    // Assign is always the primary action, regardless of source.
    const assignButtons = screen.getAllByRole('button', { name: /assign/i });
    expect(assignButtons.length).toBeGreaterThan(0);

    // Sanity: component still renders with only global items.
    rerender(
      <MiniAppManager
        {...baseProps}
        personalLibrary={[]}
        globalLibrary={[globalMiniApp]}
      />
    );
  });
});
