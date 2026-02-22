import mouseImg from "@/assets/ranks/mouse.png";
import foxImg from "@/assets/ranks/fox.png";
import wolfImg from "@/assets/ranks/wolf.png";
import eagleImg from "@/assets/ranks/eagle.png";
import lionImg from "@/assets/ranks/lion.png";
import dragonImg from "@/assets/ranks/dragon.png";

export interface RankConfig {
  key: string;
  label: string;
  animal: string;
  image: string;
  color: string;
  bgColor: string;
  borderColor: string;
  cpRequired: number;
  nextRank: string;
  cpForNext: number;
  perks: string[];
}

export const RANKS: RankConfig[] = [
  {
    key: "newcomer",
    label: "Mouse",
    animal: "🐭",
    image: mouseImg,
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
    borderColor: "border-border/40",
    cpRequired: 0,
    nextRank: "Fox",
    cpForNext: 100,
    perks: ["Answer questions", "Vote on answers"],
  },
  {
    key: "contributor",
    label: "Fox",
    animal: "🦊",
    image: foxImg,
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/30",
    cpRequired: 100,
    nextRank: "Wolf",
    cpForNext: 500,
    perks: ["Earn from answers", "Profile badge"],
  },
  {
    key: "analyst",
    label: "Wolf",
    animal: "🐺",
    image: wolfImg,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    cpRequired: 500,
    nextRank: "Eagle",
    cpForNext: 1500,
    perks: ["1.2x earning multiplier", "Priority answers"],
  },
  {
    key: "scholar",
    label: "Eagle",
    animal: "🦅",
    image: eagleImg,
    color: "text-[hsl(270,70%,60%)]",
    bgColor: "bg-[hsl(270,70%,60%)]/10",
    borderColor: "border-[hsl(270,70%,60%)]/30",
    cpRequired: 1500,
    nextRank: "Lion",
    cpForNext: 5000,
    perks: ["1.5x earning multiplier", "Verified badge"],
  },
  {
    key: "sage",
    label: "Lion",
    animal: "🦁",
    image: lionImg,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    cpRequired: 5000,
    nextRank: "Dragon",
    cpForNext: 15000,
    perks: ["2x earning multiplier", "Featured answers"],
  },
  {
    key: "grand_master",
    label: "Dragon",
    animal: "🐉",
    image: dragonImg,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    cpRequired: 15000,
    nextRank: "MAX",
    cpForNext: 99999,
    perks: ["3x earning multiplier", "Legend status"],
  },
];

export function getRankConfig(rankKey: string): RankConfig {
  return RANKS.find((r) => r.key === rankKey) || RANKS[0];
}

export function getRankProgress(rankKey: string, cp: number): number {
  const current = getRankConfig(rankKey);
  const nextIdx = RANKS.findIndex((r) => r.key === rankKey) + 1;
  if (nextIdx >= RANKS.length) return 100;
  const next = RANKS[nextIdx];
  const progress = ((cp - current.cpRequired) / (next.cpRequired - current.cpRequired)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Subscription tiers
export interface SubTier {
  id: string;
  dbValue: string;
  name: string;
  price: number;
  period: string;
  color: string;
  icon: string;
  features: string[];
  limits: {
    dailyAnswers: number;
    maxWithdrawal: number;
    platformFee: number;
    questionsPerMonth: number;
  };
}

export const SUB_TIERS: SubTier[] = [
  {
    id: "free",
    dbValue: "free",
    name: "Free",
    price: 0,
    period: "",
    color: "text-muted-foreground",
    icon: "🆓",
    features: ["3 answers/day", "5 questions/month", "15% platform fee", "KES 500 max withdrawal"],
    limits: { dailyAnswers: 3, maxWithdrawal: 500, platformFee: 15, questionsPerMonth: 5 },
  },
  {
    id: "bronze",
    dbValue: "bronze",
    name: "Bronze",
    price: 499,
    period: "/mo",
    color: "text-[hsl(30,60%,50%)]",
    icon: "🥉",
    features: ["10 answers/day", "15 questions/month", "12% platform fee", "KES 5,000 max withdrawal"],
    limits: { dailyAnswers: 10, maxWithdrawal: 5000, platformFee: 12, questionsPerMonth: 15 },
  },
  {
    id: "silver",
    dbValue: "silver",
    name: "Silver",
    price: 999,
    period: "/mo",
    color: "text-[hsl(210,10%,70%)]",
    icon: "🥈",
    features: ["25 answers/day", "Unlimited questions", "10% platform fee", "KES 25,000 max withdrawal", "Priority support"],
    limits: { dailyAnswers: 25, maxWithdrawal: 25000, platformFee: 10, questionsPerMonth: 999 },
  },
  {
    id: "gold",
    dbValue: "gold",
    name: "Gold",
    price: 2499,
    period: "/mo",
    color: "text-primary",
    icon: "🥇",
    features: ["50 answers/day", "Unlimited questions", "8% platform fee", "KES 100,000 max withdrawal", "Verified badge", "1.5x CP boost"],
    limits: { dailyAnswers: 50, maxWithdrawal: 100000, platformFee: 8, questionsPerMonth: 999 },
  },
  {
    id: "platinum",
    dbValue: "platinum",
    name: "Platinum",
    price: 4999,
    period: "/mo",
    color: "text-info",
    icon: "💎",
    features: ["Unlimited answers", "Unlimited questions", "5% platform fee", "Unlimited withdrawal", "VIP badge", "2x CP boost", "Featured profile"],
    limits: { dailyAnswers: 999, maxWithdrawal: 999999, platformFee: 5, questionsPerMonth: 999 },
  },
];

export function getSubTier(plan: string): SubTier {
  return SUB_TIERS.find((t) => t.dbValue === plan) || SUB_TIERS[0];
}

// Platform fee constant
export const PLATFORM_FEE_PERCENT = 12; // default, overridden by subscription tier
