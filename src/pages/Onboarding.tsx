import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthProvider";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Palette,
  Music,
  Cpu,
  Shirt,
  Laugh,
  GraduationCap,
  Dumbbell,
  UtensilsCrossed,
  Plane,
  Gamepad2,
  Camera,
  Atom,
  Briefcase,
  Heart,
  TreePine,
  Film,
  BookOpen,
  Wrench,
  Music2,
  PawPrint,
  ArrowRight,
  ArrowLeft,
  Check,
  ImagePlus,
  Sparkles,
} from "lucide-react";

const TOPICS = [
  { id: "Art", icon: Palette },
  { id: "Music", icon: Music },
  { id: "Tech", icon: Cpu },
  { id: "Fashion", icon: Shirt },
  { id: "Comedy", icon: Laugh },
  { id: "Education", icon: GraduationCap },
  { id: "Sports", icon: Dumbbell },
  { id: "Food", icon: UtensilsCrossed },
  { id: "Travel", icon: Plane },
  { id: "Gaming", icon: Gamepad2 },
  { id: "Photography", icon: Camera },
  { id: "Science", icon: Atom },
  { id: "Business", icon: Briefcase },
  { id: "Health", icon: Heart },
  { id: "Nature", icon: TreePine },
  { id: "Movies", icon: Film },
  { id: "Books", icon: BookOpen },
  { id: "DIY", icon: Wrench },
  { id: "Dance", icon: Music2 },
  { id: "Pets", icon: PawPrint },
];

interface CreatorProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

const Onboarding = () => {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch creators when user reaches step 2
  useEffect(() => {
    if (step === 2 && creators.length === 0) {
      fetchCreators();
    }
  }, [step]);

  const fetchCreators = async () => {
    setLoadingCreators(true);
    try {
      const q = query(
        collection(db, "profiles"),
        where("is_creator", "==", true),
        limit(20)
      );
      const snap = await getDocs(q);
      const results: CreatorProfile[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== user?.id) {
          results.push({
            id: doc.id,
            display_name: data.display_name || "Creator",
            username: data.username || "",
            avatar_url: data.avatar_url || null,
            bio: data.bio || null,
          });
        }
      });
      setCreators(results);
    } catch (e) {
      console.error("Failed to fetch creators:", e);
    } finally {
      setLoadingCreators(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

  const toggleCreator = (creatorId: string) => {
    setFollowedCreators((prev) =>
      prev.includes(creatorId)
        ? prev.filter((c) => c !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Upload avatar outside the batch since it's an external operation
      let avatarUrl: string | undefined;
      if (avatarFile) {
        try {
          avatarUrl = await uploadToCloudinary(avatarFile);
        } catch (e) {
          console.error("Avatar upload failed:", e);
          toast.error("Avatar upload failed, continuing without it");
        }
      }

      // Use a batch write to ensure all Firestore operations succeed or fail atomically
      const batch = writeBatch(db);

      // (a) Save selected interests to user_interests/{userId}
      const interestsMap: Record<string, number> = {};
      for (const topic of selectedTopics) {
        interestsMap[topic] = 1.0;
      }
      batch.set(doc(db, "user_interests", user.id), interestsMap);

      // (b) Create follow documents for each followed creator
      for (const creatorId of followedCreators) {
        const followRef = doc(collection(db, "follows"));
        batch.set(followRef, {
          follower_id: user.id,
          following_id: creatorId,
          created_at: serverTimestamp(),
        });
      }

      // (c) Update profile with onboarded_at and optional avatar/bio
      const profileUpdate: Record<string, any> = {
        onboarded_at: serverTimestamp(),
        interests: selectedTopics,
      };

      if (avatarUrl) {
        profileUpdate.avatar_url = avatarUrl;
      }

      if (bio.trim()) {
        profileUpdate.bio = bio.trim();
      }

      batch.update(doc(db, "profiles", user.id), profileUpdate);

      // Commit all writes atomically
      await batch.commit();
      await refreshProfile();

      toast.success("Welcome to Parallax!");
      // (d) Navigate to feed
      nav("/", { replace: true });
    } catch (e: any) {
      console.error("Onboarding error:", e);
      toast.error(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep1 = selectedTopics.length >= 5;
  const canProceedStep2 = followedCreators.length >= 5;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] px-4 py-8 z-10 flex flex-col min-h-screen">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2">Pick 5+ interests</h1>
                  <p className="text-sm text-muted-foreground">
                    Choose topics you love to personalize your feed
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {TOPICS.map((topic, i) => {
                    const Icon = topic.icon;
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium leading-tight text-center">
                          {topic.id}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                          >
                            <Check className="w-3 h-3 text-primary" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6 text-center">
                  <span className="text-xs text-muted-foreground">
                    {selectedTopics.length} of 5 minimum selected
                  </span>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2">Follow 5+ creators</h1>
                  <p className="text-sm text-muted-foreground">
                    Follow creators to fill your feed with amazing content
                  </p>
                </div>

                {loadingCreators ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : creators.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>No creators found yet.</p>
                    <p className="mt-1 text-xs">You can skip this step for now.</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
                    {creators.map((creator, i) => {
                      const isFollowed = followedCreators.includes(creator.id);
                      return (
                        <motion.div
                          key={creator.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {creator.avatar_url ? (
                              <img
                                src={creator.avatar_url}
                                alt={creator.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                {creator.display_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {creator.display_name}
                            </p>
                            {creator.bio && (
                              <p className="text-xs text-muted-foreground truncate">
                                {creator.bio}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleCreator(creator.id)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              isFollowed
                                ? "bg-primary/20 text-primary border border-primary"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {isFollowed ? "Following" : "Follow"}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <span className="text-xs text-muted-foreground">
                    {followedCreators.length} of 5 minimum followed
                  </span>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2">Complete your profile</h1>
                  <p className="text-sm text-muted-foreground">
                    Add a photo and bio to let people know who you are (optional)
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {/* Avatar upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden group"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                  <p className="text-xs text-muted-foreground -mt-3">
                    Tap to upload a photo
                  </p>

                  {/* Bio */}
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short bio about yourself..."
                    maxLength={200}
                    rows={4}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground -mt-4 self-end">
                    {bio.length}/200
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center gap-3 pt-6 mt-auto">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-card transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            onClick={() => {
              if (step === 3) {
                handleComplete();
              } else {
                setStep((s) => s + 1);
              }
            }}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2 && creators.length > 0) ||
              submitting
            }
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === 3 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Start Exploring
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
