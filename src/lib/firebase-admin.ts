
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | undefined;

function initializeAdminApp(): App | null {
  if (getApps().length > 0) {
    // Return the existing app if it has already been initialized
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized on the server. This is expected for client-side rendering but will fail for server-side logic.'
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.', error);
    return null;
  }
}

const adminApp = initializeAdminApp();

if (adminApp) {
  adminDb = getFirestore(adminApp);
}

export { adminDb };
