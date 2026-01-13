import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type NotificationType = "comment" | "reaction" | "feedback_request";

interface NotificationPayload {
  type: NotificationType;
  post_id: string;
  actor_id: string;
  target_user_id?: string; // For direct notifications, otherwise we look up the post author
  comment_id?: string;
  reaction_type?: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase environment configuration");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const payload: NotificationPayload = await req.json();
    const { type, post_id, actor_id, target_user_id, comment_id, reaction_type } = payload;

    if (!type || !post_id || !actor_id) {
      throw new Error("Missing required fields: type, post_id, actor_id");
    }

    // Get the post to find the author
    const { data: post, error: postError } = await adminClient
      .from("community_posts")
      .select("user_id, content")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      throw new Error("Post not found");
    }

    // Determine who to notify
    const notifyUserId = target_user_id || post.user_id;

    // Don't notify yourself
    if (notifyUserId === actor_id) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "Actor is the same as target" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get actor info for the notification message
    const { data: actor } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", actor_id)
      .single();

    const actorName = actor?.full_name || "Someone";

    // Build notification content based on type
    let title = "";
    let body = "";
    let deepLink = `/community/${post_id}`;

    switch (type) {
      case "comment":
        title = "New Comment";
        body = `${actorName} commented on your post`;
        if (comment_id) {
          deepLink = `/community/${post_id}?comment=${comment_id}`;
        }
        break;

      case "reaction":
        const reactionEmoji = getReactionEmoji(reaction_type);
        title = "New Reaction";
        body = `${actorName} reacted ${reactionEmoji} to your post`;
        break;

      case "feedback_request":
        title = "Feedback Requested";
        body = `${actorName} is asking for feedback on their haircut`;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await adminClient
      .from("push_tokens")
      .select("token")
      .eq("user_id", notifyUserId);

    if (tokensError) {
      throw tokensError;
    }

    const pushTokens = (tokens || [])
      .map((row) => row.token)
      .filter((t) => Boolean(t));

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "No push tokens for user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications
    const messages = pushTokens.map((token) => ({
      to: token,
      title,
      body,
      data: { deep_link: deepLink },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo push failed: ${errorText}`);
    }

    const result = await response.json();
    const results = Array.isArray(result?.data) ? result.data : [];

    let sentCount = 0;
    let failedCount = 0;

    for (const item of results) {
      if (item?.status === "ok") {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    // If no detailed results, assume all sent
    if (results.length === 0) {
      sentCount = pushTokens.length;
    }

    return new Response(
      JSON.stringify({ sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Community notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getReactionEmoji(reactionType?: string): string {
  switch (reactionType) {
    case "fire":
      return "🔥";
    case "haircut":
      return "💇";
    case "helpful":
      return "💡";
    case "like":
    default:
      return "❤️";
  }
}
