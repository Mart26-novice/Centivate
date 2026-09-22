// Public Firebase web config (not a secret — see firebase-applet-config.json,
// the original source of these values, and firebase-admin.ts/firebase.ts for
// why this is a plain TS module rather than a runtime JSON import: a static
// JSON import only reliably resolves where a bundler inlines it, which
// Vercel's per-file Node function builder for api/*.ts does not do).
const firebaseProjectConfig = {
  projectId: 'deductive-plate-q98sv',
  appId: '1:956960380641:web:8f52d30449abe2b49409a0',
  apiKey: 'AIzaSyCMvyyNAKMX8NSl6YEXCLoJmvTDsEhPbK0',
  authDomain: 'deductive-plate-q98sv.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-centivatecomplai-d4774356-59fb-4c53-844c-0c2db37bcdc7',
  storageBucket: 'deductive-plate-q98sv.firebasestorage.app',
  messagingSenderId: '956960380641',
  measurementId: '',
  oAuthClientId: '956960380641-a7jmn07eoogm0hu6lhpec4300brh9r63.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

export default firebaseProjectConfig;
