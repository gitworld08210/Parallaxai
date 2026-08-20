import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthProvider";
import { useTipSend } from "@/hooks/useTipSend";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { TipAnimation } from "@/components/social/TipAnimation";
import { toast } from "sonner";

const PRESETS = [10, 25, 50, 100, 500, 1000];

type Step = "pick" | "confirm" | "done";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipientId: string;
  recipientName: string;
  postId?: string;
}

export function TipSheet({ open, onOpenChange, recipientId, recipientName, postId }: Props) {
  const { user } = useAuth();
  const { balance } = useCoinBalance();
  const { sendTip, loading } = useTipSend();

  const [step, setStep] = useState<Step>("pick");
  const [amount, setAmount] = useState<number>(25);
  const [message, setMessage] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSend = async () => {
    if (!user) return toast.error("Sign in to tip");
    if (amount <= 0) return toast.error("Select an amount");
    if (balance < amount) return toast.error("Insufficient coins");

    const success = await sendTip({
      senderId: user.id,
      recipientId,
      amount,
      postId,
      message: message.trim() || undefined,
    });

    if (success) {
      setStep("done");
      setShowAnimation(true);
      toast.success(`Sent ${amount} coins to @${recipientName}`);
    } else {
      toast.error("Tip failed. Check your balance.");
    }
  };

  const reset = () => {
    setStep("pick");
    setAmount(25);
    setMessage("");
    setShowAnimation(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <>
      <TipAnimation show={showAnimation} onDone={() => setShowAnimation(false)} />
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {step === "done" ? "Tip sent!" : `Send coins to @${recipientName}`}
            </SheetTitle>
          </SheetHeader>

          {step === "pick" && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-xl border py-3 text-sm font-semibold transition ${
                      amount === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card"
                    }`}
                  >
                    {p} coins
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Message (optional)</label>
                <Input
                  maxLength={280}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something nice..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span className="font-semibold">{balance} coins</span>
              </div>

              <Button
                onClick={() => setStep("confirm")}
                disabled={amount <= 0 || balance < amount}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-5 py-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 text-center space-y-2 border border-primary/20">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sending</p>
                <p className="font-display text-4xl font-bold">{amount} coins</p>
                <p className="text-xs text-muted-foreground">to @{recipientName}</p>
                {message && (
                  <p className="text-sm text-muted-foreground mt-2 italic">"{message}"</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("pick")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSend} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Send ${amount} coins`
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 py-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 grid place-items-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="font-semibold">{amount} coins sent to @{recipientName}</p>
              <p className="text-sm text-muted-foreground px-4">
                The coins have been transferred instantly.
              </p>
              <Button onClick={() => handleClose(false)} className="w-full" size="lg">
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
