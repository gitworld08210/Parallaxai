import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

interface AppLoadingScreenProps {
  /** Called when the timeout expires. If not provided, navigates to /auth. */
  onTimeout?: () => void;
  /** Timeout duration in ms before redirecting (default 5000) */
  timeoutMs?: number;
}

export const AppLoadingScreen = ({
  onTimeout,
  timeoutMs = 5000,
}: AppLoadingScreenProps) => {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      } else {
        navigate("/auth", { replace: true });
      }
    }, timeoutMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, onTimeout, timeoutMs]);

  return (
    <motion.div
      className="min-h-screen bg-background grid place-items-center relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated gradient orbs - hidden when user prefers reduced motion */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]"
            animate={{
              x: [0, 40, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-20 h-64 w-64 rounded-full bg-primary/15 blur-[80px]"
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1.1, 0.9, 1.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-primary/10 blur-[60px]"
            animate={{
              scale: [0.8, 1.3, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="flex flex-col items-center gap-8 z-10">
        {/* Animated brand text */}
        <motion.span
          className="text-6xl font-serif italic tracking-tighter text-white drop-shadow-sm select-none"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Parallax
        </motion.span>

        {/* Pulsing loading text */}
        <motion.p
          className="text-sm text-white/50 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading...
        </motion.p>

        {/* Animated gradient line indicator */}
        <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/40"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AppLoadingScreen;
