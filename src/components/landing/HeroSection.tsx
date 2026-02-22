import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins, Sparkles, Trophy, Flame, Swords, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg-new.jpg";
import mouseImg from "@/assets/ranks/mouse.png";
import foxImg from "@/assets/ranks/fox.png";
import wolfImg from "@/assets/ranks/wolf.png";
import eagleImg from "@/assets/ranks/eagle.png";
import lionImg from "@/assets/ranks/lion.png";
import dragonImg from "@/assets/ranks/dragon.png";

const ranks = [
  { name: "Mouse", img: mouseImg, cp: "0+", glow: "from-blue-400/20 to-blue-600/5" },
  { name: "Fox", img: foxImg, cp: "100+", glow: "from-orange-400/20 to-orange-600/5" },
  { name: "Wolf", img: wolfImg, cp: "500+", glow: "from-slate-300/20 to-slate-500/5" },
  { name: "Eagle", img: eagleImg, cp: "1,500+", glow: "from-amber-400/20 to-amber-600/5" },
  { name: "Lion", img: lionImg, cp: "5,000+", glow: "from-yellow-400/20 to-yellow-600/5" },
  { name: "Dragon", img: dragonImg, cp: "15,000+", glow: "from-red-400/20 to-red-600/5" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/30 blur-2xl"
            style={{
              width: `${20 + i * 12}px`,
              height: `${20 + i * 12}px`,
              top: `${8 + i * 8}%`,
              left: `${3 + i * 9}%`,
            }}
            animate={{
              y: [-10, -40, -10],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 py-8 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Live badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs sm:text-sm font-bold backdrop-blur-md mb-6 sm:mb-8"
          >
            <Flame className="h-4 w-4 animate-pulse" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            KES 1.2M+ Paid Out — Join the Arena
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95] mb-4 sm:mb-6"
          >
            Answer. Compete.
            <br />
            <span className="text-gradient-gold relative">
              Get Paid.
              <motion.span
                className="absolute -right-6 -top-2 sm:-right-8 sm:-top-4"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-5 w-5 sm:h-8 sm:w-8 text-primary drop-shadow-lg" />
              </motion.span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            The <strong className="text-foreground font-semibold">competitive knowledge arena</strong> where your brainpower
            earns real money. Post challenges, submit solutions, get voted by the community — and
            climb from <span className="text-info font-semibold">Mouse</span> to <span className="text-destructive font-semibold">Dragon</span>.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14"
          >
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-bold glow-gold rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                Enter the Arena <Swords className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#ranks">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 border-border/40 text-muted-foreground hover:text-foreground rounded-2xl backdrop-blur-sm hover:bg-muted/10 transition-all">
                View Ranks <Trophy className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="grid grid-cols-3 gap-3 sm:gap-5 max-w-lg mx-auto mb-12 sm:mb-16"
          >
            {[
              { icon: Users, label: "Active Solvers", value: "2,500+" },
              { icon: Coins, label: "Prize Pools", value: "KES 1.2M" },
              { icon: TrendingUp, label: "Problems Solved", value: "8,400" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-card rounded-2xl p-4 sm:p-5 text-center backdrop-blur-md"
              >
                <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
                <div className="text-lg sm:text-2xl lg:text-3xl font-black font-mono">{s.value}</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Rank parade — BIG showcase */}
          <motion.div
            id="ranks"
            variants={fadeUp} initial="hidden" animate="visible" custom={5}
          >
            <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
              <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-primary/30" />
              <p className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-primary">
                Rank Up — Unlock Rewards
              </p>
              <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {ranks.map((r, i) => (
                <motion.div
                  key={r.name}
                  whileHover={{ y: -8, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`relative p-1 rounded-2xl bg-gradient-to-b ${r.glow}`}>
                    <div className="relative overflow-hidden rounded-xl border-2 border-border/30 group-hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
                      <img
                        src={r.img}
                        alt={r.name}
                        className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {i === ranks.length - 1 && (
                        <motion.div
                          className="absolute top-1 right-1"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary drop-shadow-lg" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors block">{r.name}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/70">{r.cp} CP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
