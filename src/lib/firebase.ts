import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const missingKeys = requiredKeys.filter((key) => !import.meta.env[key]);
if (missingKeys.length > 0) {
  throw new Error(
    `[Firebase] Missing required environment variables: ${missingKeys.join(", ")}. ` +
    `Create a .env file based on .env.example and provide all Firebase configuration values.`
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Keep this for legacy compatibility, but don't use for new features
export const db = null;
export const storage = null;

export const googleProvider = new GoogleAuthProvider();

export default app;
