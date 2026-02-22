import { Brain, Vote, Wallet, Shield, Trophy, Globe, Flame, Swords, Target, Zap } from "lucide-react";
import mouseImg from "@/assets/ranks/mouse.png";
import dragonImg from "@/assets/ranks/dragon.png";

const features = [
  {
    icon: Swords,
    title: "Competitive Arena",
    description: "One answer per question. Make it count. The community decides who wins the prize pool.",
    color: "from-destructive/20 to-destructive/5 border-destructive/30",
  },
  {
    icon: Vote,
    title: "Community Voting",
    description: "Subscribers vote on the best solutions. Expert votes carry 1.25x weight. Fair play guaranteed.",
    color: "from-info/20 to-info/5 border-info/30",
  },
  {
    icon: Flame,
    title: "Prize Pools",
    description: "Every question has a prize pool. Top 3 answers split it: 50% / 30% / 20%. Real money, real stakes.",
    color: "from-primary/20 to-primary/5 border-primary/30",
  },
  {
    icon: Trophy,
    title: "Rank System",
    description: "6 ranks from Mouse 🐭 to Dragon 🐉. Earn CP, level up, unlock earning multipliers up to 3x.",
    color: "from-success/20 to-success/5 border-success/30",
  },
  {
    icon: Shield,
    title: "Anti-Gaming Engine",
    description: "Vote rings detected via IP clustering. Plagiarism checks on every submission. One answer rule enforced.",
    color: "from-destructive/15 to-destructive/5 border-destructive/20",
  },
  {
    icon: Target,
    title: "Tiered Subscriptions",
    description: "Bronze to Platinum tiers. Lower fees, higher limits, bigger withdrawals. The higher your tier, the more you keep.",
    color: "from-info/20 to-info/5 border-info/30",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 relative">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-12 sm:mb-16">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Why Soluny</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              A <span className="text-gradient-gold">Competitive Arena</span> for Smart Minds
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto lg:mx-0">
              Think you've got what it takes? Every feature is designed to reward quality thinking and create a fair, high-stakes ecosystem.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <img src={mouseImg} alt="Mouse rank" className="h-16 w-16 rounded-xl object-cover border-2 border-border/40 opacity-50" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-muted-foreground">Start</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-0.5 w-12 bg-gradient-to-r from-border to-primary/50" />
              <Zap className="h-4 w-4 text-primary" />
              <div className="h-0.5 w-12 bg-gradient-to-r from-primary/50 to-border" />
            </div>
            <div className="relative">
              <img src={dragonImg} alt="Dragon rank" className="h-20 w-20 rounded-xl object-cover border-2 border-destructive/40 glow-gold" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary">Legend</div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass-card glass-card-hover rounded-2xl p-5 space-y-3 animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} border`}>
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
