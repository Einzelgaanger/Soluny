import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Crown,
  Zap,
  Check,
  Loader2,
  CreditCard,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    features: [
      "Ask up to 3 questions/month",
      "Answer unlimited questions",
      "Basic leaderboard access",
    ],
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: 999,
    period: "/mo",
    features: [
      "Unlimited questions",
      "Priority visibility",
      "Pro badge & rank boost",
      "Early access to features",
      "Higher earning multiplier",
    ],
    popular: true,
  },
  {
    id: "annual",
    name: "Pro Annual",
    price: 9990,
    period: "/yr",
    features: [
      "Everything in Pro Monthly",
      "2 months free",
      "Exclusive annual badge",
      "Priority support",
    ],
  },
];

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

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    setSelectedPlan(planId);
    setPaymentMethod(null); // open method picker
  };

  const processPaystack = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          amount: plan.price,
          plan: plan.id,
          callback_url: window.location.origin + "/dashboard/settings",
        },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data?.error || "Failed to initialize payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setSubscribing(false);
    }
  };

  const processMpesa = async () => {
    if (!selectedPlan || !mpesaPhone) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }
    setSubscribing(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone_number: mpesaPhone,
          amount: plan.price,
          plan: plan.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("STK Push sent! Check your phone to complete payment.");
      setPaymentMethod(null);
      setSelectedPlan(null);
    } catch (err: any) {
      toast.error(err.message || "M-Pesa payment failed");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = profile?.subscription_plan || "free";
  const isActive = profile?.subscription_status === "active";
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString()
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and preferences
          </p>
        </div>

        {/* Current plan status */}
        {isActive && (
          <div className="glass-card gradient-border rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <div className="font-bold text-gradient-gold capitalize">
                  {currentPlan} Plan Active
                </div>
                <div className="text-xs text-muted-foreground">
                  Expires: {expiresAt}
                </div>
              </div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/30">
              Active
            </div>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id && (plan.id === "free" || isActive);
            return (
              <div
                key={plan.id}
                className={`glass-card glass-card-hover rounded-xl p-6 flex flex-col relative ${
                  plan.popular ? "gradient-border glow-gold" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-4 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold font-mono">
                      {plan.price === 0 ? "Free" : `KES ${plan.price.toLocaleString()}`}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || plan.id === "free"}
                  className={`w-full font-semibold ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.id === "free" ? "Free Forever" : "Subscribe"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment method dialog */}
      <Dialog
        open={selectedPlan !== null && paymentMethod === null && selectedPlan !== "free"}
        onOpenChange={() => setSelectedPlan(null)}
      >
        <DialogContent className="glass-card border-border/60">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you'd like to pay for your subscription
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <button
              onClick={() => setPaymentMethod("paystack")}
              className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-4 text-left"
            >
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <div className="font-bold">Card Payment (Paystack)</div>
                <div className="text-xs text-muted-foreground">
                  Visa, Mastercard, Verve
                </div>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod("mpesa")}
              className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-4 text-left"
            >
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <div className="font-bold">M-Pesa (STK Push)</div>
                <div className="text-xs text-muted-foreground">
                  Pay directly from your phone
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paystack confirmation */}
      <Dialog open={paymentMethod === "paystack"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60">
          <DialogHeader>
            <DialogTitle>Pay with Card</DialogTitle>
            <DialogDescription>
              You'll be redirected to Paystack to complete your payment securely.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="glass-card rounded-xl p-4 text-center space-y-2">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold font-mono text-gold-glow">
                KES {plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}
              </div>
            </div>
          </div>
          <Button
            onClick={processPaystack}
            disabled={subscribing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {subscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Proceed to Paystack
          </Button>
        </DialogContent>
      </Dialog>

      {/* M-Pesa dialog */}
      <Dialog open={paymentMethod === "mpesa"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60">
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
            <DialogDescription>
              Enter your Safaricom number to receive an STK Push
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="glass-card rounded-xl p-4 text-center space-y-2">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold font-mono text-gold-glow">
                KES {plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="254712345678"
                className="bg-background/50 border-border/60"
              />
              <p className="text-[11px] text-muted-foreground">
                Format: 254XXXXXXXXX
              </p>
            </div>
          </div>
          <Button
            onClick={processMpesa}
            disabled={subscribing || !mpesaPhone}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {subscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send STK Push
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
