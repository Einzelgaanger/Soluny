import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins, Sparkles, Trophy, Flame, Swords, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import mouseImg from "@/assets/ranks/mouse.png";
import foxImg from "@/assets/ranks/fox.png";
import wolfImg from "@/assets/ranks/wolf.png";
import eagleImg from "@/assets/ranks/eagle.png";
import lionImg from "@/assets/ranks/lion.png";
import dragonImg from "@/assets/ranks/dragon.png";

const ranks = [
  { name: "Mouse", img: mouseImg, cp: "0+" },
  { name: "Fox", img: foxImg, cp: "100+" },
  { name: "Wolf", img: wolfImg, cp: "500+" },
  { name: "Eagle", img: eagleImg, cp: "1,500+" },
  { name: "Lion", img: lionImg, cp: "5,000+" },
  { name: "Dragon", img: dragonImg, cp: "15,000+" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20 blur-xl"
            style={{
              width: `${30 + i * 15}px`,
              height: `${30 + i * 15}px`,
              top: `${10 + i * 12}%`,
              left: `${5 + i * 13}%`,
              animation: `float ${3 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold animate-fade-in backdrop-blur-sm">
            <Flame className="h-3.5 w-3.5" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            KES 1.2M+ Paid Out — Join the Arena
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] animate-slide-up">
            Answer. Compete.{" "}
            <span className="text-gradient-gold">Get Paid.</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1">
            Soluny is the <strong className="text-foreground">competitive knowledge arena</strong> where your brainpower
            earns real money. Post challenges, submit solutions, get voted by the community — and
            climb the ranks from <span className="text-info">Mouse 🐭</span> to <span className="text-destructive">Dragon 🐉</span>.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up stagger-2">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-8 py-6 font-bold glow-gold rounded-xl">
                Enter the Arena <Swords className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#ranks">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-6 border-border/60 text-muted-foreground hover:text-foreground rounded-xl">
                View Ranks <Trophy className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-6 animate-slide-up stagger-3">
            {[
              { icon: Users, label: "Active Solvers", value: "2,500+" },
              { icon: Coins, label: "Prize Pools", value: "KES 1.2M" },
              { icon: TrendingUp, label: "Problems Solved", value: "8,400" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-3 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <div className="text-base sm:text-xl font-bold font-mono">{s.value}</div>
                <div className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rank parade — the gamification hook */}
          <div id="ranks" className="pt-8 animate-slide-up stagger-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4">Rank Up — Unlock Rewards</p>
            <div className="flex items-end justify-center gap-2 sm:gap-4">
              {ranks.map((r, i) => (
                <div key={r.name} className="flex flex-col items-center gap-1 group">
                  <div className={`relative transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1`}>
                    <img
                      src={r.img}
                      alt={r.name}
                      className="rounded-xl object-cover border-2 border-border/40 group-hover:border-primary/50 transition-colors"
                      style={{
                        width: `${36 + i * 6}px`,
                        height: `${36 + i * 6}px`,
                      }}
                    />
                    {i === ranks.length - 1 && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{r.name}</span>
                  <span className="text-[7px] font-mono text-muted-foreground">{r.cp} CP</span>
                </div>
              ))}
            </div>
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
