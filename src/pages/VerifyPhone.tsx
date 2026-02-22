import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Smartphone, ArrowLeft, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyPhone = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const sendVerificationCode = async () => {
    if (!phoneToVerify || phoneToVerify.length < 10) { toast.error("Enter a valid phone number"); return; }
    setSendingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { type: "phone_verification", phone_number: phoneToVerify, user_id: user!.id },
      });
      if (error) throw error;
      setCodeSent(true);
      toast.success("Verification code sent to your phone!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally { setSendingCode(false); }
  };

  const verifyCode = async () => {
    if (verificationCode.length < 4) { toast.error("Enter the full code"); return; }
    setVerifyingCode(true);
    try {
      const { error } = await supabase.from("profiles").update({ phone_number: phoneToVerify }).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Phone number verified!");
      navigate("/dashboard/profile");
    } catch (err: any) { toast.error(err.message || "Verification failed"); }
    finally { setVerifyingCode(false); }
  };

  return (
    <DashboardLayout>
      {isMobile ? (
        /* ========== MOBILE ========== */
        <div className="space-y-4 animate-fade-in pb-8">
          <button onClick={() => navigate("/dashboard/profile")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="glass-card rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold">Verify Phone</h1>
                <p className="text-[10px] text-muted-foreground">Confirm your number for M-Pesa</p>
              </div>
            </div>

            {!codeSent ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Phone Number</Label>
                  <Input
                    value={phoneToVerify}
                    onChange={(e) => setPhoneToVerify(e.target.value)}
                    placeholder="254712345678"
                    className="h-9 text-xs bg-secondary/30 border-border/40 rounded-lg"
                  />
                  <p className="text-[9px] text-muted-foreground">International format (e.g. 254712345678)</p>
                </div>
                <Button onClick={sendVerificationCode} disabled={sendingCode} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-semibold rounded-lg">
                  {sendingCode && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Send Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to <span className="font-mono font-bold text-foreground">{phoneToVerify}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verifyCode} disabled={verifyingCode || verificationCode.length < 6} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-semibold rounded-lg">
                  {verifyingCode && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Verify
                </Button>
                <button onClick={() => { setCodeSent(false); setVerificationCode(""); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                  ← Change number
                </button>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="glass-card rounded-xl p-3 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your phone number is required for M-Pesa withdrawals and account security. We never share your number.
            </p>
          </div>
        </div>
      ) : (
        /* ========== DESKTOP ========== */
        <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-8">
          <button onClick={() => navigate("/dashboard/profile")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </button>

          <div className="glass-card rounded-2xl p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Verify Phone Number</h1>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">We'll send a verification code to confirm your number for M-Pesa payouts</p>
            </div>

            {!codeSent ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Phone Number</Label>
                  <Input
                    value={phoneToVerify}
                    onChange={(e) => setPhoneToVerify(e.target.value)}
                    placeholder="254712345678"
                    className="h-12 bg-secondary/30 border-border/40 rounded-xl text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Enter your number in international format (e.g. 254712345678)</p>
                </div>
                <Button onClick={sendVerificationCode} disabled={sendingCode} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-semibold rounded-xl">
                  {sendingCode && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Send Verification Code
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code sent to <span className="font-mono font-bold text-foreground">{phoneToVerify}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verifyCode} disabled={verifyingCode || verificationCode.length < 6} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-semibold rounded-xl">
                  {verifyingCode && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Verify
                </Button>
                <button onClick={() => { setCodeSent(false); setVerificationCode(""); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                  ← Change number
                </button>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-1">Why verify?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your phone number is required for M-Pesa withdrawals and adds an extra layer of account security. We never share your number with third parties.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VerifyPhone;
