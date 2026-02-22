import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Email Notification Edge Function
 * 
 * Types:
 * - new_answer: Someone answered your question
 * - voting_closed: Voting period ended on your question
 * - earnings_distributed: You earned money from an answer
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, question_id, answer_id, user_id } = await req.json();

    switch (type) {
      case "new_answer": {
        // Notify question author that someone answered
        const { data: question } = await adminClient
          .from("questions")
          .select("title, author_id")
          .eq("id", question_id)
          .single();

        if (!question) break;

        const { data: author } = await adminClient.auth.admin.getUserById(question.author_id);
        if (!author?.user?.email) break;

        const { data: answerer } = await adminClient
          .from("profiles")
          .select("display_name")
          .eq("user_id", user_id)
          .single();

        await sendEmail(
          author.user.email,
          `New answer on "${question.title}" — Soluny`,
          buildNewAnswerEmail(
            question.title,
            answerer?.display_name || "Someone",
            question_id
          )
        );
        break;
      }

      case "voting_closed": {
        // Notify question author that voting ended
        const { data: question } = await adminClient
          .from("questions")
          .select("title, author_id, answer_count")
          .eq("id", question_id)
          .single();

        if (!question) break;

        const { data: author } = await adminClient.auth.admin.getUserById(question.author_id);
        if (!author?.user?.email) break;

        await sendEmail(
          author.user.email,
          `Voting closed on "${question.title}" — Soluny`,
          buildVotingClosedEmail(
            question.title,
            question.answer_count,
            question_id
          )
        );
        break;
      }

      case "earnings_distributed": {
        // Notify user they earned money
        const { data: userAuth } = await adminClient.auth.admin.getUserById(user_id);
        if (!userAuth?.user?.email) break;

        const { data: earnings } = await adminClient
          .from("earnings")
          .select("amount_kes, answer_id")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!earnings) break;

        const { data: answer } = await adminClient
          .from("answers")
          .select("question_id, rank_position")
          .eq("id", earnings.answer_id)
          .single();

        let questionTitle = "a question";
        if (answer) {
          const { data: q } = await adminClient
            .from("questions")
            .select("title")
            .eq("id", answer.question_id)
            .single();
          if (q) questionTitle = q.title;
        }

        await sendEmail(
          userAuth.user.email,
          `You earned KES ${Number(earnings.amount_kes).toLocaleString()}! — Soluny`,
          buildEarningsEmail(
            Number(earnings.amount_kes),
            answer?.rank_position || 0,
            questionTitle
          )
        );
        break;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendEmail(to: string, subject: string, html: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Use Supabase's built-in email via auth.admin
  // We'll use the Resend-compatible approach via edge function HTTP
  // For now, log the email (replace with actual email provider later)
  console.log(`📧 Email to: ${to}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 Body length: ${html.length} chars`);
  
  // Store notification in a log for admin dashboard visibility
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  // We'll track via console for now — email provider integration (Resend/SendGrid) can be added
}

function buildNewAnswerEmail(title: string, answererName: string, questionId: string): string {
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e6edf3; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f5bd41; font-size: 24px; margin: 0;">⚡ Soluny</h1>
        <p style="color: #7d8590; font-size: 12px; margin-top: 4px;">Where Smart Earns</p>
      </div>
      <h2 style="font-size: 18px; margin-bottom: 8px;">New Answer Submitted!</h2>
      <p style="color: #7d8590; font-size: 14px; line-height: 1.6;">
        <strong style="color: #e6edf3;">${answererName}</strong> just answered your question:
      </p>
      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 14px; font-weight: 600; margin: 0;">"${title}"</p>
      </div>
      <p style="color: #7d8590; font-size: 13px;">Head to Soluny to vote on answers and see who's winning!</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://soluny.lovable.app/dashboard/questions/${questionId}" style="display: inline-block; background: #f5bd41; color: #0d1117; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Answers →</a>
      </div>
      <p style="color: #484f58; font-size: 11px; text-align: center; margin-top: 32px;">You received this because someone answered your question on Soluny.</p>
    </div>
  `;
}

function buildVotingClosedEmail(title: string, answerCount: number, questionId: string): string {
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e6edf3; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f5bd41; font-size: 24px; margin: 0;">⚡ Soluny</h1>
        <p style="color: #7d8590; font-size: 12px; margin-top: 4px;">Where Smart Earns</p>
      </div>
      <h2 style="font-size: 18px; margin-bottom: 8px;">⏰ Voting Has Closed!</h2>
      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 14px; font-weight: 600; margin: 0;">"${title}"</p>
        <p style="color: #7d8590; font-size: 12px; margin-top: 8px;">${answerCount} answer${answerCount !== 1 ? "s" : ""} received</p>
      </div>
      <p style="color: #7d8590; font-size: 13px;">Earnings are being distributed to the top answers. Check the results!</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://soluny.lovable.app/dashboard/questions/${questionId}" style="display: inline-block; background: #f5bd41; color: #0d1117; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">See Results →</a>
      </div>
      <p style="color: #484f58; font-size: 11px; text-align: center; margin-top: 32px;">You received this because voting closed on your question on Soluny.</p>
    </div>
  `;
}

function buildEarningsEmail(amount: number, rankPosition: number, questionTitle: string): string {
  const medals = ["🥇", "🥈", "🥉"];
  const medal = medals[rankPosition - 1] || "🏆";
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e6edf3; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f5bd41; font-size: 24px; margin: 0;">⚡ Soluny</h1>
        <p style="color: #7d8590; font-size: 12px; margin-top: 4px;">Where Smart Earns</p>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 48px;">${medal}</span>
        <h2 style="font-size: 24px; margin: 8px 0 4px;">You Earned KES ${amount.toLocaleString()}!</h2>
        <p style="color: #7d8590; font-size: 13px;">Rank #${rankPosition} answer</p>
      </div>
      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="color: #7d8590; font-size: 12px; margin: 0 0 4px;">Question:</p>
        <p style="font-size: 14px; font-weight: 600; margin: 0;">"${questionTitle}"</p>
      </div>
      <p style="color: #7d8590; font-size: 13px;">Your earnings have been added to your balance. Withdraw via M-Pesa anytime!</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://soluny.lovable.app/dashboard/earnings" style="display: inline-block; background: #f5bd41; color: #0d1117; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Earnings →</a>
      </div>
      <p style="color: #484f58; font-size: 11px; text-align: center; margin-top: 32px;">You received this because your answer earned money on Soluny. 💰</p>
    </div>
  `;
}
