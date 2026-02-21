import { MessageSquarePlus, PenLine, ThumbsUp, Banknote } from "lucide-react";

const steps = [
  { icon: MessageSquarePlus, title: "Post a Challenge", desc: "Any subscriber can post a real-world problem. Costs 5 CP to prevent spam." },
  { icon: PenLine, title: "Submit Solutions", desc: "Write a thoughtful answer (100+ chars). You get one shot per question — make it count." },
  { icon: ThumbsUp, title: "Community Votes", desc: "Paying members vote. Voting closes after 24h–7 days. Top answers rise." },
  { icon: Banknote, title: "Earn from the Pool", desc: "1st place gets 45%, 2nd 25%, 3rd 15%. Withdraw via M-Pesa or bank transfer." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative border-t border-border/30">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Four Steps to <span className="text-gradient-gold">Smart Earnings</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center space-y-4 p-6">
              <div className="text-5xl font-extrabold text-primary/10 font-mono absolute top-2 right-4">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
