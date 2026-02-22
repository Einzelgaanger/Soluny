import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Zap, Shield, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authBg from "@/assets/auth-bg-login.jpg";
import solunyLogo from "@/assets/soluny-logo.png";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Login = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const formContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center lg:text-left space-y-3">
        <Link to="/" className="inline-block mb-2">
          <img src={solunyLogo} alt="Soluny" className="h-10 w-auto" />
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black font-orbitron tracking-tighter uppercase">
          Welcome <span className="text-gradient-gold">Back</span>
        </h1>
        <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleLogin} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
          <div className="relative">
            <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 pl-10 bg-background/50 border-border/60 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 pl-10 pr-12 bg-background/50 border-border/60 rounded-xl" />
            <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">Forgot password?</Link>
        </div>

        <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl glow-gold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 fill-current" />}
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary hover:underline font-bold">Create one</Link>
      </p>
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <div className="absolute inset-0 z-0">
          <img src={authBg} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left image panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4 max-w-sm">
            <img src={solunyLogo} alt="Soluny" className="h-10 w-auto brightness-125" />
            <h2 className="text-3xl font-black font-orbitron tracking-tighter leading-tight uppercase">
              Secure <span className="text-gradient-gold">Portal</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Re-establish your connection to the network. Your knowledge empire awaits.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        {formContent}
      </div>
    </div>
  );
};

export default Login;
