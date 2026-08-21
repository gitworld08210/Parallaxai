import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignIn,
} from "firebase/auth";
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

// Token refresh interval (50 minutes — Firebase tokens expire at 60 min)
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

const buildFallbackProfile = (fbUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Profile => ({
  id: fbUser.uid,
  user_id: fbUser.uid,
  username: fbUser.email?.split("@")[0] || fbUser.uid.slice(0, 8),
  display_name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
  avatar_url: fbUser.photoURL,
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
  const tokenRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ─── FIX: Renamed to avoid shadowing Firebase import ───────────────────────
  const signupWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { user: fbUser } = result;

      await createProfileInSupabase(
        fbUser.uid,
        fbUser.email || "",
        fbUser.displayName,
        fbUser.photoURL
      );

      return result;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // ─── FIX: Previously called `signInWithEmailAndPassword` which shadowed the
  //     Firebase import and caused infinite recursion (stack overflow on login).
  //     Renamed local method to `signInWithEmail` and uses `firebaseSignIn` alias.
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await firebaseSignIn(auth, email, password);
      const { user: fbUser } = result;

      await createProfileInSupabase(
        fbUser.uid,
        fbUser.email || "",
        fbUser.displayName,
        fbUser.photoURL
      );

      return result;
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  };

  // ─── Token refresh: keep Firebase token fresh ─────────────────────────────
  const startTokenRefresh = useCallback(() => {
    if (tokenRefreshTimer.current) {
      clearInterval(tokenRefreshTimer.current);
    }
    tokenRefreshTimer.current = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const newToken = await currentUser.getIdToken(true);
          setSession((prev) => prev ? { ...prev, access_token: newToken } : null);
        } catch (err) {
          console.error("Token refresh failed:", err);
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, []);

  const stopTokenRefresh = useCallback(() => {
    if (tokenRefreshTimer.current) {
      clearInterval(tokenRefreshTimer.current);
      tokenRefreshTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (!fbUser) {
          setUser(null);
          setProfile(null);
          setSession(null);
          stopTokenRefresh();
          setLoading(false);
          return;
        }

        const appUser: User = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || undefined,
          phone: fbUser.phoneNumber || undefined,
          user_metadata: {
            display_name: fbUser.displayName,
            avatar_url: fbUser.photoURL,
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: fbUser.metadata.creationTime || new Date().toISOString(),
          last_sign_in_at: fbUser.metadata.lastSignInTime || new Date().toISOString(),
        };

        // Firebase identity is enough to render the app. Supabase profile hydration
        // runs separately so a slow or unavailable network can never hold startup.
        setUser(appUser);
        setProfile(buildFallbackProfile(fbUser));

        try {
          const token = await fbUser.getIdToken();
          if (auth.currentUser?.uid !== fbUser.uid) return;
          setSession({
            access_token: token,
            refresh_token: "firebase-managed",
            user: fbUser,
          });
          startTokenRefresh();
        } catch (tokenError) {
          console.error("Firebase token initialization failed:", tokenError);
          setSession(null);
        } finally {
          setLoading(false);
        }

        void (async () => {
          await createProfileInSupabase(
            fbUser.uid,
            fbUser.email || "",
            fbUser.displayName,
            fbUser.photoURL
          );

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", fbUser.uid)
              .maybeSingle();

            if (error) throw error;
            if (!data || auth.currentUser?.uid !== fbUser.uid) return;

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
      },
      (authError) => {
        console.error("Firebase auth observer failed:", authError);
        setUser(null);
        setProfile(null);
        setSession(null);
        stopTokenRefresh();
        setLoading(false);
      }
    );

    return () => {
      authUnsub();
      stopTokenRefresh();
    };
  }, [createProfileInSupabase, startTokenRefresh, stopTokenRefresh]);

  const signOut = async () => {
    setLoading(true);
    try {
      stopTokenRefresh();
      await firebaseSignOut(auth);
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
