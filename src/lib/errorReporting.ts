import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "@/lib/firebase";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

// Rate limiting: max 10 errors per minute
const ERROR_LIMIT = 10;
const WINDOW_MS = 60_000;
let errorTimestamps: number[] = [];

function shouldReport(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  errorTimestamps = errorTimestamps.filter((t) => now - t < WINDOW_MS);
  if (errorTimestamps.length >= ERROR_LIMIT) {
    return false;
  }
  errorTimestamps.push(now);
  return true;
}

export interface ErrorContext {
  page?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Reports an error to Firestore 'error_logs' collection.
 * Fire-and-forget: silently catches any write failures.
 * Rate-limited to max 10 errors per minute per client.
 */
export function reportError(error: Error, context?: ErrorContext): void {
  if (!shouldReport()) {
    return;
  }

  try {
    const db = getFirestore(app);
    const errorData = {
      message: error.message || String(error),
      stack: error.stack || null,
      user_id: context?.userId || null,
      page: context?.page || window.location.pathname,
      timestamp: serverTimestamp(),
      device: navigator.userAgent,
      app_version: APP_VERSION,
      ...(context?.extra ? { extra: context.extra } : {}),
    };

    addDoc(collection(db, "error_logs"), errorData).catch(() => {});
  } catch {
    // Silently ignore any errors during reporting
  }
}
