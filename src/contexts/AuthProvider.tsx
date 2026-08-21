import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  verified: boolean;
  verification_kind: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  onboarded_at?: string | null;
  interests?: string[] | null;
  account_type?: "personal" | "organization";
  organization_id?: string | null;
  is_creator?: boolean;
  is_admin?: boolean;
  is_founder?: boolean;
  role?: string | null;
  department?: string | null;
};

type Session = {
  access_token: string;
  refresh_token: string;
  user: any;
};

type User = {
  id: string;
  uid: string;
  email?: string;
  phone?: string;
  user_metadata: any;
  app_metadata: any;
  aud: string;
  created_at: string;
  last_sign_in_at?: string;
};

type Ctx = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signupWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

const buildFallbackProfile = (supaUser: {
  id: string;
  email?: string | null;
  user_metadata?: any;
}): Profile => ({
  id: supaUser.id,
  user_id: supaUser.id,
  username: supaUser.email?.split("@")[0] || supaUser.id.slice(0, 8),
  display_name: supaUser.user_metadata?.display_name || supaUser.email?.split("@")[0] || "User",
  avatar_url: supaUser.user_metadata?.avatar_url || null,
  cover_url: null,
  bio: null,
  onboarded_at: new Date().toISOString(),
  verified: false,
  verification_kind: null,
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.uid)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          username: data.username,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          cover_url: data.cover_url,
          bio: data.bio,
          verified: data.verified,
          verification_kind: data.verification_kind,
          followers_count: data.followers_count,
          following_count: data.following_count,
          posts_count: data.posts_count,
          onboarded_at: data.onboarded_at,
          interests: data.interests,
          account_type: data.account_type,
          organization_id: data.organization_id,
          is_creator: data.is_creator,
          is_admin: data.is_admin,
          is_founder: data.is_founder,
          role: data.role,
          department: data.department,
        });
      }
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  }, [user]);

  // Create profile in Supabase if it doesn't exist
  const createProfileInSupabase = useCallback(async (userId: string, email: string, displayName: string | null, photoURL: string | null) => {
    try {
      const username = email?.split('@')[0] || userId.slice(0, 8);

      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing profile:", fetchError);
        return;
      }

      if (!existingProfile) {
        const { error } = await supabase.from("profiles").insert({
          user_id: userId,
          username: username,
          display_name: displayName || username,
          avatar_url: photoURL,
          onboarded_at: new Date().toISOString(),
          verified: false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
        });

        if (error) {
          console.error("Error creating profile in Supabase:", error);
        }
      }
    } catch (err) {
      console.error("createProfileInSupabase failed:", err);
    }
  }, []);

  const signupWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const supaUser = data.user;
      if (supaUser) {
        await createProfileInSupabase(
          supaUser.id,
          supaUser.email || "",
          supaUser.user_metadata?.display_name || null,
          supaUser.user_metadata?.avatar_url || null
        );
      }

      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const supaUser = data.user;
      if (supaUser) {
        await createProfileInSupabase(
          supaUser.id,
          supaUser.email || "",
          supaUser.user_metadata?.display_name || null,
          supaUser.user_metadata?.avatar_url || null
        );
      }

      return data;
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          const supaUser = currentSession.user;
          currentUserIdRef.current = supaUser.id;

          const appUser: User = {
            id: supaUser.id,
            uid: supaUser.id,
            email: supaUser.email || undefined,
            phone: supaUser.phone || undefined,
            user_metadata: supaUser.user_metadata || {},
            app_metadata: supaUser.app_metadata || {},
            aud: supaUser.aud || "authenticated",
            created_at: supaUser.created_at || new Date().toISOString(),
            last_sign_in_at: supaUser.last_sign_in_at || new Date().toISOString(),
          };

          setUser(appUser);
          setProfile(buildFallbackProfile(supaUser));
          setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            user: supaUser,
          });

          // Hydrate profile from DB
          void (async () => {
            await createProfileInSupabase(
              supaUser.id,
              supaUser.email || "",
              supaUser.user_metadata?.display_name || null,
              supaUser.user_metadata?.avatar_url || null
            );

            try {
              const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", supaUser.id)
                .maybeSingle();

              if (error) throw error;
              if (!data || currentUserIdRef.current !== supaUser.id) return;

              setProfile({
                id: data.id,
                user_id: data.user_id,
                username: data.username,
                display_name: data.display_name,
                avatar_url: data.avatar_url,
                cover_url: data.cover_url,
                bio: data.bio,
                verified: data.verified,
                verification_kind: data.verification_kind,
                followers_count: data.followers_count,
                following_count: data.following_count,
                posts_count: data.posts_count,
                onboarded_at: data.onboarded_at,
                interests: data.interests,
                account_type: data.account_type,
                organization_id: data.organization_id,
                is_creator: data.is_creator,
                is_admin: data.is_admin,
                is_founder: data.is_founder,
                role: data.role,
                department: data.department,
              });
            } catch (profileError) {
              console.error("Supabase profile hydration failed:", profileError);
            }
          })();
        }
      } catch (err) {
        console.error("Session initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!currentSession) {
          currentUserIdRef.current = null;
          setUser(null);
          setProfile(null);
          setSession(null);
          setLoading(false);
          return;
        }

        const supaUser = currentSession.user;
        currentUserIdRef.current = supaUser.id;

        const appUser: User = {
          id: supaUser.id,
          uid: supaUser.id,
          email: supaUser.email || undefined,
          phone: supaUser.phone || undefined,
          user_metadata: supaUser.user_metadata || {},
          app_metadata: supaUser.app_metadata || {},
          aud: supaUser.aud || "authenticated",
          created_at: supaUser.created_at || new Date().toISOString(),
          last_sign_in_at: supaUser.last_sign_in_at || new Date().toISOString(),
        };

        setUser(appUser);
        setProfile(buildFallbackProfile(supaUser));
        setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
          user: supaUser,
        });
        setLoading(false);

        // Hydrate profile from the database
        void (async () => {
          await createProfileInSupabase(
            supaUser.id,
            supaUser.email || "",
            supaUser.user_metadata?.display_name || null,
            supaUser.user_metadata?.avatar_url || null
          );

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", supaUser.id)
              .maybeSingle();

            if (error) throw error;
            if (!data || currentUserIdRef.current !== supaUser.id) return;

            setProfile({
              id: data.id,
              user_id: data.user_id,
              username: data.username,
              display_name: data.display_name,
              avatar_url: data.avatar_url,
              cover_url: data.cover_url,
              bio: data.bio,
              verified: data.verified,
              verification_kind: data.verification_kind,
              followers_count: data.followers_count,
              following_count: data.following_count,
              posts_count: data.posts_count,
              onboarded_at: data.onboarded_at,
              interests: data.interests,
              account_type: data.account_type,
              organization_id: data.organization_id,
              is_creator: data.is_creator,
              is_admin: data.is_admin,
              is_founder: data.is_founder,
              role: data.role,
              department: data.department,
            });
          } catch (profileError) {
            console.error("Supabase profile hydration failed:", profileError);
          }
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [createProfileInSupabase]);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCtx.Provider value={{
      user,
      profile,
      session,
      loading,
      signOut,
      refreshProfile,
      signupWithEmailAndPassword,
      signInWithEmail,
    }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
