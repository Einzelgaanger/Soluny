import { MessageSquarePlus, PenLine, ThumbsUp, Banknote } from "lucide-react";

const steps = [
  {
    icon: MessageSquarePlus,
    title: "Post a Challenge",
    desc: "Any subscriber can post a real-world problem. Costs 5 CP to prevent spam.",
    accent: "border-primary/40 shadow-[0_0_20px_rgba(245,189,65,0.1)]",
  },
  {
    icon: PenLine,
    title: "Submit Solutions",
    desc: "Write a thoughtful answer (100+ chars). You get one shot per question — make it count.",
    accent: "border-info/40 shadow-[0_0_20px_rgba(56,189,248,0.1)]",
  },
  {
    icon: ThumbsUp,
    title: "Community Votes",
    desc: "Paying members vote. Voting closes after 24h–7 days. Top answers rise to the top.",
    accent: "border-success/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
  },
  {
    icon: Banknote,
    title: "Earn from the Pool",
    desc: "1st place gets 50%, 2nd 30%, 3rd 20%. Withdraw via M-Pesa instantly.",
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
            Four Steps to <span className="text-gradient-gold">Smart Earnings</span>
          </h2>
        </div>

        {/* Timeline layout */}
        <div className="max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4 sm:gap-6 mb-8 sm:mb-12 last:mb-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-card border-2 ${s.accent}`}>
                  <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-2" />
                )}
              </div>
              {/* Content */}
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
