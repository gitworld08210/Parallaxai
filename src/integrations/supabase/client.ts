import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Supabase project URL and publishable key are public client configuration, not
// privileged secrets. Environment values take precedence; committed fallbacks
// keep Android and preview builds operational when local .env files are absent.
const DEFAULT_SUPABASE_URL = "https://ijkxadnmeqfflfuwvmfz.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_INrZGWBakhnn6gNfN0PgGg_KTGi5lW_";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "aurelix-web",
    },
  },
});
