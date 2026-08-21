import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TipParams {
  senderId: string;
  recipientId: string;
  amount: number;
  postId?: string;
  message?: string;
}

export function useTipSend() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTip = async ({ senderId, recipientId, amount, postId, message }: TipParams): Promise<boolean> => {
    setLoading(true);
    setError(null);

    // Self-transfer guard
    if (senderId === recipientId) {
      setError("Cannot tip yourself");
      setLoading(false);
      return false;
    }

    try {
      // 1. Read sender wallet
      const { data: senderWallet } = await supabase
        .from('wallets' as any)
        .select('total')
        .eq('user_id', senderId)
        .single();

      const currentBalance = (senderWallet as any)?.total || 0;

      if (currentBalance < amount) {
        throw new Error("Insufficient balance");
      }

      // 2. Deduct from sender
      await supabase
        .from('wallets' as any)
        .update({ total: currentBalance - amount })
        .eq('user_id', senderId);

      // 3. Credit to recipient (upsert)
      const { data: recipientWallet } = await supabase
        .from('wallets' as any)
        .select('total')
        .eq('user_id', recipientId)
        .maybeSingle();

      if (recipientWallet) {
        const recipientBalance = (recipientWallet as any).total || 0;
        await supabase
          .from('wallets' as any)
          .update({ total: recipientBalance + amount })
          .eq('user_id', recipientId);
      } else {
        await supabase
          .from('wallets' as any)
          .insert({ user_id: recipientId, total: amount });
      }

      // 4. Log transaction
      await supabase.from('transactions' as any).insert({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        type: "tip",
        post_id: postId || null,
        message: message || null,
        created_at: new Date().toISOString(),
      });

      setLoading(false);
      return true;
    } catch (e: any) {
      setError(e.message || "Tip failed");
      setLoading(false);
      return false;
    }
  };

  return { sendTip, loading, error };
}
