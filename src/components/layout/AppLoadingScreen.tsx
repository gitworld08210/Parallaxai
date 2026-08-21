import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-[#050505] grid place-items-center relative overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent" />

      <div className="flex flex-col items-center gap-6 z-10">
        {/* Animated brand text */}
        <motion.span
          className="text-5xl font-serif italic tracking-tighter text-white drop-shadow-sm select-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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

        {/* Breathing dot indicator */}
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default AppLoadingScreen;
