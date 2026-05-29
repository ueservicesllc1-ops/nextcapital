
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

async function checkDeposits() {
  const userId = 'bhYvpSVhnDQgPktyZEbx5qtBc4D2';
  console.log(`Checking deposits for ${userId}...`);
  const snap = await db.collection('deposits')
    .where('userId', '==', userId)
    .where('status', '==', 'approved')
    .orderBy('createdAt', 'asc')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('No approved deposits found.');
    return;
  }

  snap.forEach(doc => {
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

checkDeposits().catch(console.error);
