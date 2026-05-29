
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

async function fixUserDuplicates() {
  const userId = 'bhYvpSVhnDQgPktyZEbx5qtBc4D2';
  console.log(`Fixing duplicates for user ${userId}...`);

  const trxSnap = await db.collection('transactions')
    .where('userId', '==', userId)
    .where('type', '==', 'profit')
    .get();

  const seenDates = new Set();
  const batch = db.batch();
  let totalDeleted = 0;

  // We want to keep only one per day. 
  // However, since they have the exact same createdAt in my previous output, I'll just keep the first one I find for each unique date string.
  trxSnap.docs.forEach(doc => {
    const data = doc.data();
    const date = data.createdAt;
    if (seenDates.has(date)) {
      console.log(`Deleting duplicate transaction ${doc.id} for date ${date}`);
      batch.delete(doc.ref);
      totalDeleted++;
    } else {
      seenDates.add(date);
    }
  });

  if (totalDeleted > 0) {
    const balanceRef = db.collection('balances').doc(userId);
    const balanceSnap = await balanceRef.get();
    const balanceData = balanceSnap.data();
    
    const newProfit = balanceData.totalProfit - (totalDeleted * 5);
    const newBalance = balanceData.currentBalance - (totalDeleted * 5);

    batch.update(balanceRef, {
      totalProfit: newProfit,
      currentBalance: newBalance,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
    console.log(`Deleted ${totalDeleted} duplicates. New balance: ${newBalance}`);
  } else {
    console.log('No duplicates found.');
  }
}

fixUserDuplicates().catch(console.error);
