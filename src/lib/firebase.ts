
// Location: src/lib/firebase.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminDb: ReturnType<typeof getFirestore>;

if (!getApps().length) {
  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
      credential: cert(serviceAccount),
    });
    adminDb = getFirestore();
  } else {
    console.warn("[FIREBASE ADMIN] Service account key not found. Firebase Admin SDK not initialized.");
    // Provide a dummy implementation or handle the absence of the DB
    adminDb = {} as ReturnType<typeof getFirestore>; 
  }
} else {
  adminDb = getFirestore();
}

export { adminDb };
