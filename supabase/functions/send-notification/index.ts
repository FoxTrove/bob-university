import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type Audience = "all" | "subscribers" | "free";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function normalizeAudience(value: string | undefined): Audience {
  if (value === "subscribers" || value === "free") return value;
  return "all";
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

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "owner"].includes(profile.role)) {
      throw new Error("Forbidden");
    }

    const payload = await req.json();
    const title = typeof payload?.title === "string" ? payload.title.trim() : "";
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    const deepLink = typeof payload?.deep_link === "string"
      ? payload.deep_link.trim()
      : "";
    const audience = normalizeAudience(payload?.audience);
    const scheduleFor = payload?.schedule_for
      ? new Date(payload.schedule_for)
      : null;

    if (!title) {
      throw new Error("Title is required");
    }
    if (!body) {
      throw new Error("Body is required");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const scheduled =
      scheduleFor instanceof Date &&
      !Number.isNaN(scheduleFor.getTime()) &&
      scheduleFor.getTime() > Date.now();

    const { data: campaign, error: campaignError } = await adminClient
      .from("notification_campaigns")
      .insert({
        title,
        body,
        deep_link: deepLink || null,
        audience,
        status: scheduled ? "scheduled" : "sent",
        scheduled_for: scheduled ? scheduleFor?.toISOString() : null,
        sent_at: scheduled ? null : new Date().toISOString(),
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError) {
      throw campaignError;
    }

    if (scheduled) {
      return new Response(
        JSON.stringify({ campaign, scheduled: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userIds: string[] | null = null;
    if (audience !== "all") {
      const { data: entitlements, error: entError } = await adminClient
        .from("entitlements")
        .select("user_id, plan, status");

      if (entError) {
        throw entError;
      }

      userIds = (entitlements || [])
        .filter((entitlement) => {
          if (audience === "subscribers") {
            return entitlement.status === "active" &&
              (entitlement.plan === "individual" || entitlement.plan === "salon");
          }
          return entitlement.plan === "free";
        })
        .map((entitlement) => entitlement.user_id);
    }

    let tokenQuery = adminClient.from("push_tokens").select("token");
    if (userIds && userIds.length > 0) {
      tokenQuery = tokenQuery.in("user_id", userIds);
    } else if (userIds && userIds.length === 0) {
      await adminClient
        .from("notification_campaigns")
        .update({
          sent_count: 0,
          failed_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return new Response(
        JSON.stringify({ campaign, sent: 0, failed: 0, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: tokens, error: tokensError } = await tokenQuery;
    if (tokensError) {
      throw tokensError;
    }

    const pushTokens = (tokens || [])
      .map((row) => row.token)
      .filter((tokenValue) => Boolean(tokenValue));

    if (pushTokens.length === 0) {
      await adminClient
        .from("notification_campaigns")
        .update({
          sent_count: 0,
          failed_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return new Response(
        JSON.stringify({ campaign, sent: 0, failed: 0, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const messages = pushTokens.map((tokenValue) => ({
      to: tokenValue,
      title,
      body,
      data: deepLink ? { deep_link: deepLink } : undefined,
    }));

    let sentCount = 0;
    let failedCount = 0;

    for (const batch of chunk(messages, 100)) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        failedCount += batch.length;
        continue;
      }

      const result = await response.json();
      const results = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];

      if (results.length === 0) {
        sentCount += batch.length;
        continue;
      }

      for (const item of results) {
        if (item?.status === "ok") {
          sentCount += 1;
        } else {
          failedCount += 1;
        }
      }
    }

    await adminClient
      .from("notification_campaigns")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return new Response(
      JSON.stringify({
        campaign,
        sent: sentCount,
        failed: failedCount,
        total: pushTokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
