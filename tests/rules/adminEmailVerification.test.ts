// Regression for isAdmin(): the /admins/{email} lookup keys off
// request.auth.token.email, a self-reported claim on this project's Auth
// (email/password sign-in is also supported — see aiGeneration.ts's
// isExternalCaller / resolveOrgForUser.ts). Without an email_verified check,
// anyone who registers an unverified account using a real admin's address
// inherits full site-admin rules access — no admin_settings write, this
// collection's own audit log, or ownership of that address required.
//
// Requires a running Firestore emulator — invoke via `pnpm run test:rules`.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, getDoc, doc } from 'firebase/firestore';

const PROJECT_ID = 'spartboard-admin-email-verification';
const ADMIN_EMAIL = 'real-admin@orono.k12.mn.us';

const RULES_PATH = fileURLToPath(
  new URL('../../firestore.rules', import.meta.url)
);

let testEnv: RulesTestEnvironment;

// Same uid space an attacker could occupy: any self-registered account can
// claim ADMIN_EMAIL as its token email — only email_verified is out of their
// control (Google sign-in verifies it; email/password sign-in does not).
const asUnverifiedImpostor = () =>
  testEnv
    .authenticatedContext('impostor-uid', {
      email: ADMIN_EMAIL,
      email_verified: false,
    })
    .firestore();
const asOmittedVerificationImpostor = () =>
  testEnv
    .authenticatedContext('impostor-uid-2', { email: ADMIN_EMAIL })
    .firestore();
const asVerifiedAdmin = () =>
  testEnv
    .authenticatedContext('real-admin-uid', {
      email: ADMIN_EMAIL,
      email_verified: true,
    })
    .firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] ?? '127.0.0.1',
      port: Number(
        process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] ?? '8080'
      ),
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    // The real admin's /admins/{email} doc — present regardless of who is
    // currently holding a token claiming that email address.
    await setDoc(doc(ctx.firestore(), `admins/${ADMIN_EMAIL}`), {
      addedAt: 1,
    });
  });
});

describe('isAdmin() requires a verified email claim', () => {
  it('denies an unverified caller self-reporting a real admin email (admin_settings write)', async () => {
    await assertFails(
      setDoc(doc(asUnverifiedImpostor(), 'admin_settings/feature-flags'), {
        enabled: true,
      })
    );
  });

  it('denies an unverified caller self-reporting a real admin email (admin_settings read)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admin_settings/feature-flags'), {
        enabled: true,
      });
    });
    await assertFails(
      getDoc(doc(asUnverifiedImpostor(), 'admin_settings/feature-flags'))
    );
  });

  it('denies a caller with no email_verified claim at all (defaults unverified)', async () => {
    await assertFails(
      setDoc(
        doc(asOmittedVerificationImpostor(), 'admin_settings/feature-flags'),
        { enabled: true }
      )
    );
  });

  it('allows the real admin once their token carries email_verified: true', async () => {
    await assertSucceeds(
      setDoc(doc(asVerifiedAdmin(), 'admin_settings/feature-flags'), {
        enabled: true,
      })
    );
  });
});
