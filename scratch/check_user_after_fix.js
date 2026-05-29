
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

async function checkUserStats() {
  const userId = 'bhYvpSVhnDQgPktyZEbx5qtBc4D2';
  console.log(`Checking stats for ${userId}...`);
  
  const [balanceSnap, transactionsSnap] = await Promise.all([
    db.collection('balances').doc(userId).get(),
    db.collection('transactions').where('userId', '==', userId).get()
  ]);

  console.log('BALANCE:');
  console.log(JSON.stringify(balanceSnap.data(), null, 2));
  
  console.log('\nTRANSACTIONS:');
  transactionsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`${data.createdAt} | ${data.type} | ${data.amount} | ${data.description}`);
  });
}

checkUserStats().catch(console.error);
