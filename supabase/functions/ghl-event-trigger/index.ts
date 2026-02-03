import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

// Event types that can trigger GHL workflows
type GHLEventType =
  | "user.signup"
  | "subscription.created"
  | "subscription.canceled"
  | "subscription.renewed"
  | "payment.success"
  | "payment.failed"
  | "payment.recovered"
  | "module.completed"
  | "certification.purchased"
  | "certification.submitted"
  | "certification.approved"
  | "certification.rejected"
  | "event.ticket_purchased"
  | "event.reminder_24h"
  | "user.inactive_14d"
  | "user.inactive_30d";

interface GHLEventPayload {
  event: GHLEventType;
  user_id?: string;
  email: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  data?: Record<string, unknown>;
}

interface GHLWebhookPayload {
  event: string;
  timestamp: string;
  contact: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  data: Record<string, unknown>;
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
    const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const ghlLocationId = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");
    const ghlWebhookBaseUrl = Deno.env.get("GOHIGHLEVEL_WEBHOOK_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!ghlApiKey || !ghlLocationId) {
      // GHL not configured, skip silently
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "GHL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: GHLEventPayload = await req.json();

    if (!payload.event || !payload.email) {
      throw new Error("Missing required fields: event, email");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get user profile if user_id provided but contact info missing
    let firstName = payload.contact?.firstName || "";
    let lastName = payload.contact?.lastName || "";
    let phone = payload.contact?.phone;
    let ghlContactId: string | undefined;

    if (payload.user_id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone, ghl_contact_id")
        .eq("id", payload.user_id)
        .single();

      if (profile) {
        if (!firstName && profile.full_name) {
          const parts = profile.full_name.trim().split(" ");
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }
        if (!phone && profile.phone) {
          phone = profile.phone;
        }
        ghlContactId = profile.ghl_contact_id;
      }
    }

    // Build webhook payload
    const webhookPayload: GHLWebhookPayload = {
      event: payload.event,
      timestamp: new Date().toISOString(),
      contact: {
        email: payload.email,
        firstName,
        lastName,
        ...(phone && { phone }),
      },
      data: payload.data || {},
    };

    // If we have a webhook base URL configured, POST to the event-specific webhook
    // GHL workflow webhooks are typically: {base_url}/{workflow_id} or {base_url}?event={event_type}
    if (ghlWebhookBaseUrl) {
      const webhookUrl = `${ghlWebhookBaseUrl}?event=${encodeURIComponent(payload.event)}`;

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error(
          `GHL webhook failed: ${webhookResponse.status} - ${await webhookResponse.text()}`
        );
        // Don't throw - webhook failures shouldn't break the flow
      }
    }

    // Also add workflow trigger via GHL API if contact exists
    if (ghlContactId) {
      // Optionally trigger a workflow directly via GHL API
      // This requires knowing the workflow ID, which would be configured per event type
      // For now, we rely on inbound webhooks to GHL workflows
      console.log(`GHL contact ${ghlContactId} triggered event: ${payload.event}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: payload.event,
        contact_id: ghlContactId,
        webhook_sent: !!ghlWebhookBaseUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GHL event trigger error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
