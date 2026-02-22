import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { otp } = await req.json();
    if (!otp || otp.length !== 6) {
      return new Response(JSON.stringify({ error: "6-digit OTP required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storedOtp = user.user_metadata?.phone_otp;
    const otpExpiry = user.user_metadata?.phone_otp_expiry;
    const otpNumber = user.user_metadata?.phone_otp_number;

    if (!storedOtp || !otpExpiry) {
      return new Response(JSON.stringify({ error: "No OTP requested. Send OTP first." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date() > new Date(otpExpiry)) {
      return new Response(JSON.stringify({ error: "OTP expired. Request a new one." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (otp !== storedOtp) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OTP is valid — update profile with verified phone number
    await supabase.from("profiles").update({ phone_number: otpNumber }).eq("user_id", user.id);

    // Clear OTP from metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { phone_otp: null, phone_otp_expiry: null, phone_otp_number: null },
    });

    return new Response(JSON.stringify({ success: true, phone: otpNumber }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
