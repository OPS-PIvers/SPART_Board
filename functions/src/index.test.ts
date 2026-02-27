/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Granular mocks for better control in tests
const getMock = vi.fn();
const docMock = vi.fn(() => ({ get: getMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: Object.assign(
    vi.fn(() => ({
      collection: collectionMock,
      runTransaction: vi.fn(),
    })),
    {
      FieldValue: {
        serverTimestamp: vi.fn(),
      },
    }
  ),
}));

// Mock firebase-functions/v2
vi.mock('firebase-functions/v2', () => ({
  https: {
    onCall: (_options: unknown, handler: unknown) => handler,
    HttpsError: class extends Error {
      constructor(code: string, message: string) {
        super(message);
        this.name = code;
      }
    },
  },
}));

// Mock firebase-functions/v1
vi.mock('firebase-functions/v1', () => ({
  runWith: vi.fn().mockReturnThis(),
  https: {
    onCall: vi.fn(),
    HttpsError: class extends Error {},
  },
}));

// Mock axios
vi.mock('axios');

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the function under test
import {
  triggerJulesWidgetGeneration,
  JULES_API_SESSIONS_ENDPOINT,
} from './index';

// Mock google-auth-library
vi.mock('google-auth-library', () => {
  return {
    GoogleAuth: class {
      getClient = vi.fn().mockResolvedValue({
        getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      });
    },
  };
});

describe('triggerJulesWidgetGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JULES_API_KEY = 'test-api-key';
  });

  it('should call Jules API with correct endpoint', async () => {
    // Mock Admin Check using the granular mock
    getMock.mockResolvedValue({ exists: true }); // Admin check passes

    // Mock Axios response using vi.mocked for type safety
    // Use proper casting to unknown then to specific type to avoid linter errors
    const mockPost = vi.mocked(axios.post);
    mockPost.mockResolvedValue({
      data: {
        name: 'sessions/12345',
        id: '12345',
      },
    });

    const request = {
      auth: {
        token: { email: 'admin@example.com' },
        uid: 'test-uid',
      },
      data: {
        widgetName: 'Test Widget',
        description: 'Test Description',
      },
    };

    // Verify type casting if needed, but since we mocked onCall to return the handler, it is the handler.
    const result = await (triggerJulesWidgetGeneration as any)(request);

    // Verify axios call arguments
    expect(mockPost).toHaveBeenCalledWith(
      JULES_API_SESSIONS_ENDPOINT,
      expect.objectContaining({
        prompt: expect.stringContaining('Test Widget'),
        sourceContext: expect.objectContaining({
          source: 'sources/github.com/OPS-PIvers/SPART_Board',
        }),
        automationMode: 'AUTO_CREATE_PR',
        title: 'Generate Widget: Test Widget',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(result).toEqual({
      success: true,
      message: expect.stringContaining('12345'),
      consoleUrl: 'https://jules.google.com/session/12345',
    });
  });
});
