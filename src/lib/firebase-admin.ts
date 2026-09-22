import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebaseProjectConfig.js';

// Outside GCP (Vercel, local dev, etc.) there is no ambient metadata server
// or gcloud login to supply Application Default Credentials, so the Admin
// SDK needs an explicit service account key. Without one, the SDK doesn't
// just fail the current request — its lazy credential resolution throws an
// unhandled rejection on the first Firestore/Auth call and crashes the
// whole process, bypassing any surrounding try/catch. FIREBASE_SERVICE_ACCOUNT_KEY
// (the full JSON key from Firebase Console -> Project Settings -> Service
// Accounts -> Generate new private key, as one env var) avoids that class of
// failure entirely.
const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export const hasFirebaseAdminCredentials = !!serviceAccountKeyJson;

if (!serviceAccountKeyJson) {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firestore/Auth Admin SDK calls will fail — ' +
      'set it to the JSON contents of a Firebase service account key.'
  );
}

const app = !getApps().length
  ? initializeApp(
      serviceAccountKeyJson
        ? { credential: cert(JSON.parse(serviceAccountKeyJson)), projectId: firebaseConfig.projectId }
        : { projectId: firebaseConfig.projectId }
    )
  : getApps()[0];

export const adminAuth = getAuth(app);

const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const adminDb = dbId && dbId !== '(default)'
  ? getFirestore(app, dbId)
  : getFirestore(app);

