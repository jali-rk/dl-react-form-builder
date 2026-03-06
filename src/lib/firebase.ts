import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYsSE9LtCi90xpsMivhKmNOaGK4diOmRo",
  authDomain: "form-builder-3a0e5.firebaseapp.com",
  projectId: "form-builder-3a0e5",
  storageBucket: "form-builder-3a0e5.firebasestorage.app",
  messagingSenderId: "572757799022",
  appId: "1:572757799022:web:04a1e7dd84e4515e30f67f",
  measurementId: "G-84NLMZ70GM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
