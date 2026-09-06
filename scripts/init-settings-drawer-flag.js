// Writes/updates/deletes the global_permissions/settings-drawer doc.
// Usage: node scripts/init-settings-drawer-flag.js [--disable] [--delete]
const admin = require('firebase-admin');
const serviceAccount = require('../.temp-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const FEATURE_ID = 'settings-drawer';

async function run() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  const shouldDisable = args.includes('--disable');

  const docRef = db.collection('global_permissions').doc(FEATURE_ID);

  if (shouldDelete) {
    await docRef.delete();
    console.log(`🗑️  Deleted global_permissions/${FEATURE_ID}`);
    process.exit(0);
    return;
  }

  await docRef.set({
    featureId: FEATURE_ID,
    accessLevel: 'admin',
    enabled: !shouldDisable,
    betaUsers: [],
  });
  console.log(
    `✅ global_permissions/${FEATURE_ID} set (enabled: ${!shouldDisable})`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Failed to update settings-drawer flag:', err);
  process.exit(1);
});
