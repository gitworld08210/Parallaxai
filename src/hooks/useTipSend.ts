import { useState } from "react";
import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

    // Self-transfer guard
    if (senderId === recipientId) {
      setError("Cannot tip yourself");
      setLoading(false);
      return false;
    }

    try {
      // TODO: Move wallet transfer logic to a Firebase Cloud Function for production security.
      // Client-side runTransaction prevents double-spend but cannot enforce authorization on the recipient credit.
      const senderWalletRef = doc(db, "wallets", senderId);
      const recipientWalletRef = doc(db, "wallets", recipientId);

      await runTransaction(db, async (transaction) => {
        // 1. Read sender wallet inside transaction for atomicity
        const senderSnap = await transaction.get(senderWalletRef);
        const currentBalance = senderSnap.exists() ? (senderSnap.data().total || 0) : 0;

        if (currentBalance < amount) {
          throw new Error("Insufficient balance");
        }

        // 2. Read recipient wallet
        const recipientSnap = await transaction.get(recipientWalletRef);

        // 3. Deduct from sender
        transaction.update(senderWalletRef, { total: currentBalance - amount });

        // 4. Credit to recipient
        if (recipientSnap.exists()) {
          const recipientBalance = recipientSnap.data().total || 0;
          transaction.update(recipientWalletRef, { total: recipientBalance + amount });
        } else {
          transaction.set(recipientWalletRef, { user_id: recipientId, total: amount });
        }
      });

      // 5. Log transaction (outside runTransaction since it's a separate collection write)
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
