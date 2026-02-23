import { Search, PenLine, ThumbsUp, Wallet } from "lucide-react";
import howitBg from "@/assets/howit-bg.jpg";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Search,
    title: "Find a Question",
    desc: "Browse questions posted by other members. Each question has a prize pool — the amount you can earn for the best answer.",
    color: "text-primary border-primary/30",
  },
  {
    icon: PenLine,
    title: "Submit Your Answer",
    desc: "Write a clear, accurate answer. Take your time — only well-researched, quality contributions get rewarded.",
    color: "text-info border-info/30",
  },
  {
    icon: ThumbsUp,
    title: "Community Votes",
    desc: "Other members review and upvote the best answers. You need a minimum number of upvotes to qualify for the reward pool.",
    color: "text-success border-success/30",
  },
  {
    icon: Wallet,
    title: "Get Paid",
    desc: "Top-voted answers split the prize pool (50/30/20). Earnings go straight to your balance — withdraw anytime via M-Pesa.",
    color: "text-primary border-primary/30",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative border-y border-primary/10 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={howitBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Step by Step</span>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4">
            How You <span className="text-primary">Earn</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            It's simple: find a question, share your knowledge, and get rewarded when the community validates your answer.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 sm:gap-8 mb-10 last:mb-0 group"
            >
              <div className="flex flex-col items-center">
                <div className={`flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-background border-2 ${s.color} transition-all duration-300 group-hover:scale-110`}>
                  <s.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${s.color.split(" ")[0]}`} />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-3 rounded-full" />
                )}
              </div>
              <div className="pt-2 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Step {i + 1}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
