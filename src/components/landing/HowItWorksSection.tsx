import { MessageSquarePlus, PenLine, ThumbsUp, Banknote, Swords, Trophy } from "lucide-react";

const steps = [
  {
    icon: MessageSquarePlus,
    title: "Post a Challenge",
    desc: "Any subscriber posts a real-world problem. Each question creates a prize pool from the community fund.",
    accent: "border-primary/40 shadow-[0_0_20px_rgba(245,189,65,0.1)]",
  },
  {
    icon: Swords,
    title: "One Shot, One Answer",
    desc: "Submit your best solution. You only get one shot per question — no edits, no second chances. Make it count.",
    accent: "border-destructive/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  },
  {
    icon: ThumbsUp,
    title: "Community Votes",
    desc: "Paying members vote. Expert votes weigh 1.25x. Downvotes cost 1.5x. The best answer rises to the top.",
    accent: "border-success/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
  },
  {
    icon: Trophy,
    title: "Win the Prize Pool",
    desc: "1st place gets 50%, 2nd 30%, 3rd 20%. Earn CP, rank up, unlock multipliers. Withdraw via M-Pesa.",
    accent: "border-primary/40 shadow-[0_0_20px_rgba(245,189,65,0.1)]",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 relative border-t border-border/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">How It Works</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Four Steps to <span className="text-gradient-gold">Victory</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
            High stakes. One chance. Real rewards.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4 sm:gap-6 mb-8 sm:mb-12 last:mb-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex flex-col items-center">
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-card border-2 ${s.accent}`}>
                  <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-2" />
                )}
              </div>
              <div className="pt-1 sm:pt-2 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-primary font-mono">STEP {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
