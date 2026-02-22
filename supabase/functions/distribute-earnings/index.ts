import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Earnings Distribution Engine v2
 * 
 * - Takes a 12% platform fee (default) from the prize pool before distribution
 * - Users on higher subscription tiers get lower fees (5-15%)
 * - Distributes remaining pool among top-ranked answers by vote scores
 * - Awards 10 CP per KES 100 earned
 * - Enforces one answer per user per question (DB constraint)
 * 
 * Distribution tiers:
 * - 1 answer:  100% to #1
 * - 2 answers: 70% to #1, 30% to #2
 * - 3+ answers: 50% to #1, 30% to #2, 20% to #3
 */

// Platform fee by subscription plan
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
      // Process all questions where voting has closed
      const now = new Date().toISOString();
      const { data: closedQuestions } = await adminClient
        .from("questions")
        .select("id, prize_pool_kes")
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
        const result = await distributeForQuestion(adminClient, q.id, Number(q.prize_pool_kes));
        results.push(result);
      }

      return new Response(
        JSON.stringify({ processed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process single question
    const { data: question } = await adminClient
      .from("questions")
      .select("id, prize_pool_kes, status")
      .eq("id", question_id)
      .single();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await distributeForQuestion(adminClient, question.id, Number(question.prize_pool_kes));

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
  prizePool: number
) {
  // Get answers sorted by net_score desc
  const { data: answers } = await client
    .from("answers")
    .select("id, author_id, net_score")
    .eq("question_id", questionId)
    .order("net_score", { ascending: false });

  if (!answers || answers.length === 0) {
    await client
      .from("questions")
      .update({ status: "closed" })
      .eq("id", questionId);
    return { question_id: questionId, distributed: 0, platform_fee: 0, winners: 0 };
  }

  // Filter positive-score answers only
  const eligible = answers.filter((a: any) => a.net_score > 0);

  if (eligible.length === 0) {
    await client
      .from("questions")
      .update({ status: "closed" })
      .eq("id", questionId);
    return { question_id: questionId, distributed: 0, platform_fee: 0, winners: 0 };
  }

  // Calculate platform fee based on the question author's subscription
  const { data: questionData } = await client
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .single();

  let feeRate = 0.12; // default
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

    // Update answer with rank and earnings
    await client
      .from("answers")
      .update({ rank_position: i + 1, earnings_awarded_kes: earning })
      .eq("id", answer.id);

    // Create earnings record
    await client.from("earnings").insert({
      user_id: answer.author_id,
      amount_kes: earning,
      answer_id: answer.id,
      payout_status: "pending",
    });

    // Update user balance and total earnings
    const { data: profile } = await client
      .from("profiles")
      .select("available_balance_kes, total_earnings_kes, cp_balance")
      .eq("user_id", answer.author_id)
      .single();

    if (profile) {
      // CP reward: 10 CP per KES 100 earned
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

  // Close question
  await client
    .from("questions")
    .update({ status: "closed" })
    .eq("id", questionId);

  return { question_id: questionId, distributed: distributablePool, platform_fee: platformFee, winners };
}
