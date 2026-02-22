import { Link } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    icon: "🆓",
    price: "0",
    period: "forever",
    features: ["3 answers/day", "5 questions/month", "15% platform fee", "KES 500 max withdrawal"],
    cta: "Sign Up Free",
    highlight: false,
    color: "text-muted-foreground",
  },
  {
    name: "Bronze",
    icon: "🥉",
    price: "499",
    period: "/mo",
    features: ["10 answers/day", "15 questions/month", "12% platform fee", "KES 5,000 max withdrawal"],
    cta: "Go Bronze",
    highlight: false,
    color: "text-[hsl(30,60%,50%)]",
  },
  {
    name: "Silver",
    icon: "🥈",
    price: "999",
    period: "/mo",
    features: ["25 answers/day", "Unlimited questions", "10% platform fee", "KES 25,000 max withdrawal", "Priority support"],
    cta: "Go Silver",
    highlight: false,
    color: "text-[hsl(210,10%,70%)]",
  },
  {
    name: "Gold",
    icon: "🥇",
    price: "2,499",
    period: "/mo",
    features: ["50 answers/day", "Unlimited questions", "8% platform fee", "KES 100,000 max withdrawal", "Verified badge", "1.5x CP boost"],
    cta: "Go Gold",
    highlight: true,
    color: "text-primary",
  },
  {
    name: "Platinum",
    icon: "💎",
    price: "4,999",
    period: "/mo",
    features: ["Unlimited answers", "Unlimited questions", "5% platform fee", "Unlimited withdrawal", "VIP badge", "2x CP boost", "Featured profile"],
    cta: "Go Platinum",
    highlight: false,
    color: "text-info",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 sm:py-24 relative border-t border-border/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Subscription Tiers</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Choose Your <span className="text-gradient-gold">Tier</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm">
            Higher tier = lower fees, bigger limits, more earnings. The house takes less, you keep more.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`glass-card rounded-2xl p-4 flex flex-col relative ${
                p.highlight ? "gradient-border glow-gold lg:scale-105 col-span-2 lg:col-span-1" : ""
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-0.5 rounded-full whitespace-nowrap">
                  Best Value
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{p.icon}</span>
                <h3 className={`text-sm font-bold ${p.color}`}>{p.name}</h3>
              </div>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-[9px] text-muted-foreground">KES</span>
                <span className="text-xl font-extrabold font-mono">{p.price}</span>
                <span className="text-[10px] text-muted-foreground">{p.period}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button
                  size="sm"
                  className={`w-full font-semibold rounded-xl h-8 text-xs ${
                    p.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
