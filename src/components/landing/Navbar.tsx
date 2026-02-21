import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient-gold">SOLVR</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Get Started</Button>
          </Link>
        </div>

        <button className="md:hidden text-muted-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-3 animate-fade-in">
          <a href="#features" className="block text-sm text-muted-foreground py-2">Features</a>
          <a href="#how-it-works" className="block text-sm text-muted-foreground py-2">How It Works</a>
          <a href="#pricing" className="block text-sm text-muted-foreground py-2">Pricing</a>
          <div className="pt-3 space-y-2 border-t border-border/40">
            <Link to="/login"><Button variant="ghost" className="w-full">Log In</Button></Link>
            <Link to="/signup"><Button className="w-full bg-primary text-primary-foreground">Get Started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
