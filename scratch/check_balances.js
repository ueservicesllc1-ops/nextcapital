
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
});

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase credentials in .env.local');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkBalances() {
  console.log('Checking balances...');
  const snap = await db.collection('balances').get();
  if (snap.empty) {
    console.log('No balances found.');
    return;
  }

  snap.forEach(doc => {
    console.log(`User: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log('---');
  });
}

checkBalances().catch(console.error);
