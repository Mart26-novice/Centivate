import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    })
  : getApps()[0];

export const adminAuth = getAuth(app);

const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const adminDb = dbId && dbId !== '(default)'
  ? getFirestore(app, dbId)
  : getFirestore(app);

