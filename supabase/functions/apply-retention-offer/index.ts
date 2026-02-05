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

// Retention offer coupon ID (create this in Stripe dashboard or via API)
const RETENTION_COUPON_ID = "bob_retention_2mo_free";

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
    const { reason, offerType } = payload;

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
      throw new Error(
        "No Stripe subscription ID found. Apple subscriptions cannot receive this offer."
      );
    }

    if (entitlement.status !== "active") {
      throw new Error("Subscription is not active");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if user already received a retention offer
    const { data: existingOffer } = await adminClient
      .from("retention_offers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingOffer) {
      throw new Error("You have already received a retention offer");
    }

    // Ensure the retention coupon exists, create if not
    let coupon: Stripe.Coupon;
    try {
      coupon = await stripe.coupons.retrieve(RETENTION_COUPON_ID);
    } catch {
      // Coupon doesn't exist, create it
      coupon = await stripe.coupons.create({
        id: RETENTION_COUPON_ID,
        percent_off: 100,
        duration: "repeating",
        duration_in_months: 2,
        name: "Retention Offer - 2 Months Free",
        metadata: {
          type: "retention",
          created_by: "apply-retention-offer",
        },
      });
    }

    // Apply the coupon to the subscription
    const subscription = await stripe.subscriptions.update(
      entitlement.stripe_subscription_id,
      {
        coupon: RETENTION_COUPON_ID,
      }
    );

    // If subscription was set to cancel, unset that
    if (subscription.cancel_at_period_end) {
      await stripe.subscriptions.update(entitlement.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
    }

    // Calculate the new "free until" date (2 months from now)
    const freeUntil = new Date();
    freeUntil.setMonth(freeUntil.getMonth() + 2);

    // Record the retention offer
    await adminClient.from("retention_offers").insert({
      user_id: user.id,
      offer_type: offerType || "two_months_free",
      reason: reason || null,
      stripe_coupon_id: RETENTION_COUPON_ID,
      stripe_subscription_id: entitlement.stripe_subscription_id,
      free_until: freeUntil.toISOString(),
      accepted_at: new Date().toISOString(),
    });

    // Update entitlements to reflect that cancel is no longer pending
    await adminClient
      .from("entitlements")
      .update({
        cancel_at_period_end: false,
        retention_offer_applied: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Update subscription_records
    await adminClient
      .from("subscription_records")
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("source", "stripe");

    // Trigger GHL event for retention offer accepted
    try {
      await fetch(`${supabaseUrl}/functions/v1/ghl-event-trigger`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "retention_offer_accepted",
          user_id: user.id,
          metadata: {
            plan: entitlement.plan,
            reason,
            offer_type: offerType,
            free_until: freeUntil.toISOString(),
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
        message: "Retention offer applied successfully!",
        free_until: freeUntil.toISOString(),
        months_free: 2,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Apply retention offer error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
