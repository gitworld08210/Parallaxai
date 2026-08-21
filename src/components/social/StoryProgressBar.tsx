import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StoryProgressBarProps {
  /** Total number of stories in the set */
  totalStories: number;
  /** Zero-based index of the currently active story */
  currentIndex: number;
  /** Duration per story segment in ms (default 5000) */
  duration?: number;
  /** Called when the active segment finishes filling */
  onComplete?: () => void;
  /** Whether the progress is paused (e.g. user holding down) */
  paused?: boolean;
  className?: string;
}

export const StoryProgressBar = ({
  totalStories,
  currentIndex,
  duration = 5000,
  onComplete,
  paused = false,
  className,
}: StoryProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  // Keep a stable ref to the latest onComplete to avoid stale closures
  // and prevent it from being an effect dependency (fixes issues 2 & 4)
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);
    startTimeRef.current = null;
    pausedAtRef.current = 0;
  }, [currentIndex]);

  useEffect(() => {
    if (paused) {
      // Store where we left off
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pausedAtRef.current = progress;
      return;
    }

    // Cancelled flag prevents in-flight rAF from firing onComplete
    // after cleanup runs (fixes issue 3: race on index change)
    let cancelled = false;

    const animate = (timestamp: number) => {
      if (cancelled) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const remainingDuration = duration * (1 - pausedAtRef.current);
      const currentProgress =
        pausedAtRef.current + ((1 - pausedAtRef.current) * elapsed) / remainingDuration;

      if (currentProgress >= 1) {
        setProgress(1);
        if (!cancelled) {
          onCompleteRef.current?.();
        }
        return;
      }

      setProgress(currentProgress);
      rafRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentIndex, paused, duration]);

  return (
    <div
      className={cn("flex w-full gap-1 px-2 py-2", className)}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: totalStories }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
        >
          <div
            className="h-full bg-white rounded-full transition-none"
            style={{
              width:
                i < currentIndex
                  ? "100%"
                  : i === currentIndex
                  ? `${progress * 100}%`
                  : "0%",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StoryProgressBar;
