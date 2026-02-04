import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const APPLE_VERIFY_RECEIPT_URL_PRODUCTION = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_RECEIPT_URL_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppleReceiptResponse {
  status: number;
  environment?: "Production" | "Sandbox";
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
  }>;
}

// Map Apple product IDs to our plan names
function getPlanFromProductId(productId: string): string | null {
  if (productId.includes("signature")) return "signature";
  if (productId.includes("studio")) return "studio";
  if (productId.includes("individual")) return "individual"; // Legacy support
  if (productId.includes("salon")) return "salon";
  return null;
}

// Verify receipt with Apple
async function verifyReceipt(
  receipt: string,
  sharedSecret: string
): Promise<AppleReceiptResponse> {
  // Try production first
  let response = await fetch(APPLE_VERIFY_RECEIPT_URL_PRODUCTION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receipt,
      password: sharedSecret,
      "exclude-old-transactions": true,
    }),
  });

  let data: AppleReceiptResponse = await response.json();

  // Status 21007 means it's a sandbox receipt
  if (data.status === 21007) {
    response = await fetch(APPLE_VERIFY_RECEIPT_URL_SANDBOX, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receipt,
        password: sharedSecret,
        "exclude-old-transactions": true,
      }),
    });
    data = await response.json();
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sharedSecret = Deno.env.get("APPLE_SHARED_SECRET");
    if (!sharedSecret) {
      throw new Error("APPLE_SHARED_SECRET not configured");
    }

    const body = await req.json();
    const { receipt, productId, transactionId, userId } = body;

    if (!receipt) {
      throw new Error("Receipt is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Verify receipt with Apple
    const verificationResult = await verifyReceipt(receipt, sharedSecret);

    if (verificationResult.status !== 0) {
      throw new Error(`Apple verification failed with status: ${verificationResult.status}`);
    }

    // Get the latest subscription info
    const latestReceipt = verificationResult.latest_receipt_info?.[0] ||
      verificationResult.receipt?.in_app?.[0];

    if (!latestReceipt) {
      throw new Error("No subscription found in receipt");
    }

    const plan = getPlanFromProductId(latestReceipt.product_id);
    if (!plan) {
      throw new Error(`Unknown product ID: ${latestReceipt.product_id}`);
    }

    const expiresDateMs = latestReceipt.expires_date_ms
      ? parseInt(latestReceipt.expires_date_ms)
      : null;
    const purchaseDateMs = parseInt(latestReceipt.purchase_date_ms);

    const isActive = expiresDateMs ? expiresDateMs > Date.now() : true;
    const autoRenewStatus = verificationResult.pending_renewal_info?.[0]?.auto_renew_status === "1";

    // Update entitlements
    const { error: entitlementError } = await supabaseAdmin
      .from("entitlements")
      .upsert(
        {
          user_id: userId,
          plan: isActive ? plan : "free",
          status: isActive ? "active" : "expired",
          current_period_start: new Date(purchaseDateMs).toISOString(),
          current_period_end: expiresDateMs
            ? new Date(expiresDateMs).toISOString()
            : null,
          cancel_at_period_end: !autoRenewStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (entitlementError) {
      console.error("Entitlement update error:", entitlementError);
      throw new Error("Failed to update entitlements");
    }

    // Record subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from("subscription_records")
      .upsert(
        {
          user_id: userId,
          source: "apple",
          external_id: latestReceipt.original_transaction_id,
          status: isActive ? "active" : "expired",
          plan,
          current_period_start: new Date(purchaseDateMs).toISOString(),
          current_period_end: expiresDateMs
            ? new Date(expiresDateMs).toISOString()
            : null,
          cancel_at_period_end: !autoRenewStatus,
          provider_metadata: {
            transaction_id: latestReceipt.transaction_id,
            original_transaction_id: latestReceipt.original_transaction_id,
            environment: verificationResult.environment,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source,external_id" }
      );

    if (subscriptionError) {
      console.error("Subscription record error:", subscriptionError);
    }

    // Get plan price for revenue tracking
    const { data: planData } = await supabaseAdmin
      .from("subscription_plans")
      .select("amount_cents")
      .eq("plan", plan)
      .single();

    // Record revenue (only for new transactions, not renewals we've already seen)
    const { data: existingRevenue } = await supabaseAdmin
      .from("revenue_ledger")
      .select("id")
      .eq("external_id", latestReceipt.transaction_id)
      .single();

    if (!existingRevenue && planData) {
      // Apple takes 15-30% commission, estimate at 15% for small business
      const appleFee = Math.round(planData.amount_cents * 0.15);

      await supabaseAdmin.from("revenue_ledger").insert({
        user_id: userId,
        source: "apple",
        platform: "ios",
        product_type: "subscription",
        plan,
        status: "completed",
        amount_cents: planData.amount_cents,
        fee_cents: appleFee,
        net_cents: planData.amount_cents - appleFee,
        currency: "USD",
        external_id: latestReceipt.transaction_id,
        subscription_id: latestReceipt.original_transaction_id,
        occurred_at: new Date(purchaseDateMs).toISOString(),
        metadata: {
          environment: verificationResult.environment,
          product_id: latestReceipt.product_id,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan,
        status: isActive ? "active" : "expired",
        expiresAt: expiresDateMs ? new Date(expiresDateMs).toISOString() : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Apple IAP error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
