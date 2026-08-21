import { supabase } from "@/integrations/supabase/client";

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
 * Reports an error to Supabase 'error_logs' table.
 * Fire-and-forget: silently catches any write failures.
 * Rate-limited to max 10 errors per minute per client.
 */
export function reportError(error: Error, context?: ErrorContext): void {
  if (!shouldReport()) {
    return;
  }

  try {
    supabase.from('error_logs' as any).insert({
      message: error.message || String(error),
      stack: error.stack || null,
      user_id: context?.userId || null,
      page: context?.page || window.location.pathname,
      device: navigator.userAgent,
      app_version: APP_VERSION,
      extra: context?.extra || null,
    } as any).then(() => {}).catch(() => {});
  } catch {
    // Silently ignore any errors during reporting
  }
}
