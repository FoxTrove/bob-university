import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Apple Sign in with Apple Server-to-Server Notification Types
 * https://developer.apple.com/documentation/sign_in_with_apple/processing_changes_for_sign_in_with_apple_accounts
 */
type AppleEventType =
  | "consent-revoked"    // User revoked consent for your app
  | "account-delete"     // User deleted their Apple ID
  | "email-disabled"     // Private relay email disabled
  | "email-enabled";     // Private relay email enabled

interface AppleNotificationPayload {
  iss: string;           // Issuer (https://appleid.apple.com)
  aud: string;           // Your app's bundle ID
  iat: number;           // Issued at timestamp
  jti: string;           // Unique identifier for the event
  events: string;        // JSON string containing the event data
}

interface AppleEvent {
  type: AppleEventType;
  sub: string;           // User's unique Apple ID (matches apple_user_id in profiles)
  event_time: number;    // Unix timestamp
  email?: string;        // User's email (if available)
  is_private_email?: string; // "true" or "false"
}

/**
 * Decode JWT payload without verification
 * Apple signs these with their private key - in production you may want to verify
 */
function decodeJwtPayload(jwt: string): AppleNotificationPayload | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = new TextDecoder().decode(base64Decode(padded.replace(/-/g, "+").replace(/_/g, "/")));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Apple sends the JWT in the request body as "payload"
    const body = await req.text();
    const params = new URLSearchParams(body);
    const signedPayload = params.get("payload");

    if (!signedPayload) {
      console.error("No payload received");
      return new Response(
        JSON.stringify({ error: "No payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the JWT payload
    const jwtPayload = decodeJwtPayload(signedPayload);
    if (!jwtPayload) {
      console.error("Failed to decode JWT payload");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the events JSON
    const eventData: AppleEvent = JSON.parse(jwtPayload.events);
    const { type, sub: appleUserId, event_time } = eventData;

    console.log(`Apple auth event: ${type} for user ${appleUserId}`);

    // Find the user by their Apple ID
    // Note: You need to store apple_user_id in profiles during sign-up
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("apple_user_id", appleUserId)
      .single();

    if (profileError || !profile) {
      console.log(`No user found for Apple ID: ${appleUserId}`);
      // Return 200 to acknowledge receipt even if user not found
      return new Response(
        JSON.stringify({ success: true, message: "User not found, event acknowledged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle the event
    switch (type) {
      case "consent-revoked":
        // User revoked consent - sign them out and optionally flag account
        console.log(`User ${profile.id} revoked Sign in with Apple consent`);

        // Sign out all sessions for this user
        await supabaseAdmin.auth.admin.signOut(profile.id, "global");

        // Optionally update profile to flag the revocation
        await supabaseAdmin
          .from("profiles")
          .update({
            apple_consent_revoked: true,
            apple_consent_revoked_at: new Date(event_time * 1000).toISOString()
          })
          .eq("id", profile.id);
        break;

      case "account-delete":
        // User deleted their Apple ID - handle account deletion
        console.log(`User ${profile.id} deleted their Apple ID`);

        // Sign out all sessions
        await supabaseAdmin.auth.admin.signOut(profile.id, "global");

        // Mark profile as deleted (soft delete) or trigger deletion workflow
        await supabaseAdmin
          .from("profiles")
          .update({
            apple_account_deleted: true,
            apple_account_deleted_at: new Date(event_time * 1000).toISOString(),
            // You may want to anonymize data here or trigger a deletion workflow
          })
          .eq("id", profile.id);

        // Optionally: Cancel any active subscriptions
        // await cancelUserSubscriptions(profile.id);
        break;

      case "email-disabled":
        // Private relay email was disabled
        console.log(`User ${profile.id} disabled private relay email`);
        await supabaseAdmin
          .from("profiles")
          .update({ apple_private_email_enabled: false })
          .eq("id", profile.id);
        break;

      case "email-enabled":
        // Private relay email was re-enabled
        console.log(`User ${profile.id} enabled private relay email`);
        await supabaseAdmin
          .from("profiles")
          .update({ apple_private_email_enabled: true })
          .eq("id", profile.id);
        break;

      default:
        console.log(`Unknown event type: ${type}`);
    }

    // Log the event for audit purposes
    await supabaseAdmin.from("apple_auth_events").insert({
      user_id: profile.id,
      apple_user_id: appleUserId,
      event_type: type,
      event_time: new Date(event_time * 1000).toISOString(),
      raw_payload: jwtPayload,
    }).catch((e) => {
      // Table may not exist, that's okay
      console.log("Could not log event (table may not exist):", e.message);
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Apple auth webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
