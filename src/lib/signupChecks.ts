import { supabase } from "@/integrations/supabase/client";

export const MAX_ACCOUNTS_PER_EMAIL = 3;

export const RESERVED_USERNAMES = [
  "admin", "root", "support", "help", "aurelix", "parallax", "official",
  "founder", "staff", "moderator", "system", "api", "about", "settings",
  "login", "signup", "auth", "profile", "home", "explore", "messages",
];

export const normalizeUsername = (raw: string) =>
  raw.toLowerCase().trim().replace(/[^a-z0-9._]/g, "").slice(0, 20);

export const usernameFormatError = (u: string): string | null => {
  if (u.length < 3) return "At least 3 characters";
  if (u.length > 20) return "Maximum 20 characters";
  if (!/^[a-z0-9._]+$/.test(u)) return "Only letters, numbers, . and _";
  if (/^[._]|[._]$/.test(u)) return "Cannot start or end with . or _";
  if (RESERVED_USERNAMES.includes(u)) return "This username is reserved";
  return null;
};

/** Returns true if the username is free to take. */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("usernames")
    .select("id")
    .eq("id", username)
    .maybeSingle();
  if (error) {
    console.error("Username check error:", error);
    return false;
  }
  return !data;
};

/** How many accounts are already linked to this email. */
export const emailAccountCount = async (email: string): Promise<number> => {
  const key = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("count")
    .eq("id", key)
    .maybeSingle();
  if (error || !data) return 0;
  return Number(data.count ?? 0);
};

export const registerEmailAccount = async (email: string, uid: string) => {
  const key = email.toLowerCase().trim();

  // TODO: This read-then-upsert is non-atomic. Under concurrent signups with the
  // same email, two requests may both read count=2 and both write count=3, allowing
  // a 4th account to bypass the MAX_ACCOUNTS_PER_EMAIL limit. Ideally this should
  // use a server-side RPC with: UPDATE email_accounts SET count = count + 1
  // WHERE id = $key AND count < 3 RETURNING count. This is a known limitation
  // until the RPC is deployed.
  const { data: existing } = await supabase
    .from("email_accounts")
    .select("count")
    .eq("id", key)
    .maybeSingle();

  const existingCount = existing ? Number(existing.count ?? 0) : 0;

  await supabase.from("email_accounts").upsert({
    id: key,
    email: key,
    count: existingCount + 1,
    last_uid: uid,
    updated_at: new Date().toISOString(),
  });
};
