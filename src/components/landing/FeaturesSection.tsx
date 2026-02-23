import { HelpCircle, ThumbsUp, Wallet, TrendingUp, ShieldCheck, Crown } from "lucide-react";
import dragonImg from "@/assets/ranks/dragon.png";
import featuresBg from "@/assets/features-bg.jpg";
import { motion } from "framer-motion";

const features = [
  {
    icon: HelpCircle,
    title: "Ask & Answer",
    description: "Post questions with a reward pool, or contribute your best answer. Every question is an opportunity to learn and earn.",
    color: "from-primary/20 to-primary/5 border-primary/30",
    gridSpan: "md:col-span-2 md:row-span-2",
  },
  {
    icon: ThumbsUp,
    title: "Community Voting",
    description: "The community votes on the best answers. Only answers with enough upvotes qualify for rewards — quality matters.",
    color: "from-info/20 to-info/5 border-info/30",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Wallet,
    title: "Real Earnings",
    description: "Top answers split the prize pool. Withdraw your earnings directly to M-Pesa — no gimmicks, real money.",
    color: "from-success/20 to-success/5 border-success/30",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: TrendingUp,
    title: "Climb the Ranks",
    description: "Build your reputation through consistent, quality contributions. Higher ranks unlock better withdrawal limits and reward multipliers.",
    color: "from-primary/20 to-primary/5 border-primary/30",
    gridSpan: "md:col-span-2 md:row-span-1",
  },
  {
    icon: ShieldCheck,
    title: "Fair & Transparent",
    description: "Anti-fraud systems ensure honest participation. Every vote is weighted, every reward is verifiable.",
    color: "from-destructive/15 to-destructive/5 border-destructive/20",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Crown,
    title: "Pro Membership",
    description: "Subscribe to unlock more daily answers, lower platform fees, and higher withdrawal limits.",
    color: "from-info/20 to-info/5 border-info/30",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={featuresBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
      </div>

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-16"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">How Soluny Works</span>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight mb-6">
              Your Knowledge <span className="text-primary">Has Value</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              We've built a system where sharing what you know is directly rewarded. Answer questions, get voted by the community, and earn real money.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-5 p-6 glass-card rounded-2xl border-primary/20 bg-primary/5"
          >
            <img src={dragonImg} alt="Top Rank" className="h-20 w-20 drop-shadow-[0_0_15px_rgba(245,189,65,0.4)]" />
            <div>
              <div className="font-black text-xl text-primary leading-none mb-1">Dragon Rank</div>
              <div className="text-sm text-muted-foreground font-medium">
                Top contributors earn <span className="text-foreground font-bold">KES 1.2M+</span>
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
              transition={{ delay: i * 0.08 }}
              className={`group relative ${f.gridSpan}`}
            >
              <div className="glass-card rounded-2xl p-7 h-full flex flex-col justify-between border-white/5 hover:border-primary/30 transition-all duration-300 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start w-full relative z-10">
                  <div className={`p-3.5 rounded-xl bg-gradient-to-br ${f.color} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="h-7 w-7 text-foreground" />
                  </div>
                </div>

                <div className="space-y-2 relative z-10 mt-4">
                  <h3 className="text-xl font-black group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {f.description}
                  </p>
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
