import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

interface UpdatePlanPayload {
  plan_id: string;
  description?: string;
  features?: string[];
  apple_product_id?: string | null;
  google_product_id?: string | null;
  amount_cents?: number;
  is_active?: boolean;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

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

    // Verify admin
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      throw new Error("Forbidden - Admin access required");
    }

    const payload: UpdatePlanPayload = await req.json();
    const { plan_id, description, features, apple_product_id, google_product_id, amount_cents, is_active } = payload;

    if (!plan_id) {
      throw new Error("plan_id is required");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch the current plan
    const { data: currentPlan, error: planError } = await adminClient
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !currentPlan) {
      throw new Error("Plan not found");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (description !== undefined) {
      updates.description = description;
    }

    if (features !== undefined) {
      updates.features = features;
    }

    if (apple_product_id !== undefined) {
      updates.apple_product_id = apple_product_id || null;
    }

    if (google_product_id !== undefined) {
      updates.google_product_id = google_product_id || null;
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Handle price change - Stripe prices are immutable, so we need to create a new one
    let newStripePrice: Stripe.Price | null = null;
    if (amount_cents !== undefined && amount_cents !== currentPlan.amount_cents) {
      // Create a new Stripe price
      newStripePrice = await stripe.prices.create({
        product: currentPlan.stripe_product_id,
        unit_amount: amount_cents,
        currency: currentPlan.currency,
        recurring: {
          interval: currentPlan.interval as "day" | "week" | "month" | "year",
        },
        metadata: {
          plan: currentPlan.plan,
          created_by: "admin_update",
        },
      });

      // Archive the old price
      await stripe.prices.update(currentPlan.stripe_price_id, {
        active: false,
      });

      updates.stripe_price_id = newStripePrice.id;
      updates.amount_cents = amount_cents;
    }

    // Update Supabase
    const { data: updatedPlan, error: updateError } = await adminClient
      .from("subscription_plans")
      .update(updates)
      .eq("id", plan_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update plan: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: updatedPlan,
        stripe_price_created: newStripePrice ? newStripePrice.id : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
