import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock state so individual tests can wire up Firestore docs and the
// Auth `generatePasswordResetLink` return value per scenario.
const firestoreState: {
  docs: Map<string, { exists: boolean; data?: Record<string, unknown> }>;
  setCalls: Array<{ path: string; data: Record<string, unknown> }>;
} = {
  docs: new Map(),
  setCalls: [],
};

const generatePasswordResetLinkMock = vi.fn();

function makeDocRef(path: string) {
  return {
    get: vi.fn(() => {
      const doc = firestoreState.docs.get(path) ?? { exists: false };
      return Promise.resolve({
        exists: doc.exists,
        data: () => doc.data,
      });
    }),
    set: vi.fn((data: Record<string, unknown>) => {
      firestoreState.setCalls.push({ path, data });
      firestoreState.docs.set(path, { exists: true, data });
      return Promise.resolve();
    }),
    collection: (name: string) => makeCollectionRef(`${path}/${name}`),
  };
}

function makeCollectionRef(path: string) {
  return {
    doc: (id: string) => makeDocRef(`${path}/${id}`),
  };
}

vi.mock('firebase-admin', () => {
  return {
    apps: [{ name: '[DEFAULT]' }],
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
      collection: (name: string) => makeCollectionRef(name),
    })),
    auth: vi.fn(() => ({
      generatePasswordResetLink: generatePasswordResetLinkMock,
    })),
  };
});

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  }
  return {
    onCall: (_options: unknown, handler: unknown) => handler,
    HttpsError,
  };
});

import { resetOrganizationUserPassword } from './organizationResetPassword';

type CallableHandler = (request: {
  auth?: { uid: string; token: { email?: string } };
  data: unknown;
}) => Promise<{ sent: boolean; email: string; resetUrl: string }>;

const handler = resetOrganizationUserPassword as unknown as CallableHandler;

describe('resetOrganizationUserPassword — input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreState.docs.clear();
    firestoreState.setCalls = [];
  });

  it('rejects unauthenticated callers', async () => {
    await expect(
      handler({ data: { orgId: 'orono', email: 'a@b.com' } })
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('rejects callers without an email claim', async () => {
    await expect(
      handler({
        auth: { uid: 'uid1', token: {} },
        data: { orgId: 'orono', email: 'a@b.com' },
      })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects payloads missing orgId', async () => {
    await expect(
      handler({
        auth: { uid: 'uid1', token: { email: 'admin@orono.k12.mn.us' } },
        data: { email: 'a@b.com' },
      })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects payloads missing email', async () => {
    await expect(
      handler({
        auth: { uid: 'uid1', token: { email: 'admin@orono.k12.mn.us' } },
        data: { orgId: 'orono' },
      })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects non-object payloads', async () => {
    await expect(
      handler({
        auth: { uid: 'uid1', token: { email: 'admin@orono.k12.mn.us' } },
        data: 'not-an-object',
      })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});

// Happy-path coverage for the silent-auth-failure fix: the CF must always
// return `resetUrl` so the UI can hand-deliver the link when email queueing
// is disabled. Both branches (sent vs. not-sent) are asserted because the
// whole point of the bug was that the CF dropped the URL on the floor when
// `invite-emails.enabled === false`.
describe('resetOrganizationUserPassword — happy path', () => {
  const adminEmail = 'admin@orono.k12.mn.us';
  const targetEmail = 'teacher@orono.k12.mn.us';
  const orgId = 'orono';
  const resetUrl =
    'https://spartboard.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=fake';

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreState.docs.clear();
    firestoreState.setCalls = [];

    // Both caller and target must exist as members; caller needs an admin role.
    firestoreState.docs.set(`organizations/${orgId}/members/${adminEmail}`, {
      exists: true,
      data: { email: adminEmail, orgId, roleId: 'domain_admin' },
    });
    firestoreState.docs.set(`organizations/${orgId}/members/${targetEmail}`, {
      exists: true,
      data: { email: targetEmail, orgId, roleId: 'teacher' },
    });

    generatePasswordResetLinkMock.mockResolvedValue(resetUrl);
  });

  it('returns resetUrl and queues mail when invite-emails is enabled', async () => {
    firestoreState.docs.set('global_permissions/invite-emails', {
      exists: true,
      data: { enabled: true, from: 'noreply@spartboard.app' },
    });

    const result = await handler({
      auth: { uid: 'uid1', token: { email: adminEmail } },
      data: { orgId, email: targetEmail },
    });

    expect(result).toMatchObject({
      sent: true,
      email: targetEmail,
      resetUrl,
    });
    // Mail doc should have been written under /mail/pwreset-*.
    const mailWrite = firestoreState.setCalls.find((c) =>
      c.path.startsWith('mail/pwreset-')
    );
    expect(mailWrite).toBeDefined();
    expect(mailWrite?.data).toMatchObject({
      to: [targetEmail],
      from: 'noreply@spartboard.app',
    });
  });

  it('returns resetUrl with sent=false when invite-emails is disabled (the silent-failure fix)', async () => {
    firestoreState.docs.set('global_permissions/invite-emails', {
      exists: true,
      data: { enabled: false },
    });

    const result = await handler({
      auth: { uid: 'uid1', token: { email: adminEmail } },
      data: { orgId, email: targetEmail },
    });

    expect(result).toEqual({
      sent: false,
      email: targetEmail,
      resetUrl,
    });
    // No mail doc should have been written.
    const mailWrites = firestoreState.setCalls.filter((c) =>
      c.path.startsWith('mail/')
    );
    expect(mailWrites).toHaveLength(0);
  });

  it('returns resetUrl with sent=false when the global_permissions doc is missing', async () => {
    // Default (no doc) → enabled: false. Same hand-deliver branch.
    const result = await handler({
      auth: { uid: 'uid1', token: { email: adminEmail } },
      data: { orgId, email: targetEmail },
    });

    expect(result).toEqual({
      sent: false,
      email: targetEmail,
      resetUrl,
    });
  });

  it('rejects non-admin callers with permission-denied', async () => {
    firestoreState.docs.set(`organizations/${orgId}/members/${adminEmail}`, {
      exists: true,
      data: { email: adminEmail, orgId, roleId: 'teacher' },
    });

    await expect(
      handler({
        auth: { uid: 'uid1', token: { email: adminEmail } },
        data: { orgId, email: targetEmail },
      })
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('returns failed-precondition when target has no Auth account yet', async () => {
    firestoreState.docs.set('global_permissions/invite-emails', {
      exists: true,
      data: { enabled: true },
    });
    generatePasswordResetLinkMock.mockRejectedValueOnce(
      Object.assign(new Error('user not found'), {
        code: 'auth/user-not-found',
      })
    );

    await expect(
      handler({
        auth: { uid: 'uid1', token: { email: adminEmail } },
        data: { orgId, email: targetEmail },
      })
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });
});
