import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, question_id, answer_id, user_id } = await req.json();

    switch (type) {
      case "new_answer": {
        const { data: question } = await adminClient
          .from("questions").select("title, author_id").eq("id", question_id).single();
        if (!question) break;

        const { data: author } = await adminClient.auth.admin.getUserById(question.author_id);
        if (!author?.user?.email) break;

        const { data: answerer } = await adminClient
          .from("profiles").select("display_name").eq("user_id", user_id).single();

        await sendEmail(RESEND_API_KEY, author.user.email,
          `⚡ New answer on "${question.title}"`,
          buildNewAnswerEmail(question.title, answerer?.display_name || "Someone", question_id)
        );
        break;
      }

      case "voting_closed": {
        const { data: question } = await adminClient
          .from("questions").select("title, author_id, answer_count").eq("id", question_id).single();
        if (!question) break;

        const { data: author } = await adminClient.auth.admin.getUserById(question.author_id);
        if (!author?.user?.email) break;

        await sendEmail(RESEND_API_KEY, author.user.email,
          `⏰ Voting closed on "${question.title}"`,
          buildVotingClosedEmail(question.title, question.answer_count, question_id)
        );
        break;
      }

      case "earnings_distributed": {
        const { data: userAuth } = await adminClient.auth.admin.getUserById(user_id);
        if (!userAuth?.user?.email) break;

        const { data: earnings } = await adminClient
          .from("earnings").select("amount_kes, answer_id")
          .eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).single();
        if (!earnings) break;

        const { data: answer } = await adminClient
          .from("answers").select("question_id, rank_position").eq("id", earnings.answer_id).single();

        let questionTitle = "a question";
        if (answer) {
          const { data: q } = await adminClient.from("questions").select("title").eq("id", answer.question_id).single();
          if (q) questionTitle = q.title;
        }

        await sendEmail(RESEND_API_KEY, userAuth.user.email,
          `💰 You earned KES ${Number(earnings.amount_kes).toLocaleString()}!`,
          buildEarningsEmail(Number(earnings.amount_kes), answer?.rank_position || 0, questionTitle)
        );
        break;
      }
    }

    return new Response(JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Notification error:", err);
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Soluny <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend API error [${res.status}]: ${body}`);
    throw new Error(`Failed to send email: ${res.status}`);
  }

  const data = await res.json();
  console.log(`📧 Email sent to ${to}, id: ${data.id}`);
  return data;
}

// ─── Email Templates ─────────────────────────────────

const wrapper = (content: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #0a0e14; font-family: 'Segoe UI', system-ui, sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
  .card { background: linear-gradient(145deg, #111820, #0d1117); border-radius: 20px; border: 1px solid #1e2733; overflow: hidden; }
  .header { background: linear-gradient(135deg, #f5bd41 0%, #e6a817 100%); padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #0d1117; letter-spacing: -0.5px; }
  .header p { margin: 4px 0 0; font-size: 12px; color: #0d1117aa; font-weight: 600; }
  .body { padding: 28px 24px; }
  .body h2 { color: #e6edf3; font-size: 20px; margin: 0 0 12px; }
  .body p { color: #8b949e; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .highlight-box { background: #161b22; border: 1px solid #30363d; border-radius: 14px; padding: 18px; margin: 20px 0; }
  .highlight-box .title { color: #e6edf3; font-size: 15px; font-weight: 700; margin: 0; }
  .highlight-box .sub { color: #7d8590; font-size: 12px; margin: 6px 0 0; }
  .cta { display: inline-block; background: linear-gradient(135deg, #f5bd41, #e6a817); color: #0d1117; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: -0.2px; }
  .cta:hover { opacity: 0.9; }
  .footer { text-align: center; padding: 20px 24px; border-top: 1px solid #1e2733; }
  .footer p { color: #484f58; font-size: 11px; margin: 0; }
  .medal { font-size: 56px; display: block; margin: 0 auto 8px; }
  .amount { font-size: 32px; font-weight: 800; color: #f5bd41; margin: 0; }
  .rank-tag { display: inline-block; background: #f5bd41; color: #0d1117; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; }
  .stat-row { display: flex; justify-content: center; gap: 24px; margin: 16px 0; }
  .stat { text-align: center; }
  .stat .num { color: #e6edf3; font-size: 18px; font-weight: 700; }
  .stat .lbl { color: #7d8590; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
</style></head>
<body><div class="container"><div class="card">${content}</div></div></body></html>`;

function buildNewAnswerEmail(title: string, answererName: string, questionId: string): string {
  return wrapper(`
    <div class="header">
      <h1>⚡ Soluny</h1>
      <p>THE KNOWLEDGE ARENA</p>
    </div>
    <div class="body">
      <h2>🎯 New Answer Submitted!</h2>
      <p><strong style="color:#e6edf3">${answererName}</strong> just dropped a solution on your question. Head to the arena to check it out and vote!</p>
      <div class="highlight-box">
        <p class="title">"${title}"</p>
        <p class="sub">💬 A new challenger has entered</p>
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="https://soluny.lovable.app/dashboard/questions/${questionId}" class="cta">View Answer →</a>
      </div>
    </div>
    <div class="footer"><p>You received this because someone answered your question on Soluny.</p></div>
  `);
}

function buildVotingClosedEmail(title: string, answerCount: number, questionId: string): string {
  return wrapper(`
    <div class="header">
      <h1>⚡ Soluny</h1>
      <p>THE KNOWLEDGE ARENA</p>
    </div>
    <div class="body">
      <h2>⏰ Voting Has Closed!</h2>
      <p>The battle is over! The community has spoken, and the results are in for your question.</p>
      <div class="highlight-box">
        <p class="title">"${title}"</p>
        <div class="stat-row">
          <div class="stat"><div class="num">${answerCount}</div><div class="lbl">Answers</div></div>
        </div>
      </div>
      <p>Earnings are being distributed to the top-voted answers. Check your results below!</p>
      <div style="text-align:center;margin-top:24px">
        <a href="https://soluny.lovable.app/dashboard/questions/${questionId}" class="cta">See Results →</a>
      </div>
    </div>
    <div class="footer"><p>You received this because voting closed on your question on Soluny.</p></div>
  `);
}

function buildEarningsEmail(amount: number, rankPosition: number, questionTitle: string): string {
  const medals = ["🥇", "🥈", "🥉"];
  const medal = medals[rankPosition - 1] || "🏆";
  const positionLabel = rankPosition === 1 ? "1st" : rankPosition === 2 ? "2nd" : rankPosition === 3 ? "3rd" : `#${rankPosition}`;
  return wrapper(`
    <div class="header">
      <h1>⚡ Soluny</h1>
      <p>THE KNOWLEDGE ARENA</p>
    </div>
    <div class="body" style="text-align:center">
      <span class="medal">${medal}</span>
      <p class="amount">KES ${amount.toLocaleString()}</p>
      <p style="color:#7d8590;font-size:13px;margin:4px 0 16px">You placed <span class="rank-tag">${positionLabel} Place</span></p>
      <div class="highlight-box" style="text-align:left">
        <p class="sub" style="margin:0 0 4px">Question:</p>
        <p class="title">"${questionTitle}"</p>
      </div>
      <p style="color:#8b949e;font-size:14px;margin:16px 0">Your earnings have been added to your balance. Withdraw via M-Pesa anytime! 🚀</p>
      <div style="margin-top:24px">
        <a href="https://soluny.lovable.app/dashboard/earnings" class="cta">View Earnings →</a>
      </div>
    </div>
    <div class="footer"><p>You received this because your answer earned money on Soluny. 💰</p></div>
  `);
}
