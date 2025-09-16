
import type { ServiceAccount } from 'firebase-admin';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? (JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
      ) as ServiceAccount)
    : undefined;

  if (getApps().length === 0) {
    initializeApp(
      serviceAccountKey
        ? { credential: cert(serviceAccountKey) }
        : undefined
    );
  }
  
  adminDb = getFirestore(getApp());

} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error);
  // The API routes will handle the case where adminDb is not initialized.
}

export { adminDb };
