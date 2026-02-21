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
    const body = await req.json();
    const result = body.Result;

    if (!result) {
      return new Response("OK", { headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const conversationId = result.OriginatorConversationID;
    const resultCode = result.ResultCode;

    if (resultCode === 0) {
      // Extract transaction ID from result parameters
      const params = result.ResultParameters?.ResultParameter || [];
      const transactionId = params.find((p: any) => p.Key === "TransactionID")?.Value || "";

      await adminClient
        .from("earnings")
        .update({ payout_status: "completed", mpesa_code: transactionId })
        .eq("id", conversationId);
    } else {
      // Payout failed — restore balance
      const { data: earning } = await adminClient
        .from("earnings")
        .select("user_id, amount_kes")
        .eq("id", conversationId)
        .single();

      if (earning) {
        await adminClient
          .from("earnings")
          .update({ payout_status: "failed" })
          .eq("id", conversationId);

        // Restore balance
        const { data: profile } = await adminClient
          .from("profiles")
          .select("available_balance_kes")
          .eq("user_id", earning.user_id)
          .single();

        if (profile) {
          await adminClient
            .from("profiles")
            .update({
              available_balance_kes: Number(profile.available_balance_kes) + Number(earning.amount_kes),
            })
            .eq("user_id", earning.user_id);
        }
      }
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (err) {
    console.error("B2C callback error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
