// Public Firebase web config (not a secret — see firebase-applet-config.json,
// the original source of these values, and firebase-admin.ts/firebase.ts for
// why this is a plain TS module rather than a runtime JSON import: a static
// JSON import only reliably resolves where a bundler inlines it, which
// Vercel's per-file Node function builder for api/*.ts does not do).
const firebaseProjectConfig = {
  projectId: 'centivate-prod',
  appId: '1:881337132646:web:bb7d64dc68cb75a6d5afa7',
  apiKey: 'AIzaSyCcYhr31akpbkBX6U6A74_B_DGmvtyeuiY',
  authDomain: 'centivate-prod.firebaseapp.com',
  firestoreDatabaseId: '(default)',
  storageBucket: 'centivate-prod.firebasestorage.app',
  messagingSenderId: '881337132646',
  measurementId: 'G-7BEFBM8BTF',
};

export default firebaseProjectConfig;
