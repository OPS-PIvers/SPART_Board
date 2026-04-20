/**
 * One-shot teacher backfill script (Phase 4 task A2 of the Organization
 * wiring plan — see docs/organization_wiring_implementation.md).
 *
 * WHAT THIS SCRIPT DOES
 *   Iterates every /users/{uid} doc, resolves each user's email + display name
 *   + selectedBuildings, and upserts /organizations/{orgId}/members/{emailLower}
 *   as a teacher-role member. Intended to hydrate the Users view with the
 *   ~90 active teachers who already exist at /users/{uid} but were never
 *   backfilled into the org's members tree (Phase 1's migration only copied
 *   the 6 /admins/* emails + admin_settings.superAdmins).
 *
 * WHEN TO RUN IT
 *   Once, after Phase 4 ships. The members-sync and counter Cloud Functions
 *   rely on every active teacher having a member doc; without this backfill
 *   the Users view shows only the 6 migrated admins, and the denormalized
 *   `users` counters on the org/buildings/domains docs stay at 0 forever.
 *
 *   It is safe to re-run — every write uses { merge: true } and the upsert
 *   is skipped entirely for members whose current roleId is NOT 'teacher'
 *   (see safety rails below).
 *
 * SAFETY RAILS (read before running)
 *   - Will NOT touch /admins/{email} docs. That's the job of Phase 4's
 *     organizationMembersSync CF (and the CF itself is explicitly forbidden
 *     from modifying pre-existing admin docs that lack its provenance marker).
 *   - Will NOT overwrite an existing member doc whose roleId is already
 *     something other than 'teacher' (super_admin, domain_admin,
 *     building_admin). Those were placed by setup-organization.js and must
 *     not be demoted to teacher just because the user also has a /users/{uid}
 *     record.
 *   - Will NOT modify /users/{uid} docs. Source data is read-only.
 *   - --dry-run means dry run. No writes, just logs of what would happen.
 *
 * Usage:
 *   node scripts/backfill-org-members.js [--dry-run] [--org <orgId>] [--verbose]
 *
 * Flags:
 *   --dry-run   No writes. Log every planned upsert.
 *   --org       Target org id. Defaults to 'orono'.
 *   --verbose   Log every user considered (default: summary only).
 *
 * Credentials resolution (checked in order — same as setup-organization.js):
 *   1. FIREBASE_SERVICE_ACCOUNT env var (JSON) — used by CI
 *   2. scripts/service-account-key.json — used by local dev
 *   3. applicationDefault() via GOOGLE_APPLICATION_CREDENTIALS or
 *      `gcloud auth application-default login`
 */

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ID = 'spartboard';
const BACKFILL_TAG = 'backfill:2026-04-19';

function parseArgs(argv) {
  const args = { dryRun: false, orgId: 'orono', verbose: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '-n') args.dryRun = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--org') args.orgId = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(
    'Usage: node scripts/backfill-org-members.js [--dry-run] [--org <orgId>] [--verbose]'
  );
}

function loadCredentials() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envJson) {
    try {
      return {
        source: 'FIREBASE_SERVICE_ACCOUNT env',
        creds: JSON.parse(envJson),
        useApplicationDefault: false,
      };
    } catch (e) {
      throw new Error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT env var as JSON: ' + e.message
      );
    }
  }
  const keyPath = join(__dirname, 'service-account-key.json');
  try {
    const raw = readFileSync(keyPath, 'utf8');
    return {
      source: 'scripts/service-account-key.json',
      creds: JSON.parse(raw),
      useApplicationDefault: false,
    };
  } catch {
    // Fall through to ADC.
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      source:
        'GOOGLE_APPLICATION_CREDENTIALS=' +
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
      creds: null,
      useApplicationDefault: true,
    };
  }
  // ADC without an explicit file still works if the user has run
  // `gcloud auth application-default login`.
  return {
    source: 'applicationDefault()',
    creds: null,
    useApplicationDefault: true,
  };
}

// Best-effort name derivation: displayName wins, then the local-part of the
// email with underscores/dots replaced by spaces and each word capitalized.
function deriveName(displayName, email) {
  if (typeof displayName === 'string' && displayName.trim()) {
    return displayName.trim();
  }
  if (!email) return '';
  const local = email.split('@')[0] || '';
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Resolve buildingIds from /users/{uid}/userProfile/profile.
// AuthContext.tsx reads this exact path with a field named `selectedBuildings`
// (an array of string building ids). We tolerate a missing doc, missing field,
// or non-array value by returning [] and logging a warn — idempotent backfills
// should not fail over messy source data.
async function resolveBuildingIds(db, uid, verbose) {
  // Canonical location per AuthContext.tsx.
  const primary = await db.doc('users/' + uid + '/userProfile/profile').get();
  if (primary.exists) {
    const data = primary.data() || {};
    if (Array.isArray(data.selectedBuildings)) {
      const clean = data.selectedBuildings.filter(
        (v) => typeof v === 'string' && v.length > 0
      );
      return { buildingIds: clean, found: true };
    }
    if (verbose) {
      console.log(
        '    [warn] users/' +
          uid +
          "/userProfile/profile has no 'selectedBuildings' array; using []."
      );
    }
    return { buildingIds: [], found: true };
  }
  // Fallback: scan the subcollection in case a user has a non-'profile' doc id
  // (older code paths may have used auto-generated ids).
  const sub = await db
    .collection('users/' + uid + '/userProfile')
    .limit(1)
    .get();
  if (!sub.empty) {
    const data = sub.docs[0].data() || {};
    if (Array.isArray(data.selectedBuildings)) {
      const clean = data.selectedBuildings.filter(
        (v) => typeof v === 'string' && v.length > 0
      );
      return { buildingIds: clean, found: true };
    }
  }
  return { buildingIds: [], found: false };
}

async function resolveEmailAndName(db, uid, userDocData, verbose) {
  // Prefer Firebase Auth's record — the /users/{uid} doc may be stale or
  // lack email/displayName entirely.
  let authUser = null;
  try {
    authUser = await getAuth().getUser(uid);
  } catch (err) {
    if (verbose) {
      console.log(
        '    [warn] auth.getUser(' +
          uid +
          ') failed: ' +
          (err && err.message ? err.message : err)
      );
    }
  }
  const authEmail =
    authUser && typeof authUser.email === 'string' ? authUser.email : '';
  const docEmail =
    userDocData && typeof userDocData.email === 'string'
      ? userDocData.email
      : '';
  const email = (authEmail || docEmail || '').trim().toLowerCase();

  const authDisplayName =
    authUser && typeof authUser.displayName === 'string'
      ? authUser.displayName
      : '';
  const docDisplayName =
    userDocData && typeof userDocData.displayName === 'string'
      ? userDocData.displayName
      : '';
  const name = deriveName(authDisplayName || docDisplayName, email);

  return { email, name };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const { source, creds, useApplicationDefault } = loadCredentials();
  console.log('Using credentials from ' + source);

  const initOpts = {
    projectId: (creds && creds.project_id) || PROJECT_ID,
  };
  if (useApplicationDefault) {
    initOpts.credential = applicationDefault();
  } else {
    initOpts.credential = cert(creds);
  }
  initializeApp(initOpts);

  const db = getFirestore();
  const orgId = args.orgId;
  console.log(
    'Target org: ' +
      orgId +
      (args.dryRun ? '  [DRY RUN]' : '') +
      (args.verbose ? '  [verbose]' : '')
  );

  const usersSnap = await db.collection('users').get();
  console.log('Scanning ' + usersSnap.size + ' /users/* docs...');

  const stats = {
    considered: 0,
    skipped_no_email: 0,
    skipped_student_id: 0,
    skipped_existing_admin: 0,
    upserted: 0,
    dry_run: args.dryRun,
  };

  // Batched writes: 400 per commit (stays under Firestore's 500-op limit,
  // matches setup-organization.js's batch size).
  const BATCH_SIZE = 400;
  let batch = args.dryRun ? null : db.batch();
  let pending = 0;

  const flush = async () => {
    if (args.dryRun) return;
    if (pending === 0) return;
    await batch.commit();
    batch = db.batch();
    pending = 0;
  };

  for (const userDoc of usersSnap.docs) {
    stats.considered += 1;
    const uid = userDoc.id;
    const userData = userDoc.data() || {};

    const { email, name } = await resolveEmailAndName(
      db,
      uid,
      userData,
      args.verbose
    );

    if (!email) {
      stats.skipped_no_email += 1;
      console.log('  [skip] uid=' + uid + ' has no resolvable email');
      continue;
    }

    // Skip student-ID-shaped emails (all-digits local part, e.g. 704522@...).
    // Orono teacher emails are firstname.lastname@; numeric locals are student
    // accounts that accidentally landed in /users/{uid} and must not be
    // backfilled as teachers.
    const localPart = email.split('@')[0] || '';
    if (/^\d+$/.test(localPart)) {
      stats.skipped_student_id += 1;
      console.log(
        '  [skip] ' + email + ' uid=' + uid + ' looks like a student ID'
      );
      continue;
    }

    // Check for an existing member doc. If it's NOT a teacher, leave it alone.
    const memberRef = db.doc('organizations/' + orgId + '/members/' + email);
    const memberSnap = await memberRef.get();
    if (memberSnap.exists) {
      const existing = memberSnap.data() || {};
      if (existing.roleId && existing.roleId !== 'teacher') {
        stats.skipped_existing_admin += 1;
        if (args.verbose) {
          console.log(
            '  [keep] ' +
              email +
              ' already has roleId=' +
              existing.roleId +
              ' (not overwriting)'
          );
        }
        continue;
      }
    }

    const { buildingIds } = await resolveBuildingIds(db, uid, args.verbose);

    const payload = {
      email,
      orgId,
      roleId: 'teacher',
      buildingIds,
      status: 'active',
      name,
      uid,
      addedBySource: BACKFILL_TAG,
    };

    if (args.verbose || args.dryRun) {
      console.log(
        '  [upsert] ' +
          email +
          ' uid=' +
          uid +
          ' buildings=' +
          JSON.stringify(buildingIds) +
          ' name="' +
          name +
          '"'
      );
    }

    if (!args.dryRun) {
      batch.set(memberRef, payload, { merge: true });
      pending += 1;
      if (pending >= BATCH_SIZE) {
        await flush();
      }
    }
    stats.upserted += 1;
  }

  await flush();

  console.log('');
  console.log('Summary:');
  console.log('  considered:              ' + stats.considered);
  console.log('  skipped_no_email:        ' + stats.skipped_no_email);
  console.log('  skipped_student_id:      ' + stats.skipped_student_id);
  console.log('  skipped_existing_admin:  ' + stats.skipped_existing_admin);
  console.log('  upserted:                ' + stats.upserted);
  console.log('  dry_run:                 ' + stats.dry_run);

  if (args.dryRun) {
    console.log('');
    console.log('Dry run only -- no writes were committed.');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(
    '\nbackfill-org-members failed: ' + (err && err.message ? err.message : err)
  );
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});
