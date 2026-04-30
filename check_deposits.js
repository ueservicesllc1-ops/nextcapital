const admin = require("firebase-admin");
const env = require("dotenv").config({ path: ".env.local" }).parsed;

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function checkDeposits() {
  const snaps = await db.collection("deposits").orderBy("createdAt", "desc").limit(5).get();
  console.log("LAST 5 DEPOSITS:");
  snaps.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  const balances = await db.collection("balances").limit(5).get();
  console.log("\nBALANCES:");
  balances.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

checkDeposits().then(() => process.exit(0));
