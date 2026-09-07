import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const projectId = import.meta.env.FIREBASE_PROJECT_ID || '';
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_WEB_API_KEY || '',
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : ''),
  projectId,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : ''),
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const microsoftAuthProvider = new OAuthProvider('microsoft.com');
// ponytail: tenant=common until Siloam hands an Azure AD tenant id
microsoftAuthProvider.setCustomParameters({ prompt: 'select_account', tenant: 'common' });
microsoftAuthProvider.addScope('email');
microsoftAuthProvider.addScope('openid');
microsoftAuthProvider.addScope('profile');
