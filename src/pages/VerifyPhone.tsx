import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Smartphone, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyPhone = () => {
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
      <div className="max-w-md mx-auto space-y-6 animate-fade-in py-4 lg:py-8">
        <button onClick={() => navigate("/dashboard/profile")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </button>

        <div className="glass-card rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold">Verify Phone Number</h1>
            <p className="text-sm text-muted-foreground">We'll send a verification code to confirm your number</p>
          </div>

          {!codeSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Phone Number</Label>
                <Input
                  value={phoneToVerify}
                  onChange={(e) => setPhoneToVerify(e.target.value)}
                  placeholder="254712345678"
                  className="h-11 bg-secondary/30 border-border/40 rounded-xl text-sm"
                />
                <p className="text-xs text-muted-foreground">Enter your number in international format (e.g. 254712345678)</p>
              </div>
              <Button onClick={sendVerificationCode} disabled={sendingCode} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold rounded-xl">
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
              <Button onClick={verifyCode} disabled={verifyingCode || verificationCode.length < 6} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold rounded-xl">
                {verifyingCode && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Verify
              </Button>
              <button onClick={() => { setCodeSent(false); setVerificationCode(""); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                ← Change number
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VerifyPhone;
