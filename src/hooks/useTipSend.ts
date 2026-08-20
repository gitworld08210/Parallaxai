import { useState } from "react";
import { doc, getDoc, increment, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

    try {
      // 1. Check sender balance
      const senderWalletRef = doc(db, "wallets", senderId);
      const senderSnap = await getDoc(senderWalletRef);
      const currentBalance = senderSnap.exists() ? (senderSnap.data().total || 0) : 0;

      if (currentBalance < amount) {
        setError("Insufficient balance");
        setLoading(false);
        return false;
      }

      // 2. Deduct from sender
      await updateDoc(senderWalletRef, { total: increment(-amount) });

      // 3. Credit to recipient
      const recipientWalletRef = doc(db, "wallets", recipientId);
      const recipientSnap = await getDoc(recipientWalletRef);
      if (recipientSnap.exists()) {
        await updateDoc(recipientWalletRef, { total: increment(amount) });
      } else {
        // If recipient wallet doesn't exist, create it
        const { setDoc } = await import("firebase/firestore");
        await setDoc(recipientWalletRef, { total: amount });
      }

      // 4. Log transaction
      await addDoc(collection(db, "transactions"), {
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        type: "tip",
        post_id: postId || null,
        message: message || null,
        created_at: serverTimestamp(),
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
