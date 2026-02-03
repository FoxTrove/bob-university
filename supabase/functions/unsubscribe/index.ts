import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Map of preference fields to human-readable names
const preferenceLabels: Record<string, string> = {
  learning_updates: "learning updates",
  progress_milestones: "progress milestones",
  payment_receipts: "payment receipts",
  subscription_updates: "subscription updates",
  certification_updates: "certification updates",
  event_confirmations: "event confirmations",
  event_reminders: "event reminders",
  promotional_emails: "promotional emails",
  newsletter: "newsletter",
  tips_and_tutorials: "tips and tutorials",
  community_notifications: "community notifications",
};

function generateHtmlResponse(success: boolean, message: string, preference?: string): string {
  const bgColor = success ? "#22c55e" : "#ef4444";
  const icon = success ? "&#10003;" : "&#10007;";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Unsubscribed" : "Error"} - Bob University</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #18181b;
      color: #ffffff;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 400px;
      text-align: center;
      padding: 40px 20px;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #a1a1aa;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #C68976;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
    }
    .button:hover {
      background-color: #b07a69;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${success ? "You've been unsubscribed" : "Something went wrong"}</h1>
    <p>${message}</p>
    <a href="https://app.bobuniversity.com/notifications" class="button">Manage Preferences</a>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlResponse(false, "Invalid unsubscribe link. Please try again or manage your preferences in the app."),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    // Decode and verify the signed token
    let tokenData: { user_id: string; preference: string; timestamp: number; sig?: string };
    try {
      tokenData = JSON.parse(atob(token));
    } catch {
      return new Response(
        generateHtmlResponse(false, "Invalid unsubscribe link. The link may have expired or been corrupted."),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    const { user_id, preference, timestamp, sig } = tokenData;

    // Verify HMAC signature if present
    const tokenSecret = Deno.env.get("UNSUBSCRIBE_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (sig) {
      const encoder = new TextEncoder();
      const dataToVerify = JSON.stringify({ user_id, preference, timestamp });

      try {
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(tokenSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        // Convert hex signature back to ArrayBuffer
        const sigBytes = new Uint8Array(sig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

        const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(dataToVerify));

        if (!isValid) {
          return new Response(
            generateHtmlResponse(false, "Invalid unsubscribe link. The link may have been tampered with."),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "text/html" }
            }
          );
        }
      } catch (verifyError) {
        console.error("Signature verification error:", verifyError);
        return new Response(
          generateHtmlResponse(false, "Invalid unsubscribe link. Please try using the link from a recent email."),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          }
        );
      }
    }

    // Validate token age (7 days max)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    if (Date.now() - timestamp > maxAge) {
      return new Response(
        generateHtmlResponse(false, "This unsubscribe link has expired. Please use the link from a more recent email or manage your preferences in the app."),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    // Validate preference field
    if (!preferenceLabels[preference]) {
      return new Response(
        generateHtmlResponse(false, "Invalid preference type. Please manage your preferences in the app."),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    // Update the preference
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { error: updateError } = await adminClient
      .from("notification_preferences")
      .update({ [preference]: false, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Failed to update preference:", updateError);
      return new Response(
        generateHtmlResponse(false, "We couldn't update your preferences. Please try again or manage them in the app."),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    // Optionally sync to GHL (remove marketing tag if marketing preference)
    if (preference === "promotional_emails" || preference === "newsletter") {
      try {
        await fetch(`${supabaseUrl}/functions/v1/ghl-tag-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            user_id,
            add_tags: ["marketing_optout"],
          }),
        });
      } catch (ghlError) {
        console.error("GHL tag update failed:", ghlError);
        // Don't fail the request for GHL sync failures
      }
    }

    const preferenceName = preferenceLabels[preference];
    return new Response(
      generateHtmlResponse(
        true,
        `You've been unsubscribed from ${preferenceName}. You can re-enable this or manage other preferences in the app.`
      ),
      {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      generateHtmlResponse(false, "An unexpected error occurred. Please try again or manage your preferences in the app."),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      }
    );
  }
});
