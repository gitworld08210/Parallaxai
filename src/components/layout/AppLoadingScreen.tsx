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
    <motion.div
      className="min-h-screen bg-black grid place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Simple brand text on black */}
        <motion.span
          className="text-5xl font-bold tracking-tight text-white select-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Parallax
        </motion.span>

        {/* Minimal thin progress bar */}
        <div className="w-48 h-0.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "33%" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AppLoadingScreen;
