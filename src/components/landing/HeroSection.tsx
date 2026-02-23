import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Coins, BookOpen, Award, CheckCircle, Lightbulb } from "lucide-react";
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
  { name: "Mouse", image: mouseImg, earnings: "KES 450", rank: "Starter" },
  { name: "Fox", image: foxImg, earnings: "KES 2,400", rank: "Learner" },
  { name: "Wolf", image: wolfImg, earnings: "KES 12,800", rank: "Expert" },
  { name: "Eagle", image: eagleImg, earnings: "KES 45,000", rank: "Master" },
  { name: "Lion", image: lionImg, earnings: "KES 140,000", rank: "Authority" },
  { name: "Dragon", image: dragonImg, earnings: "KES 1.2M", rank: "Legend" },
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
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20 bg-background">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <motion.div style={{ y }} className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </motion.div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Main Content */}
          <motion.div style={{ opacity }} className="lg:col-span-7 space-y-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full"
            >
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold tracking-wide text-xs uppercase">Learn • Answer • Earn</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]"
            >
              Share Knowledge,
              <span className="text-primary block mt-2">Get Rewarded.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl"
            >
              Soluny is a platform where your expertise pays off. Answer questions, help others learn, and earn real money — all verified by the community.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl glow-gold-strong hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-primary/50 text-base">
                  Start Earning Today <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="h-14 px-8 border-primary/30 hover:bg-primary/5 font-semibold rounded-2xl transition-all flex items-center gap-3 text-base bg-background/50 backdrop-blur-sm">
                  See How It Works <BookOpen className="h-5 w-5" />
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="grid grid-cols-3 gap-6 pt-12"
            >
              {[
                { label: "Rewards Paid", value: "KES 24.8M", icon: Coins },
                { label: "Active Members", value: "12,400+", icon: Users },
                { label: "Questions Solved", value: "58,000+", icon: CheckCircle },
              ].map((stat) => (
                <div key={stat.label} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Side — Top Earners Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:col-span-5 hidden lg:block relative"
          >
            <div className="absolute -inset-20 bg-primary/10 blur-[100px] rounded-full" />
            <div className="glass-card rounded-3xl p-6 border-primary/20 glow-gold overflow-hidden relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm text-foreground">Top Earners</span>
                </div>
                <span className="text-xs text-muted-foreground">This month</span>
              </div>
              <div className="space-y-1">
                {ranks.slice(-3).reverse().map((player, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                    <div className="relative h-12 w-12 shrink-0">
                      <img src={player.image} alt={player.rank} className="h-full w-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary text-sm">{player.earnings}</div>
                      <div className="text-[10px] font-medium text-success">Earned</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/30 text-center">
                <Link to="/signup" className="text-xs font-semibold text-primary hover:underline">
                  Join & start earning →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
