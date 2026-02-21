import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const PAYSTACK_WEBHOOK_SECRET = Deno.env.get("PAYSTACK_WEBHOOK_SECRET") || "";

    // Verify webhook signature
    if (PAYSTACK_WEBHOOK_SECRET) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(PAYSTACK_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const hash = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (hash !== signature) {
        return new Response("Invalid signature", { status: 400, headers: corsHeaders });
      }
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { headers: corsHeaders });
    }

    const { reference, metadata, amount } = event.data;
    const userId = metadata?.user_id;
    const plan = metadata?.plan || metadata?.custom_fields?.[0]?.value;

    if (!userId) {
      return new Response("No user_id in metadata", { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update payment status
    await adminClient
      .from("payments")
      .update({ status: "completed" })
      .eq("stripe_payment_id", reference);

    // Activate subscription
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await adminClient
      .from("profiles")
      .update({
        subscription_plan: plan === "annual" ? "annual" : "monthly",
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    return new Response("OK", { headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
