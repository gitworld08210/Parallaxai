import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, Sparkles } from "lucide-react";
import { TopBar } from "@/components/vibe/TopBar";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";

import { useAuth } from "@/contexts/AuthProvider";
import { gradientFor, initialsOf } from "@/lib/format";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { profileSchema, type ProfileFormData } from "@/lib/schemas";



const EditProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioAiBusy, setBioAiBusy] = useState(false);
  const [bioVariants, setBioVariants] = useState<Array<{ style: string; text: string }>>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: "", username: "", bio: "" },
    mode: "onChange",
  });

  const displayName = form.watch("display_name");
  const username = form.watch("username");
  const bio = form.watch("bio") || "";

  const rewriteBio = async () => {
    setBioAiBusy(true);
    setBioVariants([]);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-bio", { body: { bio: bio.trim() } });
      const variants = data?.variants ?? [];
      if (!variants.length) toast.error("No suggestions — try again.");
      setBioVariants(variants);
    } catch (e: any) { toast.error(e.message || "Action failed"); } finally {
      setBioAiBusy(false);
    }
  };

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name || "",
        username: profile.username,
        bio: profile.bio || "",
      });
      setAvatar(profile.avatar_url);
      setCover((profile as any).cover_url ?? null);
    }
  }, [profile]);


  const uploadImage = async (file: File, kind: "avatar" | "cover") => {
    if (!user) return;
    setBusy(true);
    try {
      const url = await uploadToCloudinary(file);
      if (kind === "avatar") setAvatar(url);
      else setCover(url);

    } catch (e: any) { toast.error(e.message || "Action failed"); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!user) return;
    const isValid = await form.trigger();
    if (!isValid) return;
    setBusy(true);
    
    const formData = form.getValues();
    
    try {
      // Update Profile in Supabase
      const profileData = {
        display_name: formData.display_name,
        username: formData.username,
        bio: formData.bio || "",
        avatar_url: avatar,
        cover_url: cover,
        updated_at: new Date().toISOString(),
      };

      await supabase.from("profiles").update(profileData as any).eq("user_id", user.uid);
      
      // Also try writing to username-indexed doc for resolution efficiency
      if (formData.username) {
        await supabase.from('usernames' as any).upsert({ 
          username: formData.username.toLowerCase(),
          user_id: user.uid,
          uid: user.uid 
        } as any);
      }

      if (refreshProfile) await refreshProfile();
      toast.success("Profile saved");
      nav("/profile");
    } catch (e: any) { 
      toast.error(e.message || "Action failed"); 
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <TopBar
        subtitle="Settings"
        title="Edit profile"
        right={
          <button onClick={() => nav(-1)} className="glass h-11 w-11 rounded-full grid place-items-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
        }
      />
      <div className="px-5 space-y-6">
        {/* Cover banner */}
        <div className="relative h-32 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5">
          {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/20" />
          <label className="absolute bottom-3 right-3 h-10 w-10 bg-black/60 backdrop-blur-md rounded-full grid place-items-center cursor-pointer hover:bg-black/80 transition-colors">
            <Upload className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
          </label>
          {cover && (
            <button onClick={() => setCover(null)} className="absolute bottom-3 left-3 h-10 px-4 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold hover:bg-black/80 transition-colors">
              Remove
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 -mt-14">
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt="" className="h-28 w-28 rounded-full object-cover ring-[6px] ring-black shadow-2xl" />
            ) : (
              <div className="h-28 w-28 rounded-full ring-[6px] ring-black shadow-2xl overflow-hidden">
                <AuraAvatar gradient={gradientFor(username)} size="lg" glow initials={initialsOf(displayName || username)} />
              </div>
            )}
            <label className="absolute bottom-0 right-0 h-9 w-9 bg-primary rounded-full grid place-items-center ring-4 ring-black cursor-pointer hover:scale-105 transition-transform">
              <Upload className="h-4 w-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Display name</label>
            <input
              {...form.register("display_name")}
              maxLength={50}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-primary/50 transition-colors"
            />
            {form.formState.errors.display_name && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.display_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Username</label>
            <input
              {...form.register("username", {
                onChange: (e) => {
                  const filtered = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                  form.setValue("username", filtered, { shouldValidate: true });
                },
              })}
              maxLength={24}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-primary/50 transition-colors"
            />
            {form.formState.errors.username && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bio</label>
              <button
                type="button"
                onClick={rewriteBio}
                disabled={bioAiBusy}
                className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {bioAiBusy ? "Thinking…" : "AI rewrite"}
              </button>
            </div>
            <textarea
              {...form.register("bio")}
              maxLength={200} rows={4}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[15px] outline-none resize-none focus:border-primary/50 transition-colors"
              placeholder="Tell us about yourself..."
            />
            {form.formState.errors.bio && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.bio.message}</p>
            )}
            {bioVariants.length > 0 && (
              <div className="mt-3 space-y-2">
                {bioVariants.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { form.setValue("bio", v.text, { shouldValidate: true }); setBioVariants([]); }}
                    className="w-full text-left bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[14px] hover:bg-zinc-800 transition-colors"
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{v.style}</div>
                    <div className="leading-snug">{v.text}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={save} disabled={busy} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[15px] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
          {busy ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
