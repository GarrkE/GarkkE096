import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure Firebase is initialized only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedGoogleUser: FirebaseUser | null = null;

export interface GoogleAuthProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have token in memory, we need user interaction to re-acquire access token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCachedGoogleUser = (): FirebaseUser | null => {
  return cachedGoogleUser;
};

export const isGoogleConnected = (): boolean => {
  return Boolean(cachedAccessToken && cachedGoogleUser);
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
};
