import { Link } from "react-router-dom";
import solunyLogo from "@/assets/soluny-logo.png";
import { Zap, Shield, Globe, Github, Twitter, MessageSquare } from "lucide-react";

const Footer = () => (
  <footer className="relative border-t border-primary/20 bg-background/80 backdrop-blur-md py-20 overflow-hidden">
    <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_15px_rgba(245,189,65,0.3)]" />

    <div className="container px-4 sm:px-6 relative z-10">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2">
            <img src={solunyLogo} alt="Soluny" className="h-10 w-auto brightness-125" />
          </div>
          <p className="font-serif italic text-xl text-muted-foreground/60 leading-relaxed max-w-xs">
            The advanced <span className="text-foreground tracking-widest font-orbitron font-bold text-xs uppercase not-italic">platform</span> for technical knowledge and professional growth.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/40 text-primary transition-all">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/40 text-primary transition-all">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/40 text-primary transition-all">
              <MessageSquare className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-orbitron font-black text-xs uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2">
            <Zap className="h-3 w-3" />
            RESOURCES
          </h4>
          <ul className="space-y-4">
            {["Features", "How It Works", "Pricing", "Leaderboard"].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="font-rajdhani font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group"
                >
                  <div className="h-1 w-0 group-hover:w-2 bg-primary transition-all rounded-full" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-orbitron font-black text-xs uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2">
            <Shield className="h-3 w-3" />
            LEGAL
          </h4>
          <ul className="space-y-4">
            {["Terms of Service", "Privacy Policy", "Content Policy", "Security Audit"].map((item) => (
              <li key={item}>
                <span className="font-rajdhani font-bold text-muted-foreground/60 hover:text-primary/60 cursor-pointer transition-colors block">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:text-right">
          <h4 className="font-orbitron font-black text-xs uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2 justify-end">
            <Globe className="h-3 w-3" />
            PLATFORM_STATUS
          </h4>
          <div className="space-y-4 font-rajdhani font-black">
            <div className="flex items-center gap-2 justify-end text-success">
              <span className="animate-pulse h-2 w-2 rounded-full bg-success" />
              SYSTEMS_ACTIVE
            </div>
            <div className="text-muted-foreground text-xs">
              UPTIME: 99.998%
            </div>
            <div className="text-muted-foreground text-xs uppercase">
              Latency: 14ms
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="font-rajdhani font-bold text-xs text-muted-foreground tracking-widest uppercase">
          © {new Date().getFullYear()} Soluny // SOLUNY_PLATFORM_V1.0
        </p>
        <div className="flex items-center gap-6">
          <Link to="/login" className="font-orbitron font-black text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-widest">
            LOGIN
          </Link>
          <Link to="/signup" className="font-orbitron font-black text-[10px] text-primary hover:text-primary-foreground hover:bg-primary px-6 py-2 border border-primary/50 transition-all rounded-lg tracking-widest">
            GET STARTED
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
