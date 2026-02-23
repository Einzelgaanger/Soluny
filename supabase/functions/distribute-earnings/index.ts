import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Earnings Distribution Engine v3
 * 
 * House-edge guardrails:
 * - Platform fee: 5-15% based on question author's subscription tier
 * - Minimum upvotes required: answer must have >= 3 upvotes (net_score >= 3) to qualify
 * - Minimum question engagement: question must have >= 2 answers AND >= 10 views to distribute
 * - Only positive net_score answers qualify
 * - If no answers meet thresholds, prize pool is retained by the platform
 * 
 * Distribution tiers:
 * - 1 qualifying answer:  100% to #1
 * - 2 qualifying answers: 70% to #1, 30% to #2
 * - 3+ qualifying answers: 50% to #1, 30% to #2, 20% to #3
 * 
 * CP reward: 10 CP per KES 100 earned
 */

const PLATFORM_FEE: Record<string, number> = {
  free: 0.15,
  bronze: 0.12,
  silver: 0.10,
  gold: 0.08,
  platinum: 0.05,
  monthly: 0.12,
  annual: 0.10,
  institutional: 0.08,
};

// Minimum thresholds for reward eligibility
const MIN_UPVOTES_FOR_REWARD = 3;       // Answer must have at least 3 net upvotes
const MIN_ANSWERS_FOR_DISTRIBUTION = 2;  // Question must have at least 2 total answers
const MIN_VIEWS_FOR_DISTRIBUTION = 10;   // Question must have at least 10 views

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { question_id } = await req.json();

    if (!question_id) {
      const now = new Date().toISOString();
      const { data: closedQuestions } = await adminClient
        .from("questions")
        .select("id, prize_pool_kes, answer_count, view_count")
        .eq("status", "voting")
        .lt("voting_closes_at", now);

      if (!closedQuestions || closedQuestions.length === 0) {
        return new Response(
          JSON.stringify({ message: "No questions to process" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = [];
      for (const q of closedQuestions) {
        const result = await distributeForQuestion(adminClient, q.id, Number(q.prize_pool_kes), q.answer_count, q.view_count);
        results.push(result);
      }

      return new Response(
        JSON.stringify({ processed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: question } = await adminClient
      .from("questions")
      .select("id, prize_pool_kes, status, answer_count, view_count")
      .eq("id", question_id)
      .single();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await distributeForQuestion(adminClient, question.id, Number(question.prize_pool_kes), question.answer_count, question.view_count);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function distributeForQuestion(
  client: any,
  questionId: string,
  prizePool: number,
  answerCount: number,
  viewCount: number
) {
  // ── Guard: minimum question engagement ──
  if (answerCount < MIN_ANSWERS_FOR_DISTRIBUTION || viewCount < MIN_VIEWS_FOR_DISTRIBUTION) {
    await client
      .from("questions")
      .update({ status: "closed" })
      .eq("id", questionId);
    return {
      question_id: questionId,
      distributed: 0,
      platform_fee: prizePool, // Pool retained by platform
      winners: 0,
      reason: `Question did not meet minimum engagement (${answerCount} answers, ${viewCount} views). Requires at least ${MIN_ANSWERS_FOR_DISTRIBUTION} answers and ${MIN_VIEWS_FOR_DISTRIBUTION} views.`,
    };
  }

  // Get answers sorted by net_score desc
  const { data: answers } = await client
    .from("answers")
    .select("id, author_id, net_score, upvotes")
    .eq("question_id", questionId)
    .order("net_score", { ascending: false });

  if (!answers || answers.length === 0) {
    await client
      .from("questions")
      .update({ status: "closed" })
      .eq("id", questionId);
    return { question_id: questionId, distributed: 0, platform_fee: prizePool, winners: 0, reason: "No answers submitted." };
  }

  // ── Guard: minimum upvotes + positive score ──
  const eligible = answers.filter(
    (a: any) => a.net_score >= MIN_UPVOTES_FOR_REWARD && a.net_score > 0
  );

  if (eligible.length === 0) {
    await client
      .from("questions")
      .update({ status: "closed" })
      .eq("id", questionId);
    return {
      question_id: questionId,
      distributed: 0,
      platform_fee: prizePool,
      winners: 0,
      reason: `No answers met the minimum ${MIN_UPVOTES_FOR_REWARD} upvotes threshold.`,
    };
  }

  // Calculate platform fee
  const { data: questionData } = await client
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .single();

  let feeRate = 0.12;
  if (questionData) {
    const { data: authorProfile } = await client
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", questionData.author_id)
      .single();
    if (authorProfile) {
      feeRate = PLATFORM_FEE[authorProfile.subscription_plan] || 0.12;
    }
  }

  const platformFee = Math.round(prizePool * feeRate * 100) / 100;
  const distributablePool = prizePool - platformFee;

  // Distribution tiers
  let shares: number[];
  if (eligible.length === 1) {
    shares = [1.0];
  } else if (eligible.length === 2) {
    shares = [0.7, 0.3];
  } else {
    shares = [0.5, 0.3, 0.2];
  }

  const winners = Math.min(eligible.length, shares.length);

  for (let i = 0; i < winners; i++) {
    const answer = eligible[i];
    const earning = Math.round(distributablePool * shares[i] * 100) / 100;

    if (earning <= 0) continue;

    await client
      .from("answers")
      .update({ rank_position: i + 1, earnings_awarded_kes: earning })
      .eq("id", answer.id);

    await client.from("earnings").insert({
      user_id: answer.author_id,
      amount_kes: earning,
      answer_id: answer.id,
      payout_status: "pending",
    });

    const { data: profile } = await client
      .from("profiles")
      .select("available_balance_kes, total_earnings_kes, cp_balance")
      .eq("user_id", answer.author_id)
      .single();

    if (profile) {
      const cpReward = Math.floor(earning / 100) * 10;
      await client
        .from("profiles")
        .update({
          available_balance_kes: Number(profile.available_balance_kes) + earning,
          total_earnings_kes: Number(profile.total_earnings_kes) + earning,
          cp_balance: profile.cp_balance + cpReward,
        })
        .eq("user_id", answer.author_id);
    }
  }

  await client
    .from("questions")
    .update({ status: "closed" })
    .eq("id", questionId);

  // Notifications
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  for (let i = 0; i < winners; i++) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "earnings_distributed",
          user_id: eligible[i].author_id,
        }),
      });
    } catch (e) {
      console.error("Failed to send earnings notification:", e);
    }
  }

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: "voting_closed",
        question_id: questionId,
      }),
    });
  } catch (e) {
    console.error("Failed to send voting closed notification:", e);
  }

  return { question_id: questionId, distributed: distributablePool, platform_fee: platformFee, winners };
}
