
// Location: src/lib/firebase.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminDb: ReturnType<typeof getFirestore>;

if (getApps().length === 0) {
  // Only initialize if the service account key is present
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
      adminDb = getFirestore();
      console.log('[FIREBASE ADMIN] Firebase Admin SDK initialized successfully.');
    } catch (e) {
      console.error('[FIREBASE ADMIN] Error parsing service account key or initializing app:', e);
      // Provide a dummy implementation to avoid crashes
      adminDb = {} as ReturnType<typeof getFirestore>;
    }
  } else {
    console.warn("[FIREBASE ADMIN] Service account key not found. Firebase Admin SDK not initialized.");
    // Provide a dummy implementation if the key is not present
    adminDb = {} as ReturnType<typeof getFirestore>;
  }
} else {
  // If apps are already initialized, get the existing instance
  adminDb = getFirestore();
}

export { adminDb };
