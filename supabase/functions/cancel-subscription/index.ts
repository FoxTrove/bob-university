import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization Header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error("Missing Supabase environment configuration");
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const payload = await req.json();
    const { reason, details } = payload;

    // Get user's current subscription from entitlements
    const { data: entitlement, error: entitlementError } = await supabaseClient
      .from("entitlements")
      .select("stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .single();

    if (entitlementError || !entitlement) {
      throw new Error("No active subscription found");
    }

    if (!entitlement.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found. You may have an Apple subscription - please cancel through your Apple ID settings.");
    }

    if (entitlement.status !== "active") {
      throw new Error("Subscription is not active");
    }

    // Cancel at period end (user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      entitlement.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Save exit survey
    if (reason) {
      await adminClient.from("exit_surveys").insert({
        user_id: user.id,
        reason,
        details: details || null,
        subscription_id: entitlement.stripe_subscription_id,
        plan: entitlement.plan,
      });
    }

    // Update entitlements to reflect cancel_at_period_end
    await adminClient
      .from("entitlements")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Update subscription_records
    await adminClient
      .from("subscription_records")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("source", "stripe");

    // Trigger GHL event for cancellation
    try {
      await fetch(`${supabaseUrl}/functions/v1/ghl-event-trigger`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "subscription_cancelled",
          user_id: user.id,
          metadata: {
            plan: entitlement.plan,
            reason,
            cancel_at: new Date(subscription.current_period_end * 1000).toISOString(),
          },
        }),
      });
    } catch (ghlError) {
      console.error("GHL event trigger failed:", ghlError);
      // Don't fail the request if GHL fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your subscription will be cancelled at the end of your billing period.",
        cancel_at: new Date(subscription.current_period_end * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
