// scripts/seed-resources.js
// Usage:
//   set GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json  (Windows)
//   node scripts/seed-resources.js

const admin = require('firebase-admin');
const resources = require('../data/workshop-resources.json');

admin.initializeApp();

const db = admin.firestore();

async function seed() {
  console.log(`Seeding ${resources.length} resources...`);
  const batch = db.batch();
  for (const resource of resources) {
    const ref = db.collection('resources').doc();
    batch.set(ref, {
      ...resource,
      lastVerified: admin.firestore.Timestamp.now(),
    });
  }
  await batch.commit();
  console.log('Done. Resources written to Firestore.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
