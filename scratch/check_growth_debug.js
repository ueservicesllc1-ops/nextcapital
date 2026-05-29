
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

async function checkGrowthData() {
  const userId = 'bhYvpSVhnDQgPktyZEbx5qtBc4D2';
  
  const trxSnap = await db.collection('transactions').where('userId', '==', userId).get();
  const depSnap = await db.collection('deposits').where('userId', '==', userId).where('status', '==', 'approved').get();
  
  const events = [
    ...depSnap.docs.map(d => ({ ...d.data(), type: 'deposit' })),
    ...trxSnap.docs.map(t => ({ ...t.data(), type: 'profit' }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  let running = 0;
  const byMonth = new Map();
  
  events.forEach(e => {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (e.type === 'deposit' || e.type === 'profit') {
      running += e.amount;
    }
    byMonth.set(key, running);
  });
  
  console.log('BY MONTH:');
  console.log(JSON.stringify(Array.from(byMonth.entries()), null, 2));
}

checkGrowthData().catch(console.error);
