
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | undefined;

// This function initializes the Firebase Admin SDK.
// It checks if the service account key is available as an environment variable.
// If it is, it initializes the app with the credential.
// This ensures that server-side Firebase services can be used securely.
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized.'
    );
    // Return a placeholder or handle this case as needed.
    // For now, we are letting it proceed, and checks for adminDb will handle it.
    // @ts-ignore
    return {};
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    // @ts-ignore
    return {};
  }
}

try {
  const adminApp = initializeAdminApp();
  if (adminApp.name) {
    adminDb = getFirestore(adminApp);
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
}

export { adminDb };

    