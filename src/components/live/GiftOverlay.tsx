import { AnimatePresence, motion } from "framer-motion";

type GiftItem = {
  id: string;
  icon: string;
  key: number;
};

interface GiftOverlayProps {
  gifts: GiftItem[];
}

export function GiftOverlay({ gifts }: GiftOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {gifts.map((g) => (
          <motion.span
            key={g.key}
            initial={{ opacity: 1, scale: 0.5, y: 0, x: `${20 + Math.random() * 60}%` }}
            animate={{ opacity: 0, scale: 1.5, y: -300 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute bottom-20 text-4xl"
            style={{ left: `${20 + Math.random() * 60}%` }}
          >
            {g.icon}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
