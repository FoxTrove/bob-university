import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

type ActionType =
  | "cancel"
  | "resume"
  | "pause"
  | "resume_from_pause"
  | "update_plan"
  | "refund";

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

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\\s+/i, "");
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      throw new Error("Forbidden");
    }

    const payload = await req.json();
    const action = payload?.action as ActionType;
    const source = payload?.source as string;

    if (!action) {
      throw new Error("Action is required");
    }

    if (action !== "refund" && source !== "stripe") {
      throw new Error("Only Stripe subscriptions can be managed right now");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    if (action === "refund") {
      const paymentIntentId = payload?.payment_intent_id as string | undefined;
      const chargeId = payload?.charge_id as string | undefined;
      const invoiceId = payload?.invoice_id as string | undefined;
      const amount = payload?.amount_cents as number | undefined;

      let refundParams: Stripe.RefundCreateParams = {};

      if (paymentIntentId) {
        refundParams.payment_intent = paymentIntentId;
      } else if (chargeId) {
        refundParams.charge = chargeId;
      } else if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (invoice.payment_intent) {
          refundParams.payment_intent = invoice.payment_intent as string;
        }
      }

      if (!refundParams.payment_intent && !refundParams.charge) {
        throw new Error("Refund requires payment_intent_id, charge_id, or invoice_id");
      }

      if (typeof amount === "number" && amount > 0) {
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);
      return new Response(JSON.stringify({ refund }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptionId = payload?.subscription_id as string | undefined;
    if (!subscriptionId) {
      throw new Error("subscription_id is required");
    }

    let subscription: Stripe.Subscription;

    if (action === "cancel") {
      const atPeriodEnd = payload?.at_period_end !== false;
      if (atPeriodEnd) {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      }
    } else if (action === "resume") {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } else if (action === "pause") {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: "mark_uncollectible" },
      });
    } else if (action === "resume_from_pause") {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: null,
      });
    } else if (action === "update_plan") {
      const priceId = payload?.price_id as string | undefined;
      if (!priceId) {
        throw new Error("price_id is required for update_plan");
      }
      const current = await stripe.subscriptions.retrieve(subscriptionId);
      const itemId = current.items.data[0]?.id;
      if (!itemId) {
        throw new Error("Subscription item not found");
      }
      subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: itemId, price: priceId }],
      });
    } else {
      throw new Error("Unsupported action");
    }

    const userId = (subscription.metadata?.userId as string | undefined) || null;
    const priceId = subscription.items.data[0]?.price?.id || null;
    const { data: planRow } = await adminClient
      .from("subscription_plans")
      .select("plan")
      .eq("stripe_price_id", priceId)
      .single();

    if (userId) {
      await adminClient.from("entitlements").upsert(
        {
          user_id: userId,
          plan: planRow?.plan || "free",
          status: subscription.status === "canceled" ? "canceled" : "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      await adminClient.from("subscription_records").upsert(
        {
          user_id: userId,
          source: "stripe",
          external_id: subscription.id,
          status: subscription.pause_collection?.behavior ? "paused" : "active",
          plan: planRow?.plan || null,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          paused_at: subscription.pause_collection?.behavior ? new Date().toISOString() : null,
          provider_metadata: subscription.metadata || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, source" },
      );
    }

    return new Response(JSON.stringify({ subscription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
