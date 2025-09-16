import type { ServiceAccount } from 'firebase-admin';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? (JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    ) as ServiceAccount)
  : undefined;

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        serviceAccountKey
          ? { credential: cert(serviceAccountKey) }
          : undefined
      );

const adminDb = getFirestore(app);

export { adminDb };
