import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface NotificationPayload {
  eventId: string;
  userIds: string[];
  eventTitle: string;
  eventDate: string;
  registeredBy: string;
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

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const payload: NotificationPayload = await req.json();
    const { eventId, userIds, eventTitle, eventDate, registeredBy } = payload;

    if (!eventId || !userIds || userIds.length === 0) {
      throw new Error("Missing required fields: eventId, userIds");
    }

    // Format the event date for display
    const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Get push tokens for all user IDs
    const { data: tokens, error: tokensError } = await adminClient
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", userIds);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      throw tokensError;
    }

    const pushTokens = (tokens || [])
      .filter((row) => Boolean(row.token))
      .map((row) => row.token);

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No push tokens found for users",
          notificationsSent: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create push notification messages
    const messages = pushTokens.map((tokenValue) => ({
      to: tokenValue,
      title: "Event Registration Confirmed",
      body: `${registeredBy} registered you for "${eventTitle}" on ${formattedDate}`,
      data: {
        deep_link: `/(tabs)/events/${eventId}`,
        eventId,
        type: "team_event_registration",
      },
    }));

    // Send notifications in batches of 100 (Expo limit)
    let sentCount = 0;
    let failedCount = 0;

    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          failedCount += batch.length;
          console.error("Expo push failed:", await response.text());
          continue;
        }

        const result = await response.json();
        const results = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];

        for (const item of results) {
          if (item?.status === "ok") {
            sentCount += 1;
          } else {
            failedCount += 1;
          }
        }
      } catch (pushError) {
        console.error("Push notification batch error:", pushError);
        failedCount += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: sentCount,
        notificationsFailed: failedCount,
        totalUsers: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Team event notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
