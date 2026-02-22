import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, Send } from "lucide-react";
import solunyLogo from "@/assets/soluny-logo.png";
import authBg from "@/assets/auth-bg-login.jpg";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const ForgotPassword = () => {
  const isMobile = useIsMobile();
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

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center space-y-3">
        <Link to="/" className="inline-block mb-2">
          <img src={solunyLogo} alt="Soluny" className="h-10 w-auto mx-auto" />
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black font-orbitron tracking-tighter uppercase">
          Forgot <span className="text-gradient-gold">Password</span>
        </h1>
        <p className="text-muted-foreground text-sm">We'll send you a reset link</p>
      </div>

      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-sm text-muted-foreground">We sent a password reset link to <span className="font-bold text-foreground">{email}</span></p>
          <Link to="/login">
            <Button variant="outline" className="mt-2 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
            </Button>
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleReset} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 pl-10 bg-background/50 border-border/60 rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl glow-gold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline font-bold inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Login
        </Link>
      </p>
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <div className="absolute inset-0 z-0">
          <img src={authBg} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      </div>
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        {content}
      </div>
    </div>
  );
};

export default ForgotPassword;
