import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, CreditCard, Smartphone, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUB_TIERS, getSubTier } from "@/lib/ranks";

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setMpesaPhone(data.phone_number || "");
        }
        setLoading(false);
      });
  }, [user]);

  const handleSubscribe = (planId: string) => {
    if (planId === "free") return;
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const processPaystack = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const tier = SUB_TIERS.find((t) => t.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { amount: tier.price, plan: tier.dbValue, callback_url: window.location.origin + "/dashboard/settings" },
      });
      if (error) throw error;
      if (data?.authorization_url) window.location.href = data.authorization_url;
      else throw new Error(data?.error || "Failed to initialize");
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setSubscribing(false);
    }
  };

  const processMpesa = async () => {
    if (!selectedPlan || !mpesaPhone) { toast.error("Enter your M-Pesa number"); return; }
    setSubscribing(true);
    try {
      const tier = SUB_TIERS.find((t) => t.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: { phone_number: mpesaPhone, amount: tier.price, plan: tier.dbValue },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("STK Push sent! Check your phone.");
      setPaymentMethod(null);
      setSelectedPlan(null);
    } catch (err: any) {
      toast.error(err.message || "M-Pesa failed");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const currentPlan = profile?.subscription_plan || "free";
  const isActive = profile?.subscription_status === "active" || currentPlan === "free";
  const currentSub = getSubTier(currentPlan);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Subscription</h1>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentSub.color} bg-secondary`}>
            {currentSub.icon} {currentSub.name}
          </span>
        </div>

        {/* Current plan bar */}
        {currentPlan !== "free" && isActive && (
          <div className="glass-card rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-bold">{currentSub.name} Plan Active</span>
            </div>
            {profile?.subscription_expires_at && (
              <span className="text-muted-foreground">
                Expires {new Date(profile.subscription_expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Pricing grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SUB_TIERS.map((tier) => {
            const isCurrent = currentPlan === tier.dbValue;
            return (
              <div
                key={tier.id}
                className={`glass-card rounded-xl p-3 flex flex-col relative ${
                  tier.id === "gold" ? "border-primary/40 glow-gold" : ""
                } ${isCurrent ? "ring-1 ring-primary/50" : ""}`}
              >
                {tier.id === "gold" && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Popular
                  </div>
                )}
                <div className="text-center mb-2">
                  <div className="text-lg mb-0.5">{tier.icon}</div>
                  <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                  <div className="mt-1">
                    <span className="text-base font-bold font-mono">
                      {tier.price === 0 ? "Free" : `${tier.price}`}
                    </span>
                    {tier.period && <span className="text-[9px] text-muted-foreground">{tier.period}</span>}
                  </div>
                </div>
                <ul className="space-y-1 flex-1 mb-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isCurrent || tier.id === "free"}
                  size="sm"
                  className={`w-full text-[10px] h-7 ${
                    tier.id === "gold"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isCurrent ? "Current" : tier.id === "free" ? "Free" : "Subscribe"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Platform fee explanation */}
        <div className="glass-card rounded-xl p-3 text-xs text-muted-foreground">
          <p className="font-bold text-foreground mb-1">How the Platform Fee Works</p>
          <p>When a question's voting period ends, Soluny takes a small platform fee from the prize pool before distributing earnings to top answers. Higher subscription tiers enjoy lower fees and higher earning potential.</p>
        </div>
      </div>

      {/* Payment method dialog */}
      <Dialog open={selectedPlan !== null && paymentMethod === null && selectedPlan !== "free"} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Payment Method</DialogTitle>
            <DialogDescription className="text-xs">Choose how to pay</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <button onClick={() => setPaymentMethod("paystack")} className="glass-card glass-card-hover rounded-lg p-3 flex items-center gap-3 text-left text-sm">
              <CreditCard className="h-5 w-5 text-primary" />
              <div><div className="font-bold text-xs">Card (Paystack)</div><div className="text-[10px] text-muted-foreground">Visa, Mastercard</div></div>
            </button>
            <button onClick={() => setPaymentMethod("mpesa")} className="glass-card glass-card-hover rounded-lg p-3 flex items-center gap-3 text-left text-sm">
              <Smartphone className="h-5 w-5 text-primary" />
              <div><div className="font-bold text-xs">M-Pesa</div><div className="text-[10px] text-muted-foreground">STK Push</div></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paystack confirm */}
      <Dialog open={paymentMethod === "paystack"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Pay with Card</DialogTitle></DialogHeader>
          <div className="py-2 text-center">
            <div className="text-xl font-bold font-mono text-gold-glow">KES {SUB_TIERS.find((t) => t.id === selectedPlan)?.price.toLocaleString()}</div>
          </div>
          <Button onClick={processPaystack} disabled={subscribing} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-9">
            {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Proceed
          </Button>
        </DialogContent>
      </Dialog>

      {/* M-Pesa dialog */}
      <Dialog open={paymentMethod === "mpesa"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">M-Pesa Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-center text-xl font-bold font-mono text-gold-glow">KES {SUB_TIERS.find((t) => t.id === selectedPlan)?.price.toLocaleString()}</div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="254712345678" className="h-8 text-xs bg-secondary/30 border-border/40" />
            </div>
          </div>
          <Button onClick={processMpesa} disabled={subscribing || !mpesaPhone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-9">
            {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Send STK Push
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
