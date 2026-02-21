import { Brain, Vote, Wallet, Shield, Trophy, Globe } from "lucide-react";
import featuresIllustration from "@/assets/features-illustration.jpg";

const features = [
  {
    icon: Brain,
    title: "Post Real Problems",
    description: "Submit challenges across 5 categories — from policy debates to engineering puzzles. Quality over quantity.",
    color: "from-primary/20 to-primary/5 border-primary/30",
  },
  {
    icon: Vote,
    title: "Community Voting",
    description: "Subscribers vote on the best solutions. Expert votes carry 1.25x weight. Downvotes cost 1.5x.",
    color: "from-info/20 to-info/5 border-info/30",
  },
  {
    icon: Wallet,
    title: "Earn Real Money",
    description: "45% of subscription revenue goes to the Creator Pool. Top answers earn up to KES 2,000 per question.",
    color: "from-success/20 to-success/5 border-success/30",
  },
  {
    icon: Trophy,
    title: "Rank Up",
    description: "From Newcomer to Grand Master — climb 6 ranks with Contribution Points. Higher ranks earn vote weight bonuses.",
    color: "from-primary/20 to-primary/5 border-primary/30",
  },
  {
    icon: Shield,
    title: "Anti-Gaming",
    description: "Vote rings detected via IP clustering. Plagiarism checks on every submission. Fair play guaranteed.",
    color: "from-destructive/15 to-destructive/5 border-destructive/20",
  },
  {
    icon: Globe,
    title: "Sponsored Challenges",
    description: "NGOs, corporations, and governments post sponsored challenges with prize pools up to KES 100,000+.",
    color: "from-info/20 to-info/5 border-info/30",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 relative">
      <div className="container px-4 sm:px-6">
        {/* Header with illustration */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-12 sm:mb-16">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Platform Features</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Built for <span className="text-gradient-gold">Serious Problem Solvers</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto lg:mx-0">
              Every feature is designed to reward quality thinking and create a fair, gamified ecosystem.
            </p>
          </div>
          <div className="w-full max-w-xs lg:max-w-sm shrink-0">
            <div className="relative rounded-2xl overflow-hidden glow-gold">
              <img
                src={featuresIllustration}
                alt="Knowledge and problem solving"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass-card glass-card-hover rounded-2xl p-5 sm:p-6 space-y-4 animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} border`}>
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
