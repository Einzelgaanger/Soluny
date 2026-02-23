import { Link } from "react-router-dom";
import solunyLogo from "@/assets/soluny-logo.png";
import { Twitter, Github, MessageSquare } from "lucide-react";

const Footer = () => (
  <footer className="relative border-t border-border/30 bg-background py-16 overflow-hidden">
    <div className="container px-4 sm:px-6 relative z-10">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1 space-y-4">
          <img src={solunyLogo} alt="Soluny" className="h-10 w-auto" />
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            The platform where sharing knowledge earns you real rewards. Answer questions, help others, get paid.
          </p>
          <div className="flex items-center gap-3">
            <a href="#" className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
              <MessageSquare className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-sm font-bold text-foreground mb-6">Resources</h4>
          <ul className="space-y-3">
            {["Features", "How It Works", "Pricing", "Leaderboard"].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-foreground mb-6">Legal</h4>
          <ul className="space-y-3">
            {["Terms of Service", "Privacy Policy", "Content Policy"].map((item) => (
              <li key={item}>
                <span className="text-sm text-muted-foreground/60 cursor-pointer hover:text-muted-foreground transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:text-right">
          <h4 className="text-sm font-bold text-foreground mb-6">Platform</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 lg:justify-end">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              All systems online
            </div>
            <div>Uptime: 99.99%</div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Soluny. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
            Log In
          </Link>
          <Link to="/signup" className="text-xs text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 border border-primary/50 transition-all rounded-lg font-bold">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
