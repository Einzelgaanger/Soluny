import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Shield, Award, Flame, Zap, Target, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authIllustration from "@/assets/auth-illustration.jpg";
import solunyLogo from "@/assets/soluny-logo.png";
import { motion } from "framer-motion";

const Signup = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen flex bg-background font-rajdhani overflow-hidden relative">
      <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
      <div className="scanline" />

      {/* Left — Cinematic Sidebar */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden border-r border-primary/20">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2 }}
          src={authIllustration}
          alt="Soluny platform"
          className="absolute inset-0 w-full h-full object-cover grayscale blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-16 h-full">
          <Link to="/" className="flex items-center gap-3">
            <img src={solunyLogo} alt="Soluny" className="h-10 w-auto brightness-125" />
          </Link>

          <div className="space-y-8 max-w-sm">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tighter leading-none mb-4 uppercase">
                ACCOUNT <span className="text-gradient-gold block not-italic font-serif font-light lowercase mt-2">creation</span>
              </h2>
              <p className="text-2xl font-serif italic text-muted-foreground/80 leading-relaxed">
                Forge your digital identity and claim your <span className="text-foreground uppercase font-orbitron font-bold text-sm">professional tier</span>.
              </p>
            </motion.div>

            <div className="space-y-6 pt-8">
              {[
                { icon: Flame, label: "Ascension Path", value: "Mouse to Dragon" },
                { icon: Award, label: "Yield Potential", value: "Real KES Rewards" },
                { icon: Shield, label: "Fair Play", value: "Neural Audit V1" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (i * 0.1) }}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/5 border border-primary/20 group-hover:border-primary/50 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-orbitron font-black text-primary tracking-widest uppercase">{item.label}</div>
                    <div className="text-sm font-bold text-muted-foreground tracking-wide group-hover:text-foreground transition-all italic">{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-orbitron font-bold text-primary opacity-40 uppercase tracking-[0.5em]">
            Protocol // USER_ONBOARDING
          </div>
        </div>
      </div>

      {/* Right — Technical Form Node */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md py-12">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 animate-pulse">
              <img src={solunyLogo} alt="Soluny" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full mb-4"
            >
              <Target className="h-3 w-3" />
              <span className="text-[10px] font-orbitron font-black tracking-widest">SECURE_SIGNUP</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black font-orbitron tracking-tighter uppercase">
              JOIN THE <span className="text-gradient-gold">NETWORK</span>
            </h1>
            <p className="text-lg font-serif italic text-muted-foreground leading-snug">Begin your journey in the world's most advanced professional platform.</p>
          </div>

          <form onSubmit={handleSignup} className="glass-card rounded-3xl p-8 sm:p-10 space-y-6 border-white/5 hud-corners relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 -translate-y-full animate-scanline pointer-events-none" />

            <div className="space-y-2 group">
              <Label htmlFor="name" className="text-[10px] font-orbitron font-black uppercase tracking-[0.2em] text-primary/60 group-hover:text-primary transition-colors">Full Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-14 bg-background/40 border-primary/10 rounded-xl font-bold tracking-wider placeholder:opacity-30 focus:border-primary/40 focus:ring-primary/20 transition-all pl-12"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
              </div>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-[10px] font-orbitron font-black uppercase tracking-[0.2em] text-primary/60 group-hover:text-primary transition-colors">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 bg-background/40 border-primary/10 rounded-xl font-bold tracking-wider placeholder:opacity-30 focus:border-primary/40 focus:ring-primary/20 transition-all pl-12"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
              </div>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-[10px] font-orbitron font-black uppercase tracking-[0.2em] text-primary/60 group-hover:text-primary transition-colors">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 bg-background/40 border-primary/10 pr-12 rounded-xl font-bold tracking-wider placeholder:opacity-30 focus:border-primary/40 focus:ring-primary/20 transition-all pl-12"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-5 w-5 opacity-40" /> : <Eye className="h-5 w-5 opacity-40" />}
                </button>
              </div>
              <div className="flex gap-1.5 pt-2 px-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${password.length >= i * 3 ? password.length >= 12 ? "bg-success glow-green shadow-[0_0_10px_rgba(34,197,94,0.3)]" : password.length >= 8 ? "bg-primary glow-gold shadow-[0_0_10px_rgba(245,189,65,0.3)]" : "bg-warning shadow-[0_0_10px_rgba(234,179,8,0.2)]" : "bg-muted/30"}`} />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary font-black font-orbitron text-sm tracking-[0.2em] rounded-xl border-2 border-primary glow-gold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current" />}
              CREATE ACCOUNT
            </Button>
          </form>

          <p className="text-center text-sm font-bold text-muted-foreground mt-10">
            ALREADY HAVE AN ACCOUNT?{" "}
            <Link to="/login" className="text-primary hover:text-foreground underline underline-offset-4 decoration-primary/30 transition-all ml-2 uppercase font-orbitron text-[10px] tracking-widest">
              LOG IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
