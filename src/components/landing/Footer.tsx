import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/30 py-12">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-gradient-gold">SOLVR</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SOLVR. Where Smart Earns. Built for Kenya, designed for Africa.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
