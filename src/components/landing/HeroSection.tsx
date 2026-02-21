import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Where Smart Earns
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-slide-up">
            Solve Problems.{" "}
            <span className="text-gradient-gold">Earn Money.</span>
            <br />
            <span className="text-muted-foreground">Build Reputation.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1">
            SOLVR is the subscription-based community where your brainpower pays. 
            Post challenges, submit solutions, get voted — and earn real money from the creator pool.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 font-semibold glow-gold">
                Start Earning Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border/60 text-muted-foreground hover:text-foreground hover:border-border">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-8 animate-slide-up stagger-3">
            {[
              { icon: Users, label: "Active Solvers", value: "2,500+" },
              { icon: Coins, label: "Paid Out (KES)", value: "1.2M" },
              { icon: TrendingUp, label: "Questions Solved", value: "8,400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-xl sm:text-2xl font-bold font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
