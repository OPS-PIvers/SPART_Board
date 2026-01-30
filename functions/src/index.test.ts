import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
    onCall: (_options: unknown, handler: unknown) => handler,
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
import { triggerJulesWidgetGeneration } from './index';

describe('triggerJulesWidgetGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JULES_API_KEY = 'test-api-key';
  });

  it('should call Jules API with correct endpoint', async () => {
    // Mock Admin Check
    const mockGet = vi.fn().mockResolvedValue({ exists: true });

    (admin.firestore as unknown as Mock).mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      }),
    });

    // Mock Axios response

    (axios.post as unknown as Mock).mockResolvedValue({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (triggerJulesWidgetGeneration as any)(request);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      'https://jules.googleapis.com/v1alpha/sessions?key=test-api-key',
      expect.objectContaining({
        prompt: expect.stringContaining('Test Widget'),
        sourceContext: expect.objectContaining({
          source: 'sources/github/OPS-PIvers/SPART_Board',
        }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Goog-Api-Key': 'test-api-key',
          Authorization: 'Bearer test-api-key',
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