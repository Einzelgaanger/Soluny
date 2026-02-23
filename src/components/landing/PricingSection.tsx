import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import pricingBg from "@/assets/pricing-bg.jpg";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    features: ["3 answers per day", "5 questions per month", "15% platform fee", "KES 500 max weekly withdrawal"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Bronze",
    price: "499",
    period: "/mo",
    features: ["10 answers per day", "15 questions per month", "12% platform fee", "KES 5K max weekly withdrawal"],
    cta: "Upgrade",
    highlight: false,
  },
  {
    name: "Silver",
    price: "999",
    period: "/mo",
    features: ["25 answers per day", "Unlimited questions", "10% platform fee", "KES 25K max weekly withdrawal", "Priority support"],
    cta: "Go Silver",
    highlight: false,
  },
  {
    name: "Gold",
    price: "2,499",
    period: "/mo",
    features: ["50 answers per day", "Unlimited questions", "8% platform fee", "KES 100K max weekly withdrawal", "Gold badge", "1.5x reward multiplier"],
    cta: "Go Gold",
    highlight: true,
  },
  {
    name: "Platinum",
    price: "4,999",
    period: "/mo",
    features: ["Unlimited answers", "Unlimited questions", "5% platform fee", "Unlimited withdrawal", "Platinum badge", "2x reward multiplier", "Featured profile"],
    cta: "Go Platinum",
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={pricingBg} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Pricing</span>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4">
            Choose Your <span className="text-primary">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Start free and upgrade as you grow. Higher plans mean lower fees, more answers, and bigger withdrawals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={`flex flex-col relative group ${p.highlight ? "z-20 lg:scale-105" : "z-10"}`}
            >
              <div className={`flex flex-col p-6 rounded-2xl bg-background/60 backdrop-blur-xl border-2 h-full transition-all duration-300 ${
                p.highlight
                  ? "border-primary glow-gold shadow-primary/20"
                  : "border-border/30 group-hover:border-primary/30"
              }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground font-bold text-[10px] tracking-wider rounded-full z-20 shadow-lg uppercase">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className={`text-sm font-bold ${p.highlight ? "text-primary" : "text-foreground"}`}>{p.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-6 border-b border-border/20 pb-6">
                  <span className="text-xs text-muted-foreground mr-1">KES</span>
                  <span className="text-4xl font-black text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup">
                  <Button
                    className={`w-full font-bold text-sm rounded-xl py-5 transition-all ${
                      p.highlight
                        ? "bg-primary text-primary-foreground border border-primary glow-gold hover:scale-105 active:scale-95"
                        : "bg-transparent text-foreground border border-border/40 hover:border-primary hover:bg-primary/10"
                    }`}
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
