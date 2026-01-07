/**
 * Script to set up admin users in Firestore
 *
 * This creates documents in the 'admins' collection for each admin email.
 * Run this script once after deploying your Firestore security rules.
 *
 * Usage:
 *   node scripts/setup-admins.js
 *
 * Make sure to:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set up Firebase Admin credentials (see README below)
 * 3. Update ADMIN_EMAILS array with your actual admin emails
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Admin emails to grant admin access
const ADMIN_EMAILS = [
  'paul.ivers@orono.k12.mn.us',
  'bailey.nett@orono.k12.mn.us',
  'jennifer.ivers@orono.k12.mn.us',
  'sean.beaverson@orono.k12.mn.us',
];

async function setupAdmins() {
  try {
    // Try to load credentials from environment variable first (for GitHub Actions/Secrets)
    // then fall back to the service-account-key.json file
    let serviceAccount;
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountPath = join(__dirname, 'service-account-key.json');

    if (serviceAccountEnv) {
      try {
        serviceAccount = JSON.parse(serviceAccountEnv);
        console.log(
          '✅ Using credentials from FIREBASE_SERVICE_ACCOUNT environment variable'
        );
      } catch (error) {
        console.error(
          '❌ Error parsing FIREBASE_SERVICE_ACCOUNT environment variable as JSON'
        );
        process.exit(1);
      }
    } else {
      try {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        console.log(
          '✅ Using credentials from scripts/service-account-key.json'
        );
      } catch (error) {
        console.error('\n❌ Error: Service account credentials not found!');
        console.error('\nTo set up admin credentials, either:');
        console.error(
          '1. Set the FIREBASE_SERVICE_ACCOUNT environment variable with the JSON content'
        );
        console.error('   OR');
        console.error(
          '2. Save your service account key file as scripts/service-account-key.json\n'
        );
        process.exit(1);
      }
    }

    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore();

    console.log('\n🚀 Setting up admin users...\n');

    // Create admin documents
    for (const email of ADMIN_EMAILS) {
      const normalizedEmail = email.toLowerCase();
      await db.collection('admins').doc(normalizedEmail).set({
        email: normalizedEmail,
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ Admin access granted to: ${normalizedEmail}`);
    }

    console.log('\n✨ Admin setup complete!\n');
    console.log('These users now have admin access:');
    ADMIN_EMAILS.forEach((email) => console.log(`  - ${email.toLowerCase()}`));
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up admins:', error);
    process.exit(1);
  }
}

setupAdmins();
