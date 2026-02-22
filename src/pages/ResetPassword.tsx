import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, KeyRound } from "lucide-react";
import solunyLogo from "@/assets/soluny-logo.png";
import authBg from "@/assets/auth-bg-signup.jpg";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const ResetPassword = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated! You can now sign in."); navigate("/login"); }
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
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-orbitron tracking-tighter uppercase">
          New <span className="text-gradient-gold">Password</span>
        </h1>
        <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 pl-10 bg-background/50 border-border/60 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="h-12 pl-10 bg-background/50 border-border/60 rounded-xl" />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl glow-gold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
          Update Password
        </Button>
      </form>
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

export default ResetPassword;
