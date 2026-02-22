import { Swords, Vote, Flame, Trophy, Shield, Activity, Zap, Cpu, Scan, Box } from "lucide-react";
import dragonImg from "@/assets/ranks/dragon.png";
import { motion } from "framer-motion";

const features = [
  {
    icon: Swords,
    title: "SKILL CHALLENGES",
    description: "Provide accurate answers to specific questions. Precision is key. The community validates the best solutions in our high-reward arena.",
    color: "from-destructive/20 to-destructive/5 border-destructive/30",
    badge: "ALPHA",
    gridSpan: "md:col-span-2 md:row-span-2",
  },
  {
    icon: Vote,
    title: "VERIFIED SOLUTIONS",
    description: "Our community of experts validates solutions. Experienced contributors have higher weight in ensuring accuracy.",
    color: "from-info/20 to-info/5 border-info/30",
    badge: "NODE",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Flame,
    title: "SECURE PAYOUTS",
    description: "Every task has a verified reward pool. Top-performing contributors receive fair and transparent payouts.",
    color: "from-primary/20 to-primary/5 border-primary/30",
    badge: "LIQUID",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Trophy,
    title: "ACHIEVEMENT LEVELS",
    description: "Advance through professional tiers. Accumulate performance standing and unlock higher reward multipliers.",
    color: "from-success/20 to-success/5 border-success/30",
    badge: "ELITE",
    gridSpan: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Shield,
    title: "DATA INTEGRITY",
    description: "Advanced verification systems ensure honest contributions. Real-time protocols maintain platform fairness.",
    color: "from-destructive/15 to-destructive/5 border-destructive/20",
    badge: "SECURE",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Activity,
    title: "PRO SUBSCRIPTION",
    description: "Subscription-based tier advancement. Reduced platform overhead and amplified participation limits.",
    color: "from-info/20 to-info/5 border-info/30",
    badge: "PASS",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 sm:py-32 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header with Tactical Wipe */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20 relative"
        >
          <div className="absolute -top-12 left-0 text-tactical opacity-20 whitespace-nowrap">
            SEC_SCAN // 40.7128° N, 74.0060° W // NODE_ALPHA_01
          </div>
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-primary mb-6"
            >
              <Box className="h-5 w-5" />
              <span className="font-orbitron font-black tracking-[0.4em] text-xs uppercase text-glow-gold">CORE_FEATURES</span>
            </motion.div>
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black font-orbitron tracking-tighter leading-[0.8] mb-8 uppercase italic">
              SMART <span className="text-gradient-gold block not-italic font-serif font-light lowercase -mt-4 ml-8">infrastructure</span>
            </h2>
            <p className="text-xl sm:text-2xl font-rajdhani font-medium text-muted-foreground leading-relaxed max-w-xl">
              Built for performance. Our <span className="text-foreground italic font-serif">reward systems</span> ensure every accurate contribution is accounted for and rewarded.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 p-8 glass-card rounded-3xl border-primary/20 hud-corners bg-primary/5 group/apex"
          >
            <div className="relative group">
              <div className="absolute -inset-6 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={dragonImg} alt="Dragon Standing" className="h-24 w-24 relative z-10 drop-shadow-[0_0_20px_rgba(245,189,65,0.5)]" />
              <div className="absolute -top-2 -right-2 text-tactical opacity-40 group-hover/apex:opacity-100 transition-opacity">RANK_V6</div>
            </div>
            <div>
              <div className="font-orbitron font-black text-2xl text-primary leading-none mb-2">ELITE_ACCESS</div>
              <div className="font-rajdhani font-bold text-sm text-muted-foreground uppercase tracking-widest italic flex items-center gap-2">
                <span>Top Tier Performance</span>
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[200px] gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group relative ${f.gridSpan}`}
            >
              <div className="glass-card rounded-3xl p-8 h-full flex flex-col justify-between border-white/5 hover:border-primary/40 transition-all duration-500 hud-corners overflow-hidden relative">
                {/* Background Scanning Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 -translate-y-full group-hover:animate-scanning-bar pointer-events-none" />

                <div className="flex justify-between items-start w-full relative z-10">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${f.color} border border-white/10 group-hover:scale-110 transition-transform duration-500 relative`}>
                    <f.icon className="h-8 w-8 text-foreground" />
                    <div className="absolute -top-1 -left-1 text-tactical scale-[0.6] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">SYS_0{i}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 rounded-full text-[10px] font-orbitron font-black bg-primary/10 text-primary border border-primary/20">
                      {f.badge}
                    </span>
                    <span className="text-tactical opacity-20 scale-75 origin-right whitespace-nowrap">COORD_0{i}_SET</span>
                  </div>
                </div>

                <div className="space-y-3 relative z-10 mt-4">
                  <h3 className="text-2xl font-black font-orbitron group-hover:text-primary transition-colors tracking-tight uppercase">{f.title}</h3>
                  <p className="text-muted-foreground font-rajdhani font-semibold text-lg leading-tight tracking-wide">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-[10px] font-orbitron font-bold text-primary/40 group-hover:text-primary transition-colors">
                    <Scan className="h-3 w-3" />
                    <span className="whitespace-nowrap">FEATURE_ACTIVE // 0{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-tactical group-hover:opacity-100 transition-opacity hidden sm:block">LATENCY: 0.00{i + 1}MS</span>
                    <div className="h-1 w-8 bg-primary/20 rounded-full overflow-hidden">
                      <motion.div animate={{ x: [-100, 100] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full w-1/2 bg-primary" />
                    </div>
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

export default FeaturesSection;
