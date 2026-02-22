import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import solunyLogo from "@/assets/soluny-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("Check your email for the reset link!"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-block mb-4">
            <img src={solunyLogo} alt="Soluny" className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <Mail className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground">We sent a password reset link to <span className="font-semibold text-foreground">{email}</span></p>
            <Link to="/login">
              <Button variant="outline" className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-background/50 border-border/60 rounded-xl" />
            </div>
            <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Send Reset Link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-semibold flex items-center gap-1 justify-center">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
