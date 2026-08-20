import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { motion } from "framer-motion";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Rocket className="h-10 w-10 text-purple-400" />
        </div>

        <h1 className="text-3xl font-bold text-white">Coming Soon</h1>
        <p className="text-zinc-400 text-base max-w-xs">
          This feature is under development. Stay tuned!
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors border border-white/10"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
