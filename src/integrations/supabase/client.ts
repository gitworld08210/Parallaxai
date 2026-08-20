import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─── Supabase client initialization ──────────────────────────────────────────
// If credentials are missing, create a client that will throw descriptive errors
// when queries are attempted rather than failing silently with placeholder URLs.

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
  console.error("Supabase is REQUIRED for this app. Create a free project at https://supabase.com and update .env");
}

// Create a custom client wrapper that provides better error messages
const createSupabaseClient = () => {
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set in environment variables");
  }
  if (!supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) is not set in environment variables");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
