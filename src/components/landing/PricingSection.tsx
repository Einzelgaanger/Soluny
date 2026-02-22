import { Link } from "react-router-dom";
import { Check, ShieldCheck, Zap, Activity, Cpu, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const plans = [
  {
    name: "STARTER",
    icon: <Cpu className="h-5 w-5" />,
    price: "0",
    period: "FOREVER",
    features: ["3 Daily Solutions", "5 Monthly Objectives", "15% Platform Overhead", "KES 500 Max Weekly Withdrawal"],
    cta: "GET STARTED",
    highlight: false,
    color: "text-muted-foreground",
  },
  {
    name: "PROFESSIONAL",
    icon: <Medal className="h-5 w-5 text-[#CD7F32]" />,
    price: "499",
    period: "/MO",
    features: ["10 Daily Solutions", "15 Monthly Objectives", "12% Platform Overhead", "KES 5K Max Weekly Withdrawal"],
    cta: "UPGRADE",
    highlight: false,
    color: "text-[#CD7F32]",
  },
  {
    name: "ADVANCED",
    icon: <Medal className="h-5 w-5 text-slate-300" />,
    price: "999",
    period: "/MO",
    features: ["25 Daily Solutions", "Unlimited Objectives", "10% Platform Overhead", "KES 25K Max Weekly Withdrawal", "Priority Support"],
    cta: "GO PRO",
    highlight: false,
    color: "text-slate-300",
  },
  {
    name: "ELITE",
    icon: <Medal className="h-5 w-5 text-primary" />,
    price: "2,499",
    period: "/MO",
    features: ["50 Daily Solutions", "Unlimited Objectives", "8% Platform Overhead", "KES 100K Max Weekly Withdrawal", "Elite Member Badge", "1.5x Reward Multiplier"],
    cta: "JOIN ELITE",
    highlight: true,
    color: "text-primary",
  },
  {
    name: "ULTIMATE",
    icon: <ShieldCheck className="h-5 w-5 text-info" />,
    price: "4,999",
    period: "/MO",
    features: ["Unlimited Solutions", "Unlimited Objectives", "5% Platform Overhead", "Unlimited Withdrawal", "Ultimate Member Badge", "2x Reward Multiplier", "Featured Contributor Profile"],
    cta: "CHOOSE ULTIMATE",
    highlight: false,
    color: "text-info",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 relative"
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-tactical opacity-20 whitespace-nowrap">
            PLATFORM_PLANS // SYS_PRICING_DEPLO // SECURE_LINK
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
          >
            <Activity className="h-3 w-3 animate-pulse" />
            <span className="text-[10px] font-orbitron font-black tracking-[0.3em]">SUBSCRIPTION_MODELS</span>
          </motion.div>
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black font-orbitron tracking-tighter mb-6 uppercase italic">
            CHOOSE YOUR <span className="text-gradient-gold">PLAN</span>
          </h2>
          <p className="text-2xl font-serif italic text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Maximize your <span className="text-foreground tracking-widest font-orbitron font-bold text-sm uppercase not-italic">performance</span>. Select the membership level that fits your goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className={`flex flex-col relative group h-full ${p.highlight ? "z-20 lg:scale-105" : "z-10"
                }`}
            >
              <div className={`flex flex-col p-6 rounded-2xl bg-background/40 backdrop-blur-xl border-2 h-full transition-all duration-300 hud-corners overflow-hidden relative ${p.highlight
                ? "border-primary glow-gold-strong shadow-primary/20"
                : "border-primary/10 group-hover:border-primary/40"
                }`}>

                {/* Background Scanning Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 -translate-y-full group-hover:animate-scanning-bar pointer-events-none" />

                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground font-orbitron font-black text-[10px] tracking-widest rounded-full z-20 shadow-lg">
                    RECOMMENDED
                  </div>
                )}

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 ${p.color}`}>
                      {p.icon}
                    </div>
                    <h3 className={`text-xs font-black font-orbitron tracking-tight ${p.color}`}>{p.name}</h3>
                  </div>
                  <span className="text-tactical scale-75 opacity-20">TIER_0{i + 1}</span>
                </div>

                <div className="flex items-baseline gap-1 mb-6 border-b border-primary/10 pb-6 relative z-10">
                  <span className="text-[10px] font-rajdhani font-bold text-muted-foreground mr-1">KES</span>
                  <span className="text-4xl font-orbitron font-black text-foreground">{p.price}</span>
                  <div className="flex flex-col ml-1">
                    <span className="text-[10px] font-rajdhani font-bold text-muted-foreground uppercase leading-none">{p.period}</span>
                    <span className="text-tactical scale-[0.6] opacity-30">FIXED_RATE</span>
                  </div>
                </div>

                <ul className="space-y-4 flex-1 mb-8 relative z-10">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 group/item">
                      <Zap className={`h-3 w-3 mt-1 shrink-0 ${p.highlight ? "text-primary animate-pulse" : "text-primary/30 group-hover/item:text-primary transition-colors"}`} />
                      <span className="text-[11px] font-rajdhani font-bold text-muted-foreground leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative z-10">
                  <Link to="/signup">
                    <Button
                      className={`w-full font-orbitron font-black text-[11px] tracking-widest rounded-xl py-6 border-2 transition-all duration-300 ${p.highlight
                        ? "bg-primary text-primary-foreground border-primary glow-gold hover:scale-105 active:scale-95"
                        : "bg-transparent text-foreground border-primary/20 hover:border-primary hover:bg-primary/10"
                        }`}
                    >
                      {p.cta}
                    </Button>
                  </Link>
                  <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-tactical opacity-40">SYSTEM_READY</span>
                    <span className="text-tactical opacity-40">#00{i + 1}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


export default PricingSection;
