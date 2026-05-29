
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function resetUserProfits() {
  const userId = 'bhYvpSVhnDQgPktyZEbx5qtBc4D2';
  console.log(`Resetting profits for user ${userId}...`);

  // 1. Delete all profit transactions
  const trxSnap = await db.collection('transactions')
    .where('userId', '==', userId)
    .where('type', '==', 'profit')
    .get();

  const batch = db.batch();
  trxSnap.forEach(doc => {
    console.log(`Deleting transaction ${doc.id}`);
    batch.delete(doc.ref);
  });

  // 2. Reset balance document
  // We set totalProfit to 0 and remove lastInterestCredit so the lazy credit logic triggers correctly
  const balanceRef = db.collection('balances').doc(userId);
  batch.update(balanceRef, {
    totalProfit: 0,
    currentBalance: 500, // Reset to base deposit
    lastInterestCredit: admin.firestore.FieldValue.delete(),
    updatedAt: new Date().toISOString()
  });

  await batch.commit();
  console.log('Reset complete. The user should refresh the page to get the correct 1% simple interest credits.');
}

resetUserProfits().catch(console.error);
