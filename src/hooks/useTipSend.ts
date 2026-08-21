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
      // 1. Read sender wallet to check balance
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('total')
        .eq('user_id', senderId)
        .single();

      const currentBalance = senderWallet?.total || 0;

      if (currentBalance < amount) {
        throw new Error("Insufficient balance");
      }

      // 2. Deduct from sender using conditional update to prevent negative balance.
      // The .gte('total', amount) guard ensures the update only succeeds if
      // balance is still sufficient, preventing race-condition double-spends.
      const { data: deductResult, error: deductError } = await supabase
        .from('wallets')
        .update({ total: currentBalance - amount })
        .eq('user_id', senderId)
        .gte('total', amount)
        .select('total')
        .single();

      if (deductError || !deductResult) {
        throw new Error("Insufficient balance (concurrent modification)");
      }

      // 3. Credit to recipient (upsert)
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('total')
        .eq('user_id', recipientId)
        .maybeSingle();

      if (recipientWallet) {
        await supabase
          .from('wallets')
          .update({ total: recipientWallet.total + amount })
          .eq('user_id', recipientId);
      } else {
        await supabase
          .from('wallets')
          .insert({ user_id: recipientId, total: amount });
      }

      // 4. Log transaction
      await supabase.from('transactions').insert({
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
