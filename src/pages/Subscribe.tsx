import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
  const step = selectedPlan && paymentMethod ? "confirm" : selectedPlan ? "payment" : "plans";
  const selectedTier = SUB_TIERS.find(t => t.id === selectedPlan);

  const handleBack = () => {
    if (step === "confirm") setPaymentMethod(null);
    else if (step === "payment") setSelectedPlan(null);
    else navigate("/dashboard/earnings");
  };

  return (
    <DashboardLayout>
      {isMobile ? (
        /* ========== MOBILE ========== */
        <div className="space-y-4 animate-fade-in pb-8">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {step === "plans" ? "Back" : "Back"}
          </button>

          {/* Header */}
          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <h1 className="text-sm font-bold">
                {step === "plans" ? "Choose Plan" : step === "payment" ? "Payment" : "Confirm"}
              </h1>
              <p className="text-[9px] text-muted-foreground">
                Current: <span className={`font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
              </p>
            </div>
          </div>

          {step === "plans" && (
            <div className="grid grid-cols-1 gap-2">
              {SUB_TIERS.filter(t => t.id !== "free").map((tier) => {
                const isCurrent = currentPlan === tier.dbValue;
                return (
                  <div key={tier.id} className={`glass-card rounded-xl p-3 relative ${tier.id === "gold" ? "border-primary/30 ring-1 ring-primary/20" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                    {tier.id === "gold" && (
                      <div className="absolute -top-2 right-3 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{tier.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold font-mono">KES {tier.price.toLocaleString()}</span>
                          {tier.period && <span className="text-[9px] text-muted-foreground">{tier.period}</span>}
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedPlan(tier.id)}
                        disabled={isCurrent}
                        size="sm"
                        className={`text-[10px] h-7 px-3 ${tier.id === "gold" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                      >
                        {isCurrent ? "Current" : "Select"}
                      </Button>
                    </div>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {tier.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Check className="h-2.5 w-2.5 text-primary shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {step === "payment" && selectedTier && (
            <div className="space-y-2">
              <div className="glass-card rounded-xl p-3 text-center">
                <div className="text-lg">{selectedTier.icon}</div>
                <div className={`text-xs font-bold ${selectedTier.color}`}>{selectedTier.name}</div>
                <div className="text-lg font-bold font-mono text-primary mt-1">KES {selectedTier.price.toLocaleString()}</div>
              </div>
              <button onClick={() => setPaymentMethod("paystack")} className="glass-card rounded-xl p-3 flex items-center gap-3 w-full text-left hover:bg-muted/10 transition-colors">
                <CreditCard className="h-5 w-5 text-primary" />
                <div><div className="font-bold text-xs">Card (Paystack)</div><div className="text-[9px] text-muted-foreground">Visa, Mastercard</div></div>
              </button>
              <button onClick={() => setPaymentMethod("mpesa")} className="glass-card rounded-xl p-3 flex items-center gap-3 w-full text-left hover:bg-muted/10 transition-colors">
                <Smartphone className="h-5 w-5 text-primary" />
                <div><div className="font-bold text-xs">M-Pesa</div><div className="text-[9px] text-muted-foreground">STK Push</div></div>
              </button>
            </div>
          )}

          {step === "confirm" && paymentMethod === "paystack" && selectedTier && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-primary">KES {selectedTier.price.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1">You'll be redirected to Paystack</p>
              </div>
              <Button onClick={processPaystack} disabled={subscribing} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs rounded-lg">
                {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Proceed
              </Button>
            </div>
          )}

          {step === "confirm" && paymentMethod === "mpesa" && selectedTier && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-primary">KES {selectedTier.price.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider">M-Pesa Number</Label>
                <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="254712345678" className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
              </div>
              <Button onClick={processMpesa} disabled={subscribing || !mpesaPhone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs rounded-lg">
                {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Send STK Push
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ========== DESKTOP ========== */
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-8">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {step === "plans" ? "Back to Earnings" : "Back"}
          </button>

          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {step === "plans" ? "Choose a Plan" : step === "payment" ? "Payment Method" : "Confirm Payment"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Current plan: <span className={`font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
            </p>
          </div>

          {step === "plans" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SUB_TIERS.filter(t => t.id !== "free").map((tier) => {
                const isCurrent = currentPlan === tier.dbValue;
                return (
                  <div key={tier.id} className={`glass-card rounded-2xl p-6 flex flex-col relative ${tier.id === "gold" ? "border-primary/40 ring-1 ring-primary/20" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
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

          {step === "payment" && selectedTier && (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-2xl mb-1">{selectedTier.icon}</div>
                <div className={`text-sm font-bold ${selectedTier.color}`}>{selectedTier.name}</div>
                <div className="text-3xl font-bold font-mono text-primary mt-2">KES {selectedTier.price.toLocaleString()}</div>
              </div>
              <button onClick={() => setPaymentMethod("paystack")} className="glass-card rounded-xl p-5 flex items-center gap-4 w-full text-left hover:bg-muted/10 transition-colors">
                <CreditCard className="h-6 w-6 text-primary" />
                <div><div className="font-bold text-sm">Card (Paystack)</div><div className="text-xs text-muted-foreground">Visa, Mastercard</div></div>
              </button>
              <button onClick={() => setPaymentMethod("mpesa")} className="glass-card rounded-xl p-5 flex items-center gap-4 w-full text-left hover:bg-muted/10 transition-colors">
                <Smartphone className="h-6 w-6 text-primary" />
                <div><div className="font-bold text-sm">M-Pesa</div><div className="text-xs text-muted-foreground">STK Push</div></div>
              </button>
            </div>
          )}

          {step === "confirm" && paymentMethod === "paystack" && selectedTier && (
            <div className="max-w-sm mx-auto glass-card rounded-2xl p-8 space-y-5">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-primary">KES {selectedTier.price.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">You'll be redirected to Paystack to complete payment</p>
              </div>
              <Button onClick={processPaystack} disabled={subscribing} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 text-sm rounded-xl">
                {subscribing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Proceed to Payment
              </Button>
            </div>
          )}

          {step === "confirm" && paymentMethod === "mpesa" && selectedTier && (
            <div className="max-w-sm mx-auto glass-card rounded-2xl p-8 space-y-5">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-primary">KES {selectedTier.price.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">M-Pesa Phone Number</Label>
                <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="254712345678" className="h-12 bg-secondary/30 border-border/40 rounded-xl text-sm" />
              </div>
              <Button onClick={processMpesa} disabled={subscribing || !mpesaPhone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 text-sm rounded-xl">
                {subscribing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Send STK Push
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Subscribe;
