import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

const hasCredentials = Boolean(projectId && clientEmail && privateKey);

if (!getApps().length && hasCredentials) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
}

export const adminAuth = hasCredentials ? getAuth() : null;
export const adminDb = hasCredentials ? getFirestore() : null;

export function assertAdminSdk() {
  if (!adminAuth || !adminDb) {
    throw new Error(
      "Firebase Admin SDK no configurado. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY."
    );
  }
}
