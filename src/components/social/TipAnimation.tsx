import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  show: boolean;
  onDone?: () => void;
}

const coins = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: Math.random() * 200 - 100,
  delay: Math.random() * 0.3,
}));

export function TipAnimation({ show, onDone }: Props) {
  useEffect(() => {
    if (show && onDone) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {coins.map((coin) => (
            <motion.div
              key={coin.id}
              initial={{ y: 0, x: coin.x, opacity: 1, scale: 0.5 }}
              animate={{ y: -300, opacity: 0, scale: 1.2 }}
              transition={{ duration: 1.5, delay: coin.delay, ease: "easeOut" }}
              className="absolute text-yellow-400"
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-black/60 backdrop-blur-sm rounded-full px-6 py-3"
          >
            <span className="text-white font-semibold text-lg">Tip sent!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
