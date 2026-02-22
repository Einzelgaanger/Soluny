import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Flame, Award, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authBg from "@/assets/auth-bg-signup.jpg";
import solunyLogo from "@/assets/soluny-logo.png";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Signup = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account! You'll be redirected to the dashboard after confirming.");
      navigate("/login");
    }
  };

  const pwStrength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : password.length >= 3 ? 1 : 0;
  const pwColor = pwStrength >= 4 ? "bg-success" : pwStrength >= 3 ? "bg-primary" : pwStrength >= 2 ? "bg-warning" : "bg-destructive";

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
          Create <span className="text-gradient-gold">Account</span>
        </h1>
        <p className="text-muted-foreground text-sm">Join the community where knowledge earns</p>
      </div>

      <form onSubmit={handleSignup} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
          <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 bg-background/50 border-border/60 rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-background/50 border-border/60 rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-background/50 border-border/60 pr-12 rounded-xl" />
            <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-1 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? pwColor : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl glow-gold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link>
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
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-5 max-w-sm">
            <img src={solunyLogo} alt="Soluny" className="h-10 w-auto brightness-125" />
            <h2 className="text-3xl font-black font-orbitron tracking-tighter leading-tight uppercase">
              Begin Your <span className="text-gradient-gold">Journey</span>
            </h2>
            <div className="space-y-3 pt-2">
              {[
                { icon: Flame, text: "Start as Newcomer, climb to Grand Master" },
                { icon: Award, text: "Earn real KES from community voting" },
                { icon: Shield, text: "Fair play guaranteed by anti-gaming" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        {formContent}
      </div>
    </div>
  );
};

export default Signup;
