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
  'Jennifer.ivers@orono.k12.mn.us',
  'Sean.beaverson@orono.k12.mn.us'
];

async function setupAdmins() {
  try {
    // Load service account key
    const serviceAccountPath = join(__dirname, 'service-account-key.json');
    let serviceAccount;

    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.error('\n❌ Error: service-account-key.json not found!');
      console.error('\nTo set up admin credentials:');
      console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
      console.error('2. Click "Generate New Private Key"');
      console.error('3. Save the file as scripts/service-account-key.json');
      console.error('4. Run this script again\n');
      process.exit(1);
    }

    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount)
    });

    const db = getFirestore();

    console.log('\n🚀 Setting up admin users...\n');

    // Create admin documents
    for (const email of ADMIN_EMAILS) {
      await db.collection('admins').doc(email).set({
        email: email,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Admin access granted to: ${email}`);
    }

    console.log('\n✨ Admin setup complete!\n');
    console.log('These users now have admin access:');
    ADMIN_EMAILS.forEach(email => console.log(`  - ${email}`));
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up admins:', error);
    process.exit(1);
  }
}

setupAdmins();