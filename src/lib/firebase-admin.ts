import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
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

// firebase-admin's app/auth/firestore submodules (and their transitive deps
// - jwks-rsa, google-auth-library, gRPC, ...) are imported dynamically,
// inside these functions, rather than statically at the top of the file.
// A route that never calls getAdminAuth()/getAdminDb() - a plain health
// check, for instance - should never pay for loading that dependency chain
// or whatever it does on load, only for actually using it.
let cachedApp: App | undefined;
async function getFirebaseApp(): Promise<App> {
  if (cachedApp) return cachedApp;
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
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
export async function getAdminAuth(): Promise<Auth> {
  if (!cachedAuth) {
    const { getAuth } = await import('firebase-admin/auth');
    cachedAuth = getAuth(await getFirebaseApp());
  }
  return cachedAuth;
}

let cachedDb: Firestore | undefined;
export async function getAdminDb(): Promise<Firestore> {
  if (!cachedDb) {
    const { getFirestore } = await import('firebase-admin/firestore');
    const app = await getFirebaseApp();
    const dbId = firebaseConfig.firestoreDatabaseId;
    cachedDb = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
  }
  return cachedDb;
}
