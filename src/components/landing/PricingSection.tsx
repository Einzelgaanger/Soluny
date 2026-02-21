import { Link } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    features: ["View top 5 questions/month", "Truncated answers", "Browse categories"],
    cta: "Sign Up Free",
    highlight: false,
  },
  {
    name: "Subscriber",
    price: "150",
    period: "/month",
    features: [
      "Full access to all content",
      "Post questions & answers",
      "Vote on solutions",
      "Earn from Creator Pool",
      "Withdraw via M-Pesa",
      "Community rank progression",
    ],
    cta: "Start Earning",
    highlight: true,
  },
  {
    name: "Annual",
    price: "1,500",
    period: "/year",
    features: [
      "Everything in Subscriber",
      "2 months free",
      "Priority support",
      "Early access to Sponsored Challenges",
    ],
    cta: "Save 17%",
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative border-t border-border/30">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Invest in Your <span className="text-gradient-gold">Intellect</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Every shilling funds the Creator Pool. The more subscribers, the bigger the earnings.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`glass-card rounded-xl p-6 flex flex-col ${
                p.highlight ? "gradient-border glow-gold" : ""
              }`}
            >
              {p.highlight && (
                <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <Star className="h-3 w-3" /> Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">KES</span>
                <span className="text-4xl font-extrabold font-mono">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-6">
                <Button
                  className={`w-full font-semibold ${
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
