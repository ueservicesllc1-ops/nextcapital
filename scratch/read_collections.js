const admin = require("firebase-admin");
const fs = require("fs");

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function run() {
  const collections = await db.listCollections();
  console.log("COLLECTIONS IN FIRESTORE:");
  for (const coll of collections) {
    console.log(" - Collection ID:", coll.id);
    if (["settings", "config", "keys", "stripe", "credentials", "payment"].includes(coll.id)) {
      const snap = await coll.limit(5).get();
      snap.forEach(doc => {
        console.log(`   * Document [${doc.id}]:`, doc.data());
      });
    }
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
