import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20 blur-xl"
            style={{
              width: `${40 + i * 20}px`,
              height: `${40 + i * 20}px`,
              top: `${15 + i * 15}%`,
              left: `${10 + i * 15}%`,
              animation: `float ${4 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 py-16 sm:py-20 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs sm:text-sm font-medium animate-fade-in backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Where Smart Earns — Now Live
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-slide-up">
            Solve Problems.{" "}
            <span className="text-gradient-gold">Earn Money.</span>
            <br className="hidden sm:block" />
            <span className="text-muted-foreground"> Build Reputation.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1 px-4 sm:px-0">
            Soluny is the subscription-based community where your brainpower pays.
            Post challenges, submit solutions, get voted — and earn real money from the creator pool.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up stagger-2 px-4 sm:px-0">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 font-bold glow-gold rounded-xl"
              >
                Start Earning Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border/60 text-muted-foreground hover:text-foreground hover:border-border rounded-xl"
              >
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto pt-6 sm:pt-8 animate-slide-up stagger-3">
            {[
              { icon: Users, label: "Active Solvers", value: "2,500+" },
              { icon: Coins, label: "Paid Out (KES)", value: "1.2M" },
              { icon: TrendingUp, label: "Questions Solved", value: "8,400" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mx-auto mb-1" />
                <div className="text-lg sm:text-2xl font-bold font-mono">{s.value}</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.3; }
          to { transform: translateY(-30px) scale(1.1); opacity: 0.6; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
