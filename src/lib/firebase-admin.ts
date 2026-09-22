import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebaseProjectConfig.js';

// Outside GCP (Vercel, local dev, etc.) there is no ambient metadata server
// or gcloud login to supply Application Default Credentials, so the Admin
// SDK needs an explicit service account key. Without one, the SDK doesn't
// just fail the current request — its lazy credential resolution throws an
// unhandled rejection or hangs on the first Firestore/Auth call, bypassing
// any surrounding try/catch. FIREBASE_SERVICE_ACCOUNT_KEY (the full JSON key
// from Firebase Console -> Project Settings -> Service Accounts -> Generate
// new private key, as one env var) avoids that class of failure entirely.
const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export const hasFirebaseAdminCredentials = !!serviceAccountKeyJson;

if (!serviceAccountKeyJson) {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firestore/Auth Admin SDK calls will fail — ' +
      'set it to the JSON contents of a Firebase service account key.'
  );
}

// initializeApp/getAuth/getFirestore are constructed lazily (only on first
// actual use inside a route handler) rather than at module scope, so that
// routes which never touch Firestore/Auth — like a plain health check — are
// never blocked by that construction, whatever project/credential state it
// ends up probing.
let cachedApp: App | undefined;
function getFirebaseApp(): App {
  if (cachedApp) return cachedApp;
  cachedApp = !getApps().length
    ? initializeApp(
        serviceAccountKeyJson
          ? { credential: cert(JSON.parse(serviceAccountKeyJson)), projectId: firebaseConfig.projectId }
          : { projectId: firebaseConfig.projectId }
      )
    : getApps()[0];
  return cachedApp;
}

let cachedAuth: Auth | undefined;
export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

let cachedDb: Firestore | undefined;
export function getAdminDb(): Firestore {
  if (!cachedDb) {
    const dbId = firebaseConfig.firestoreDatabaseId;
    cachedDb = dbId && dbId !== '(default)' ? getFirestore(getFirebaseApp(), dbId) : getFirestore(getFirebaseApp());
  }
  return cachedDb;
}
