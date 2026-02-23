import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins, Sparkles, Trophy, Flame, Swords, Crown, Zap, Target, Crosshair, Activity, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import heroBg from "@/assets/hero-bg-new.jpg";
import mouseImg from "@/assets/ranks/mouse.png";
import foxImg from "@/assets/ranks/fox.png";
import wolfImg from "@/assets/ranks/wolf.png";
import eagleImg from "@/assets/ranks/eagle.png";
import lionImg from "@/assets/ranks/lion.png";
import dragonImg from "@/assets/ranks/dragon.png";
import { useRef } from "react";

const ranks = [
  { name: "Mouse", image: mouseImg, earnings: "KES 450", rank: "Entry" },
  { name: "Fox", image: foxImg, earnings: "KES 2,400", rank: "Scout" },
  { name: "Wolf", image: wolfImg, earnings: "KES 12,800", rank: "Hunter" },
  { name: "Eagle", image: eagleImg, earnings: "KES 45,000", rank: "Overseer" },
  { name: "Lion", image: lionImg, earnings: "KES 140,000", rank: "Apex" },
  { name: "Dragon", image: dragonImg, earnings: "KES 1.2M", rank: "Sovereign" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: "easeOut" },
  }),
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden pt-20 bg-background">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0">
        <motion.div style={{ y }} className="absolute inset-0">
          <img
            src={heroBg}
            alt="Arena Background"
            className="w-full h-full object-cover grayscale-[0.25] opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/35 to-background/80" />
        </motion.div>
        <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
        <div className="scanline" />

        {/* Floating HUD Particles (Depth Layer) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                opacity: Math.random() * 0.3
              }}
              animate={{
                y: [null, Math.random() * -100 - 50 + "px"],
                opacity: [null, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
              className="absolute h-px w-px bg-primary"
            />
          ))}
        </div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Main Content */}
          <motion.div
            style={{ opacity }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="relative">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full mb-4"
              >
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="font-orbitron font-black tracking-[0.3em] text-[10px] uppercase">NETWORK_STATUS // ONLINE</span>
              </motion.div>
              <div className="absolute top-0 right-0 text-tactical opacity-10 hidden sm:block">
                ARENA_ID: 0x882A // PROTO_V1.0
              </div>
            </div>

            <div className="relative group">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                className="absolute -top-12 -left-8 text-8xl font-black font-orbitron select-none pointer-events-none whitespace-nowrap hidden lg:block"
              >
                SOLUNY_SOLUNY
              </motion.div>
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-7xl sm:text-9xl lg:text-[12rem] font-black font-orbitron tracking-tighter leading-[0.8] uppercase italic relative z-10"
              >
                SOLUNY<span className="text-primary animate-pulse">_</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light lowercase text-muted-foreground/40 mt-4 ml-8 italic flex items-center gap-6"
              >
                competitive <span className="text-foreground not-italic font-orbitron font-black text-3xl sm:text-5xl lg:text-7xl tracking-widest uppercase">intellect</span>
              </motion.div>
              <div className="mt-4 flex items-center gap-4 text-tactical opacity-20 ml-8">
                <span>TX_RATE: MAX</span>
                <div className="h-px w-24 bg-primary/20" />
                <span>SYS_OVERRIDE: NULL</span>
              </div>
            </div>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-xl sm:text-2xl font-rajdhani font-medium text-muted-foreground leading-relaxed max-w-2xl"
            >
              The definitive <span className="text-foreground font-serif italic text-2xl uppercase tracking-tighter">Arena</span> for neural deployment. Every question is a mission. Every correct answer is a bounty.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-center gap-6 pt-8"
            >
              <Link to="/signup">
                <Button size="lg" className="h-16 px-10 bg-primary text-primary-foreground hover:bg-primary/90 font-orbitron font-bold rounded-2xl glow-gold-strong hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-primary/50 text-lg uppercase tracking-widest">
                  DEPLO_ENTITY <Swords className="h-5 w-5 fill-current" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="h-16 px-10 border-primary/30 hover:bg-primary/5 font-orbitron font-bold rounded-2xl transition-all flex items-center gap-3 text-lg uppercase tracking-widest bg-background/50 backdrop-blur-sm">
                  AUDIT_SYSTEMS <Zap className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-16"
            >
              {[
                { label: "BOUNTIES_PAID", value: "24.8M KES", coord: "40.7N" },
                { label: "ACTIVE_SQUAD", value: "12,400+", coord: "74.1W" },
                { label: "T06_DRAGONS", value: "42", coord: "0.2A" },
              ].map((stat) => (
                <div key={stat.label} className="border-l-2 border-primary/20 pl-6 group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-orbitron font-black text-muted-foreground group-hover:text-primary transition-colors tracking-[0.2em]">{stat.label}</div>
                    <span className="text-tactical scale-75 opacity-0 group-hover:opacity-100 transition-opacity">{stat.coord}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-orbitron font-black text-foreground">{stat.value}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Side Visual - Asymmetrical with enhanced parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="lg:col-span-4 hidden lg:block relative"
          >
            <div className="absolute -inset-20 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="glass-card rounded-[2.5rem] p-4 border-primary/20 hud-corners glow-gold-strong overflow-hidden relative group">
              <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
              {/* Tactical Overlay */}
              <div className="absolute top-4 left-4 text-tactical opacity-20">LIVE_FEED</div>
              <div className="absolute top-4 right-4 text-tactical opacity-20">SEC_LEVEL_A</div>

              <div className="relative">
                <div className="flex justify-between items-center px-4 pt-8 mb-2">
                  <span className="font-orbitron font-black text-[10px] text-primary tracking-widest">RANK_LEADERBOARD</span>
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="space-y-1">
                  {ranks.slice(-3).reverse().map((player, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10 group/item">
                      <div className="relative h-14 w-14 shrink-0">
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover/item:opacity-100" />
                        <img src={player.image} alt={player.rank} className="h-full w-full object-contain relative z-10 drop-shadow-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-orbitron font-black text-sm truncate uppercase tracking-tight">{player.name}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 italic">{player.rank} Node</div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-black text-primary text-sm">{player.earnings}</div>
                        <div className="text-[8px] font-bold text-success uppercase">REWARDED</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-4 pt-0">
                  <div className="h-px bg-primary/20 w-full mb-4" />
                  <div className="flex items-center justify-between text-[10px] font-orbitron font-black tracking-widest text-muted-foreground/40">
                    <span>SECURE_DATA_FEED</span>
                    <span className="animate-pulse">LATENCY: 14MS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating HUD elements */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -right-8 p-4 glass-card rounded-2xl border-primary/30 hud-corners hidden xl:block"
            >
              <div className="font-orbitron font-black text-[10px] text-primary mb-1 tracking-widest">PROTOCOL_V1.0</div>
              <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                <motion.div animate={{ x: [-100, 100] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full w-1/2 bg-primary" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default HeroSection;
