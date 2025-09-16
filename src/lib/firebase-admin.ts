
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | undefined;

function initializeAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized on the server. This is expected for client-side rendering but will fail for server-side logic.'
    );
    return null;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (e) {
    try {
      const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decodedKey);
    } catch (e2) {
      console.error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string or a base64 encoded JSON string.'
      );
      return null;
    }
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    return null;
  }
}

const adminApp = initializeAdminApp();

if (adminApp) {
  adminDb = getFirestore(adminApp);
}

export { adminDb };
