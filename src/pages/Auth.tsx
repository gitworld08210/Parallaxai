import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";
import { Mail, Lock, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { loginSchema, signupSchema, type LoginFormData, type SignupFormData } from "@/lib/schemas";
import { checkRateLimit, authLimiter } from "@/lib/rateLimit";
import { useTranslation } from "react-i18next";


type Tab = "signin" | "signup";
type AccountKind = "personal" | "organization";
const ORG_INTENT_KEY = "aurelix:signup_kind";

const Auth = () => {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const { t } = useTranslation();

  const nextPath = useMemo(() => {
    const raw = params.get("next");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  }, [params]);

  const [tab, setTab] = useState<Tab>("signin");
  const [kind, setKind] = useState<AccountKind>("personal");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const form = tab === "signin" ? loginForm : signupForm;

  const routeForUser = async (uid: string) => {
    setAuthLoading(true);
    try {
      if (nextPath) { nav(nextPath, { replace: true }); return; }

      let prof: any = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();
        if (!error && data) prof = data;
      } catch (e) {
        console.error("Error fetching profile during routing:", e);
      }

      localStorage.removeItem(ORG_INTENT_KEY);

      // Profile is created during signup - only fall back if it's genuinely missing
      if (!prof?.display_name && !prof?.username) {
        nav("/profile-creation", { replace: true });
        return;
      }

      // If user has no interests selected, send to onboarding
      if (!prof?.interests || (Array.isArray(prof.interests) && prof.interests.length === 0)) {
        nav("/onboarding", { replace: true });
        return;
      }

      nav("/", { replace: true });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => { 
    if (!loading && user) routeForUser(user.id); 
  }, [user, loading]);

  const buildUsername = (raw: string, fallback: string) => {
    const base = (raw || fallback).toLowerCase().replace(/[^a-z0-9._]/g, "");
    return raw ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const writeProfile = async (uid: string, data: Record<string, any>, username: string) => {
    await supabase.from("profiles").upsert({
      user_id: uid,
      ...data,
    });
  };

  const handleAuth = async (formData: LoginFormData | SignupFormData) => {
    if (!checkRateLimit(authLimiter)) return;
    const email = formData.email;
    const password = formData.password;
    const name = "name" in formData ? formData.name : "";
    setBusy(true);
    try {
      if (tab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Logged in");
        if (data.user) await routeForUser(data.user.id);
      } else {
        if (kind === "organization") localStorage.setItem(ORG_INTENT_KEY, "organization");

        const displayName = name.trim();
        const username = buildUsername(
          handle.trim(),
          displayName || email.trim().split("@")[0]
        );

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (error) throw error;

        if (data.user) {
          // Profile is fully created as part of signup
          await writeProfile(data.user.id, {
            id: data.user.id,
            user_id: data.user.id,
            email: email.trim(),
            display_name: displayName,
            username,
            bio: "",
            account_type: kind,
            onboarded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            verified: false,
          }, username);

          toast.success("Account created");
          await routeForUser(data.user.id);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Authentication failed");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      if (tab === "signup" && kind === "organization") localStorage.setItem(ORG_INTENT_KEY, "organization");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      // Google OAuth via Supabase uses redirect flow.
      // After redirect, onAuthStateChange in AuthProvider will fire with the session.
    } catch (e: any) {
      toast.error(e?.message || "Google sign-in failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Loading Overlay */}
      {authLoading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-300 animate-pulse">Processing...</p>
        </div>
      )}


      
      <div className="w-full max-w-[360px] flex flex-col items-center z-10">
        <div className="mb-12 text-center">
          <span className="text-6xl font-serif italic tracking-tighter text-white select-none">Parallax</span>
        </div>

        <div className="w-full border border-[#333639] rounded-2xl p-8 bg-[#16181c] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div 
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-4"
            >
              {tab === "signup" && (
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 mb-2">
                  <button 
                    onClick={() => setKind("personal")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${kind === "personal" ? "bg-white text-black" : "text-zinc-500"}`}
                  >
                    Personal
                  </button>
                  <button 
                    onClick={() => setKind("organization")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${kind === "organization" ? "bg-white text-black" : "text-zinc-500"}`}
                  >
                    Business
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input 
                      type="email" 
                      {...form.register("email")}
                      placeholder={t("auth.email")}
                      className="w-full bg-black border border-[#333639] rounded-2xl pl-11 pr-4 h-[52px] text-sm outline-none focus:ring-2 ring-[#1D9BF0]/30 focus:border-[#1D9BF0]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input 
                      type="password" 
                      {...form.register("password")}
                      placeholder={t("auth.password")}
                      className="w-full bg-black border border-[#333639] rounded-2xl pl-11 pr-4 h-[52px] text-sm outline-none focus:ring-2 ring-[#1D9BF0]/30 focus:border-[#1D9BF0]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>
                {tab === "signup" && (
                  <>
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                        <input 
                          {...signupForm.register("name")}
                          placeholder={t("auth.full_name")}
                          className="w-full bg-black border border-[#333639] rounded-2xl pl-11 pr-4 h-[52px] text-sm outline-none focus:ring-2 ring-[#1D9BF0]/30 focus:border-[#1D9BF0]/50 transition-all placeholder:text-zinc-600"
                        />
                      </div>
                      {signupForm.formState.errors.name && (
                        <p className="text-xs text-red-400 mt-1">{signupForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      <input 
                        value={handle}
                        onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                        placeholder="Username (optional)"
                        className="w-full bg-black border border-[#333639] rounded-2xl pl-11 pr-4 h-[52px] text-sm outline-none focus:ring-2 ring-[#1D9BF0]/30 focus:border-[#1D9BF0]/50 transition-all placeholder:text-zinc-600"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 px-1">
                      Only your name is required. Photo and bio can be added later.
                    </p>
                  </>
                )}
              </div>

              <button 
                onClick={form.handleSubmit(handleAuth)}
                disabled={busy}
                className="w-full bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-bold py-3.5 h-[52px] rounded-full transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {busy ? "Signing in..." : tab === "signin" ? t("auth.sign_in") : t("auth.sign_up")}
              </button>

              <div className="flex items-center gap-4 py-3">
                <div className="h-[1px] flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t("auth.or_separator")}</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>

              <button 
                onClick={handleGoogle}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-sm py-3.5 h-[52px] rounded-full border border-border shadow-sm hover:bg-zinc-100 transition-all active:scale-[0.98]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("auth.continue_google")}
              </button>

              {tab === "signin" && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => nav("/forgot-password")}
                    className="text-[11px] font-bold text-[#1D9BF0] hover:text-[#1A8CD8] transition-colors"
                  >
                    {t("auth.forgot_password")}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full mt-8 pt-8 border-t border-white/5">
          <p className="text-[15px] text-center text-zinc-400">
            {tab === "signin" ? t("auth.no_account") : t("auth.have_account")}{" "}
            <button 
              onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
              className="text-primary font-black hover:brightness-110"
            >
              {tab === "signin" ? t("auth.sign_up") : t("auth.sign_in")}
            </button>
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-[10px] font-bold text-zinc-800 tracking-tighter uppercase select-none">
        &copy; 2026 Parallax Universe &bull; All Rights Reserved
      </div>
    </div>
  );
};

export default Auth;
