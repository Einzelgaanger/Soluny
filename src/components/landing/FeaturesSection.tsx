import { Brain, Vote, Wallet, Shield, Trophy, Globe } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Post Real Problems",
    description: "Submit challenges across 5 categories — from policy debates to engineering puzzles. Quality over quantity.",
  },
  {
    icon: Vote,
    title: "Community Voting",
    description: "Subscribers vote on the best solutions. Expert votes carry 1.25x weight. Downvotes cost 1.5x — bad answers are penalized.",
  },
  {
    icon: Wallet,
    title: "Earn Real Money",
    description: "45% of subscription revenue goes to the Creator Pool. Top answers earn up to KES 2,000 per question.",
  },
  {
    icon: Trophy,
    title: "Rank Up",
    description: "From Newcomer to Grand Master — climb the ranks with Contribution Points. Higher ranks earn vote weight bonuses.",
  },
  {
    icon: Shield,
    title: "Anti-Gaming",
    description: "Vote rings detected via IP clustering. Plagiarism checks on every submission. Monthly earnings capped at KES 10,000.",
  },
  {
    icon: Globe,
    title: "Sponsored Challenges",
    description: "NGOs, corporations, and governments post sponsored challenges with prize pools up to KES 100,000+.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Built for <span className="text-gradient-gold">Serious Problem Solvers</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass-card glass-card-hover rounded-xl p-6 space-y-4 animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
