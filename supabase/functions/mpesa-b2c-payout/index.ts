import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getMpesaToken(): Promise<string> {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("available_balance_kes, phone_number")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.phone_number) {
      return new Response(
        JSON.stringify({ error: "Please add your M-Pesa phone number in your profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const balance = Number(profile.available_balance_kes);
    if (balance < 500) {
      return new Response(
        JSON.stringify({ error: "Minimum withdrawal is KES 500" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = balance; // Withdraw full balance

    // Create earnings record
    const { data: earning } = await adminClient.from("earnings").insert({
      user_id: userId,
      amount_kes: amount,
      payout_method: "mpesa",
      payout_status: "processing",
    }).select().single();

    // Deduct balance
    await adminClient
      .from("profiles")
      .update({ available_balance_kes: 0 })
      .eq("user_id", userId);

    // B2C API call
    const mpesaToken = await getMpesaToken();
    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const initiatorName = Deno.env.get("MPESA_B2C_INITIATOR_NAME")!;
    const securityCredential = Deno.env.get("MPESA_B2C_SECURITY_CREDENTIAL")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const b2cRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpesaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          OriginatorConversationID: earning?.id || crypto.randomUUID(),
          InitiatorName: initiatorName,
          SecurityCredential: securityCredential,
          CommandID: "BusinessPayment",
          Amount: Math.round(amount),
          PartyA: shortcode,
          PartyB: profile.phone_number,
          Remarks: "SOLVR Earnings Payout",
          QueueTimeOutURL: `${supabaseUrl}/functions/v1/mpesa-b2c-callback`,
          ResultURL: `${supabaseUrl}/functions/v1/mpesa-b2c-callback`,
          Occasion: "Earnings",
        }),
      }
    );

    const b2cData = await b2cRes.json();

    if (b2cData.ResponseCode !== "0") {
      // Revert balance on failure
      await adminClient
        .from("profiles")
        .update({ available_balance_kes: amount })
        .eq("user_id", userId);

      if (earning) {
        await adminClient
          .from("earnings")
          .update({ payout_status: "failed" })
          .eq("id", earning.id);
      }

      return new Response(
        JSON.stringify({ error: b2cData.errorMessage || "B2C payout failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Withdrawal initiated", amount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
