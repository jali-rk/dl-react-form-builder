import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/types/auth';

const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  googleSignIn: () => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

async function createAppUser(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole,
): Promise<AppUser> {
  const appUser: AppUser = {
    uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), appUser);
  return appUser;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const skipAuthListenerRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (skipAuthListenerRef.current) return;

      setUser(firebaseUser);
      if (firebaseUser) {
        const existing = await fetchAppUser(firebaseUser.uid);
        setAppUser(existing);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AppUser> => {
    skipAuthListenerRef.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const existing = await fetchAppUser(cred.user.uid);
      if (!existing) {
        await firebaseSignOut(auth);
        skipAuthListenerRef.current = false;
        throw new Error('Account not found. Please sign up first.');
      }
      // Only enforce email verification for non-admin users
      if (existing.role !== 'admin' && !cred.user.emailVerified) {
        await firebaseSignOut(auth);
        skipAuthListenerRef.current = false;
        throw new Error('Please verify your email address before logging in. Check your inbox.');
      }
      setUser(cred.user);
      setAppUser(existing);
      setLoading(false);
      skipAuthListenerRef.current = false;
      return existing;
    } catch (err) {
      skipAuthListenerRef.current = false;
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    skipAuthListenerRef.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await Promise.all([
        updateProfile(cred.user, { displayName }),
        createAppUser(cred.user.uid, email, displayName, 'user'),
      ]);
      await sendEmailVerification(cred.user, {
        url: `${globalThis.location.origin}/login`,
        handleCodeInApp: false,
      });
      await firebaseSignOut(auth);
      setUser(null);
      setAppUser(null);
    } finally {
      skipAuthListenerRef.current = false;
    }
  };

  const googleSignIn = async (): Promise<AppUser> => {
    skipAuthListenerRef.current = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // Check if user already exists in Firestore
      let existing = await fetchAppUser(cred.user.uid);
      // New user – auto-create with 'user' role
      existing ??= await createAppUser(
        cred.user.uid,
        cred.user.email ?? '',
        cred.user.displayName ?? 'User',
        'user',
      );
      setUser(cred.user);
      setAppUser(existing);
      setLoading(false);
      skipAuthListenerRef.current = false;
      return existing;
    } catch (err) {
      skipAuthListenerRef.current = false;
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email, {
      url: `${globalThis.location.origin}/login`,
      handleCodeInApp: false,
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAppUser(null);
  };

  const value = useMemo(
    () => ({ user, appUser, loading, signIn, signUp, googleSignIn, resetPassword, signOut }),
    [user, appUser, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
