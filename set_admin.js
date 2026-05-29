const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: No se encontró el archivo .env.local en " + envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  });
  return env;
}

const env = loadEnvLocal();

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function setAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Por favor, proporciona un correo electrónico.");
    console.log("Uso: node set_admin.js correo@ejemplo.com");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`Buscando usuario con email: ${normalizedEmail}...`);

  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", normalizedEmail).limit(1).get();

  if (snapshot.empty) {
    console.error("❌ No se encontró ningún usuario con ese correo electrónico.");
    process.exit(1);
  }

  const doc = snapshot.docs[0];
  const userId = doc.id;
  const userData = doc.data();

  console.log(`Usuario encontrado: ${userData.name || 'Sin Nombre'} (UID: ${userId})`);

  // Update role to admin in Firestore
  await doc.ref.update({
    role: "admin",
    updatedAt: new Date().toISOString()
  });

  console.log(`✅ ¡Éxito! El rol del usuario ha sido actualizado a "admin" en la base de datos.`);
}

setAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Ocurrió un error:", err);
    process.exit(1);
  });
