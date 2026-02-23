import { MessageSquarePlus, ThumbsUp, Swords, Trophy, Target, Cpu, Share2 } from "lucide-react";
import howitBg from "@/assets/howit-bg.jpg";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Target,
    title: "IDENTIFY_OPPORTUNITIES",
    desc: "Browse our active challenges posted by members. Every task has a verified reward pool established by the community.",
    accent: "border-primary/40 shadow-[0_0_20px_rgba(245,189,65,0.1)]",
    color: "text-primary"
  },
  {
    icon: Swords,
    title: "SUBMIT_SOLUTIONS",
    desc: "Provide your best answer through our secure interface. We value precision and accuracy — make sure your contribution is solid.",
    accent: "border-destructive/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
    color: "text-destructive"
  },
  {
    icon: Share2,
    title: "COMMUNITY_VERIFICATION",
    desc: "Our decentralized network of experts evaluates submissions. Weighted consensus ensures only the highest quality answers succeed.",
    accent: "border-info/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
    color: "text-info"
  },
  {
    icon: Trophy,
    title: "COLLECT_REWARDS",
    desc: "Receive your fair share of the reward pool upon successful verification. Build your professional standing and unlock superior yield multipliers.",
    accent: "border-success/40 shadow-[0_0_20px_rgba(245,189,65,0.1)]",
    color: "text-success"
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative border-y border-primary/10 overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img src={howitBg} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />

      <div className="container px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24 relative"
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-tactical opacity-20 whitespace-nowrap">
            PLATFORM_FLOW // SEQUENCE_0X // HUD_SYNC
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 text-primary mb-6"
          >
            <Cpu className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-orbitron font-black uppercase tracking-[0.5em]">OPERATIONAL_PROCESS</span>
          </motion.div>
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black font-orbitron tracking-tighter leading-none mb-4 uppercase italic">
            PATH TO <span className="text-gradient-gold">SUCCESS</span>
          </h2>
          <p className="text-2xl font-serif italic text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Follow our proven <span className="text-foreground font-orbitron font-bold text-sm tracking-widest uppercase not-italic">process</span> to start earning and climbing the ranks.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 sm:gap-10 mb-12 last:mb-0 group"
            >
              <div className="flex flex-col items-center">
                <div className={`flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-background border-2 ${s.accent} transition-all duration-300 group-hover:scale-110 hud-corners relative z-10`}>
                  <s.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${s.color}`} />
                  <div className="absolute -inset-2 bg-current opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-1 flex-1 bg-gradient-to-b from-primary/40 via-primary/5 to-transparent mt-4 rounded-full" />
                )}
              </div>
              <div className="pt-2 sm:pt-4 pb-8">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-orbitron font-black text-primary border border-primary/20 px-2 py-0.5 rounded">STEP_0{i + 1}</span>
                  <div className="h-px w-12 bg-primary/20" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-orbitron mb-4 group-hover:text-primary transition-colors tracking-tight italic uppercase">{s.title}</h3>
                <p className="text-lg font-rajdhani font-semibold text-muted-foreground leading-snug tracking-wide">
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
