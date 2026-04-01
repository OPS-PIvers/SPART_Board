import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityWallWidget } from './Widget';
import { WidgetData } from '@/types';

const {
  mockAddWidget,
  mockAddToast,
  mockSetDoc,
  mockOnSnapshot,
  mockCollection,
  mockDoc,
  mockUser,
} = vi.hoisted(() => ({
  mockAddWidget: vi.fn(),
  mockAddToast: vi.fn(),
  mockSetDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockUser: { uid: 'teacher-1' },
}));

let snapshotDocs: Record<string, unknown>[] = [];

vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({
    addWidget: mockAddWidget,
    addToast: mockAddToast,
  }),
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('@/hooks/useGoogleDrive', () => ({
  useGoogleDrive: () => ({
    driveService: null,
    isConnected: false,
  }),
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
  updateDoc: vi.fn(),
  deleteField: vi.fn(() => '__delete__'),
}));

vi.mock('firebase/storage', () => ({
  deleteObject: vi.fn(),
  getBlob: vi.fn(),
  ref: vi.fn(),
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
    snapshotDocs = [];
    mockCollection.mockReturnValue('submissions-ref');
    mockDoc.mockReturnValue('session-doc');
    mockSetDoc.mockResolvedValue(undefined);
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

    await waitFor(() => {
      expect(screen.getByText('visible')).toBeInTheDocument();
      expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
    });
  });
});
