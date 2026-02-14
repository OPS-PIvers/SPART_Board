import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dock } from '../../../components/layout/Dock';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { useLiveSession } from '../../../hooks/useLiveSession';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';

// Mock contexts
vi.mock('../../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useLiveSession', () => ({
  useLiveSession: vi.fn(),
}));

// Mock hooks
vi.mock('../../../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    processAndUploadImage: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

describe('Dock Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: 'teacher-1' },
      canAccessWidget: () => true,
      canAccessFeature: () => true,
      featurePermissions: [],
    });

    (useLiveSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      session: null,
    });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      removeWidgets: vi.fn(),
      visibleTools: [],
      dockItems: [], // Empty dock items for basic render
      reorderDockItems: vi.fn(),
      activeDashboard: {
        id: 'db-1',
        globalStyle: DEFAULT_GLOBAL_STYLE,
        widgets: [],
        settings: {
          quickAccessWidgets: [],
        },
      },
      updateWidget: vi.fn(),
      toggleToolVisibility: vi.fn(),
      addFolder: vi.fn(),
      renameFolder: vi.fn(),
      deleteFolder: vi.fn(),
      addItemToFolder: vi.fn(),
      moveItemOutOfFolder: vi.fn(),
      reorderFolderItems: vi.fn(),
      addToast: vi.fn(),
    });
  });

  it('renders the dock container', () => {
    render(<Dock />);
    expect(screen.getByTestId('dock')).toBeInTheDocument();
  });

  it('renders quick access buttons in collapsed mode', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addWidget: vi.fn(),
      canAccessFeature: () => true,
      activeDashboard: {
        id: 'db-1',
        globalStyle: DEFAULT_GLOBAL_STYLE,
        widgets: [],
        settings: {
          quickAccessWidgets: ['timer'],
        },
      },
      addToast: vi.fn(),
      dockItems: [],
    });

    render(<Dock />);
    // Since we are not expanding it, we expect the collapsed view
    expect(screen.getByTitle('Open Tools')).toBeInTheDocument();
  });
});
