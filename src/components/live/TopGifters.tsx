import { useMemo } from "react";
import { Crown } from "lucide-react";

type GiftEvent = {
  id: string;
  sender_id: string;
  coins_total: number;
};

interface TopGiftersProps {
  gifts: GiftEvent[];
  maxDisplay?: number;
}

export function TopGifters({ gifts, maxDisplay = 5 }: TopGiftersProps) {
  const topGifters = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of gifts) {
      map.set(g.sender_id, (map.get(g.sender_id) || 0) + Number(g.coins_total || 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxDisplay)
      .map(([sender_id, total]) => ({ sender_id, total }));
  }, [gifts, maxDisplay]);

  if (topGifters.length === 0) return null;

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-2 space-y-1">
      <div className="flex items-center gap-1 text-xs font-bold text-yellow-400 px-1">
        <Crown className="w-3 h-3" /> Top Gifters
      </div>
      {topGifters.map((g, i) => (
        <div
          key={g.sender_id}
          className="flex items-center justify-between px-2 py-1 rounded-lg text-xs"
        >
          <span className="text-white/80">
            #{i + 1} {g.sender_id.slice(0, 8)}...
          </span>
          <span className="font-bold text-yellow-400">
            {g.total}
          </span>
        </div>
      ))}
    </div>
  );
}
