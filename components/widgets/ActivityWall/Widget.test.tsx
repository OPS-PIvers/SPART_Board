import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityWallWidget } from './Widget';
import { WidgetData } from '@/types';

type MockDriveService = {
  uploadFile: ReturnType<typeof vi.fn>;
  makePublic: ReturnType<typeof vi.fn>;
};

type MockGoogleDriveHookResult = {
  driveService: MockDriveService | null;
  isConnected: boolean;
};

const {
  mockAddWidget,
  mockAddToast,
  mockUpdateWidget,
  mockSetDoc,
  mockUpdateDoc,
  mockOnSnapshot,
  mockCollection,
  mockDoc,
  mockUser,
  mockGetBlob,
  mockDeleteObject,
  mockStorageRef,
  mockDriveService,
  mockUseGoogleDrive,
} = vi.hoisted(() => ({
  mockAddWidget: vi.fn(),
  mockAddToast: vi.fn(),
  mockUpdateWidget: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockUser: { uid: 'teacher-1' },
  mockGetBlob: vi.fn(),
  mockDeleteObject: vi.fn(),
  mockStorageRef: vi.fn((_, path: string) => path),
  mockDriveService: {
    uploadFile: vi.fn(),
    makePublic: vi.fn(),
  } as MockDriveService,
  mockUseGoogleDrive: vi.fn<() => MockGoogleDriveHookResult>(),
}));

let snapshotDocs: Record<string, unknown>[] = [];

vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({
    addWidget: mockAddWidget,
    addToast: mockAddToast,
    updateWidget: mockUpdateWidget,
  }),
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('@/hooks/useGoogleDrive', () => ({
  useGoogleDrive: () => mockUseGoogleDrive(),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  onSnapshot: mockOnSnapshot,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteField: vi.fn(() => '__delete__'),
}));

vi.mock('firebase/storage', () => ({
  deleteObject: mockDeleteObject,
  getBlob: mockGetBlob,
  ref: mockStorageRef,
}));

describe('ActivityWallWidget', () => {
  const baseWidget: WidgetData = {
    id: 'widget-1',
    type: 'activity-wall',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: false,
    config: {
      activeActivityId: 'activity-1',
      activities: [
        {
          id: 'activity-1',
          title: 'Warm Up',
          prompt: 'Share one idea',
          mode: 'text',
          moderationEnabled: true,
          identificationMode: 'anonymous',
          submissions: [],
          startedAt: Date.now(),
        },
      ],
    },
  } as WidgetData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGoogleDrive.mockReturnValue({
      driveService: null,
      isConnected: false,
    });
    snapshotDocs = [];
    mockCollection.mockReturnValue('submissions-ref');
    mockDoc.mockReturnValue('session-doc');
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetBlob.mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' }));
    mockDeleteObject.mockResolvedValue(undefined);
    mockDriveService.uploadFile.mockResolvedValue({ id: 'drive-file-1' });
    mockDriveService.makePublic.mockResolvedValue(undefined);
    mockOnSnapshot.mockImplementation(
      (
        _ref,
        callback: (value: {
          docs: { data: () => Record<string, unknown> }[];
        }) => void
      ) => {
        callback({
          docs: snapshotDocs.map((entry) => ({
            data: () => entry,
          })),
        });
        return vi.fn();
      }
    );
  });

  it('keeps pending live submissions off the wall while showing the pending badge', async () => {
    snapshotDocs = [
      {
        id: 'submission-1',
        content: 'Hidden response',
        submittedAt: 123,
        status: 'pending',
      },
    ];

    render(<ActivityWallWidget widget={baseWidget} />);

    await userEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(await screen.findByText('1 pending')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
    expect(
      screen.getByText(/responses will appear here after participants submit/i)
    ).toBeInTheDocument();
  });

  it('renders approved live submissions in the visible wall content', async () => {
    snapshotDocs = [
      {
        id: 'submission-2',
        content: 'Visible response',
        submittedAt: 456,
        status: 'approved',
      },
    ];

    render(<ActivityWallWidget widget={baseWidget} />);

    await userEvent.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => {
      expect(screen.getByText('visible')).toBeInTheDocument();
      expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
    });
  });

  it('lets photo submissions render using their natural aspect ratio', async () => {
    snapshotDocs = [
      {
        id: 'submission-photo-1',
        content: 'https://example.com/photo.jpg',
        submittedAt: 789,
        status: 'approved',
        participantLabel: 'Student Photo',
      },
    ];

    const photoWidget: WidgetData = {
      ...baseWidget,
      config: {
        activeActivityId: 'activity-photo-1',
        activities: [
          {
            id: 'activity-photo-1',
            title: 'Snapshot',
            prompt: 'Share a photo',
            mode: 'photo',
            moderationEnabled: true,
            identificationMode: 'anonymous',
            submissions: [],
            startedAt: Date.now(),
          },
        ],
      },
    } as WidgetData;

    render(<ActivityWallWidget widget={photoWidget} />);

    await userEvent.click(screen.getByRole('button', { name: 'View' }));

    const image = await screen.findByRole('img', { name: 'Student Photo' });

    expect(image).not.toHaveStyle({ aspectRatio: '4/3' });
    expect(image).toHaveClass('block', 'w-full', 'h-auto');
  });

  it('completes photo archiving even if the Drive image probe never resolves', async () => {
    vi.useFakeTimers();

    mockUseGoogleDrive.mockReturnValue({
      driveService: mockDriveService,
      isConnected: true,
    });

    const originalImage = window.Image;
    class NeverLoadingImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        void _value;
      }
    }
    // @ts-expect-error test stub only implements the pieces this code uses
    window.Image = NeverLoadingImage;
    try {
      snapshotDocs = [
        {
          id: 'submission-photo-sync',
          content: 'https://firebasestorage.example/photo.jpg',
          submittedAt: 111,
          status: 'approved',
          participantLabel: 'Drive Pending',
          storagePath: 'activity_wall_photos/session/submission-photo-sync',
          archiveStatus: 'firebase',
        },
      ];

      const photoWidget: WidgetData = {
        ...baseWidget,
        config: {
          activeActivityId: 'activity-photo-sync',
          activities: [
            {
              id: 'activity-photo-sync',
              title: 'Snapshot',
              prompt: 'Share a photo',
              mode: 'photo',
              moderationEnabled: false,
              identificationMode: 'anonymous',
              submissions: [],
              startedAt: Date.now(),
            },
          ],
        },
      } as WidgetData;

      render(<ActivityWallWidget widget={photoWidget} />);

      await vi.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'session-doc',
        expect.objectContaining({
          content: 'https://lh3.googleusercontent.com/d/drive-file-1',
          archiveStatus: 'archived',
          driveFileId: 'drive-file-1',
        })
      );
    } finally {
      window.Image = originalImage;
      vi.useRealTimers();
    }
  });

  it('falls back to the submission URL when Firebase blob download stalls', async () => {
    vi.useFakeTimers();

    mockUseGoogleDrive.mockReturnValue({
      driveService: mockDriveService,
      isConnected: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob(['fallback-photo'], { type: 'image/png' })),
    });
    const originalFetch = global.fetch;
    const originalImage = window.Image;

    class LoadingImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        this.onload?.();
      }
    }

    global.fetch = fetchMock as typeof fetch;
    // @ts-expect-error test stub only implements the pieces this code uses
    window.Image = LoadingImage;
    mockGetBlob.mockImplementation(() => new Promise<Blob>(() => undefined));

    try {
      snapshotDocs = [
        {
          id: 'submission-photo-fallback',
          content: 'https://firebasestorage.example/photo-token-url',
          submittedAt: 222,
          status: 'approved',
          participantLabel: 'Fallback Photo',
          storagePath: 'activity_wall_photos/session/submission-photo-fallback',
          archiveStatus: 'firebase',
        },
      ];

      const photoWidget: WidgetData = {
        ...baseWidget,
        config: {
          activeActivityId: 'activity-photo-fallback',
          activities: [
            {
              id: 'activity-photo-fallback',
              title: 'Snapshot',
              prompt: 'Share a photo',
              mode: 'photo',
              moderationEnabled: false,
              identificationMode: 'anonymous',
              submissions: [],
              startedAt: Date.now(),
            },
          ],
        },
      } as WidgetData;

      render(<ActivityWallWidget widget={photoWidget} />);

      await vi.advanceTimersByTimeAsync(15000);
      await Promise.resolve();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://firebasestorage.example/photo-token-url'
      );
      expect(mockDriveService.uploadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        'submission-photo-fallback.png',
        'Activity Wall/activity-photo-fallback'
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'session-doc',
        expect.objectContaining({
          archiveStatus: 'archived',
          driveFileId: 'drive-file-1',
        })
      );
    } finally {
      global.fetch = originalFetch;
      window.Image = originalImage;
      vi.useRealTimers();
    }
  });
});
