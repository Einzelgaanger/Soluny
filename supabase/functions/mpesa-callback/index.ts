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
    const callback = body.Body?.stkCallback;

    if (!callback) {
      return new Response("OK", { headers: corsHeaders });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (ResultCode !== 0) {
      // Payment failed
      await adminClient
        .from("payments")
        .update({ status: "failed" })
        .eq("mpesa_code", CheckoutRequestID);

      return new Response("OK", { headers: corsHeaders });
    }

    // Extract M-Pesa receipt number
    const items = CallbackMetadata?.Item || [];
    const receiptNumber = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "";

    // Update payment
    await adminClient
      .from("payments")
      .update({ status: "completed", mpesa_code: receiptNumber })
      .eq("mpesa_code", CheckoutRequestID);

    // Get the payment to find user_id
    const { data: payment } = await adminClient
      .from("payments")
      .select("user_id, amount")
      .eq("mpesa_code", receiptNumber)
      .single();

    if (payment) {
      // Activate subscription (assume monthly for M-Pesa)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await adminClient
        .from("profiles")
        .update({
          subscription_plan: "monthly",
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", payment.user_id);
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
