
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import * as admin from 'firebase-admin';

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
    FieldValue: {
      serverTimestamp: vi.fn(),
    },
    runTransaction: vi.fn(),
  })),
}));

// Mock firebase-functions/v2
vi.mock('firebase-functions/v2', () => ({
  https: {
    onCall: (options: any, handler: any) => handler,
    HttpsError: class extends Error {
      constructor(code: string, message: string) {
        super(message);
        this.name = code;
      }
    }
  },
}));

// Mock firebase-functions/v1
vi.mock('firebase-functions/v1', () => ({
  runWith: vi.fn().mockReturnThis(),
  https: {
    onCall: vi.fn(),
    HttpsError: class extends Error {}
  },
}));

// Mock axios
vi.mock('axios');

// Import the function under test
// We need to use require or dynamic import because of the mocks
import { triggerJulesWidgetGeneration } from './index';

describe('triggerJulesWidgetGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JULES_API_KEY = 'test-api-key';
  });

  it('should call Jules API with correct endpoint', async () => {
    // Mock Admin Check
    const mockGet = vi.fn().mockResolvedValue({ exists: true });
    (admin.firestore as any).mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      }),
    });

    // Mock Axios response
    (axios.post as any).mockResolvedValue({
      data: {
        name: 'sessions/12345',
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

    expect(axios.post).toHaveBeenCalledWith(
      'https://jules.google.com/api/v1/sessions',
      expect.objectContaining({
        prompt: expect.stringContaining('Test Widget'),
        sourceContext: expect.objectContaining({
          source: 'sources/github/OPS-PIvers/SPART_Board',
        }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Goog-Api-Key': 'test-api-key',
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
