import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/30 py-12 sm:py-16">
    <div className="container px-4 sm:px-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-gradient-gold">SOLVR</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            The subscription-based knowledge marketplace where your brainpower pays. Built for Kenya, designed for Africa.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Platform</h4>
          <ul className="space-y-2.5">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Community</h4>
          <ul className="space-y-2.5">
            {["Leaderboard", "Sponsored Challenges", "Blog"].map((item) => (
              <li key={item}>
                <span className="text-sm text-muted-foreground/60">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
          <ul className="space-y-2.5">
            {["Terms of Service", "Privacy Policy", "Content Policy"].map((item) => (
              <li key={item}>
                <span className="text-sm text-muted-foreground/60">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SOLVR. Where Smart Earns.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Log In
          </Link>
          <Link to="/signup" className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
