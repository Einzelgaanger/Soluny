import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Crown, CreditCard, Smartphone, Check } from "lucide-react";
import { getSubTier, SUB_TIERS } from "@/lib/ranks";

const Subscribe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa" | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("subscription_plan, subscription_expires_at, phone_number").eq("user_id", user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setMpesaPhone(data.phone_number || ""); }
      setLoading(false);
    });
  }, [user]);

  const processPaystack = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const tier = SUB_TIERS.find((t) => t.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { amount: tier.price, plan: tier.dbValue, callback_url: window.location.origin + "/dashboard/earnings" },
      });
      if (error) throw error;
      if (data?.authorization_url) window.location.href = data.authorization_url;
      else throw new Error(data?.error || "Failed to initialize");
    } catch (err: any) { toast.error(err.message || "Payment failed"); }
    finally { setSubscribing(false); }
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
      setPaymentMethod(null); setSelectedPlan(null);
    } catch (err: any) { toast.error(err.message || "M-Pesa failed"); }
    finally { setSubscribing(false); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const currentPlan = profile?.subscription_plan || "free";
  const sub = getSubTier(currentPlan);

  // Step: choose plan → choose payment → confirm
  const step = selectedPlan && paymentMethod ? "confirm" : selectedPlan ? "payment" : "plans";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4 lg:py-8">
        <button
          onClick={() => {
            if (step === "confirm") setPaymentMethod(null);
            else if (step === "payment") setSelectedPlan(null);
            else navigate("/dashboard/earnings");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {step === "plans" ? "Back to Earnings" : "Back"}
        </button>

        <div className="text-center space-y-2">
          <Crown className="h-8 w-8 text-primary mx-auto" />
          <h1 className="text-xl lg:text-2xl font-bold">
            {step === "plans" ? "Choose a Plan" : step === "payment" ? "Payment Method" : "Confirm Payment"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Current plan: <span className={`font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
          </p>
        </div>

        {step === "plans" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {SUB_TIERS.filter(t => t.id !== "free").map((tier) => {
              const isCurrent = currentPlan === tier.dbValue;
              return (
                <div key={tier.id} className={`glass-card rounded-2xl p-5 lg:p-6 flex flex-col relative ${tier.id === "gold" ? "border-primary/40 ring-1 ring-primary/20" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                  {tier.id === "gold" && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-0.5 rounded-full">Popular</div>
                  )}
                  <div className="text-center mb-4">
                    <div className="text-2xl mb-1">{tier.icon}</div>
                    <div className={`text-sm font-bold ${tier.color}`}>{tier.name}</div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold font-mono">KES {tier.price.toLocaleString()}</span>
                      {tier.period && <span className="text-xs text-muted-foreground">{tier.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setSelectedPlan(tier.id)}
                    disabled={isCurrent}
                    className={`w-full h-10 text-sm font-semibold rounded-xl ${tier.id === "gold" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  >
                    {isCurrent ? "Current Plan" : "Select"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {step === "payment" && (
          <div className="max-w-sm mx-auto space-y-3">
            <div className="text-center mb-4">
              <div className="text-lg font-bold">
                {SUB_TIERS.find(t => t.id === selectedPlan)?.icon} {SUB_TIERS.find(t => t.id === selectedPlan)?.name}
              </div>
              <div className="text-2xl font-bold font-mono text-primary mt-1">
                KES {SUB_TIERS.find(t => t.id === selectedPlan)?.price.toLocaleString()}
              </div>
            </div>
            <button onClick={() => setPaymentMethod("paystack")} className="glass-card rounded-xl p-4 flex items-center gap-4 w-full text-left hover:bg-muted/10 transition-colors">
              <CreditCard className="h-6 w-6 text-primary" />
              <div><div className="font-bold text-sm">Card (Paystack)</div><div className="text-xs text-muted-foreground">Visa, Mastercard</div></div>
            </button>
            <button onClick={() => setPaymentMethod("mpesa")} className="glass-card rounded-xl p-4 flex items-center gap-4 w-full text-left hover:bg-muted/10 transition-colors">
              <Smartphone className="h-6 w-6 text-primary" />
              <div><div className="font-bold text-sm">M-Pesa</div><div className="text-xs text-muted-foreground">STK Push</div></div>
            </button>
          </div>
        )}

        {step === "confirm" && paymentMethod === "paystack" && (
          <div className="max-w-sm mx-auto glass-card rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-primary">KES {SUB_TIERS.find(t => t.id === selectedPlan)?.price.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">You'll be redirected to Paystack</p>
            </div>
            <Button onClick={processPaystack} disabled={subscribing} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 text-sm rounded-xl">
              {subscribing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Proceed to Payment
            </Button>
          </div>
        )}

        {step === "confirm" && paymentMethod === "mpesa" && (
          <div className="max-w-sm mx-auto glass-card rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-primary">KES {SUB_TIERS.find(t => t.id === selectedPlan)?.price.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">M-Pesa Phone Number</Label>
              <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="254712345678" className="h-11 bg-secondary/30 border-border/40 rounded-xl text-sm" />
            </div>
            <Button onClick={processMpesa} disabled={subscribing || !mpesaPhone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 text-sm rounded-xl">
              {subscribing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Send STK Push
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Subscribe;
