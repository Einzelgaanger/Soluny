import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import solunyLogo from "@/assets/soluny-logo.png";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
        ? "bg-background/80 backdrop-blur-xl border-primary/20 py-2"
        : "bg-transparent border-transparent py-4"
        }`}
    >
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group relative">
          <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <img src={solunyLogo} alt="Soluny" className="h-8 sm:h-10 w-auto relative z-10" />
        </Link>

        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-orbitron font-medium text-muted-foreground hover:text-primary tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1 group relative"
            >
              <span className="relative z-10">{link.name}</span>
              <motion.div
                className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"
                layoutId="nav-underline"
              />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-rajdhani font-bold text-muted-foreground hover:text-primary tracking-widest uppercase text-xs">
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-orbitron font-bold rounded-xl px-6 glow-gold-strong hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-primary/50">
              SIGN UP <Zap className="h-3 w-3 fill-current" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-primary">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="text-muted-foreground p-2 hover:text-primary transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-primary/20 bg-background/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="container px-6 py-8 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-lg font-orbitron font-bold text-muted-foreground py-2 border-b border-border/50 hover:text-primary hover:pl-2 transition-all"
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-6 flex flex-col gap-3">
                <Link to="/login" className="w-full" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl border-primary/20 font-rajdhani font-bold py-6">LOG IN</Button>
                </Link>
                <Link to="/signup" className="w-full" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground rounded-xl font-orbitron font-bold py-6 glow-gold">GET STARTED</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
