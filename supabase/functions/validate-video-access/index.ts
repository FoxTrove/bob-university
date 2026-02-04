import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoAccessResult {
  hasAccess: boolean;
  reason?: string;
  video?: {
    id: string;
    title: string;
    mux_playback_id: string | null;
    is_free: boolean;
    drip_days: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ hasAccess: false, reason: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ hasAccess: false, reason: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get video ID from request
    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(
        JSON.stringify({ hasAccess: false, reason: "Video ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch video details
    const { data: video, error: videoError } = await supabaseAdmin
      .from("videos")
      .select(`
        id,
        title,
        mux_playback_id,
        is_free,
        is_published,
        drip_days,
        video_library:video_library_id (
          mux_playback_id
        )
      `)
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return new Response(
        JSON.stringify({ hasAccess: false, reason: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if video is published
    if (!video.is_published) {
      return new Response(
        JSON.stringify({ hasAccess: false, reason: "Video not available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Free videos are accessible to everyone
    if (video.is_free) {
      const playbackId = video.mux_playback_id || video.video_library?.mux_playback_id;
      return new Response(
        JSON.stringify({
          hasAccess: true,
          video: {
            id: video.id,
            title: video.title,
            mux_playback_id: playbackId,
            is_free: true,
            drip_days: video.drip_days || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's entitlement
    const { data: entitlement } = await supabaseAdmin
      .from("entitlements")
      .select("plan, status, current_period_start, current_period_end")
      .eq("user_id", user.id)
      .single();

    const isPremium =
      entitlement &&
      entitlement.status === "active" &&
      ["individual", "signature", "studio", "salon"].includes(entitlement.plan) &&
      (!entitlement.current_period_end ||
        new Date(entitlement.current_period_end) > new Date());

    if (!isPremium) {
      return new Response(
        JSON.stringify({
          hasAccess: false,
          reason: "Premium subscription required",
          video: {
            id: video.id,
            title: video.title,
            mux_playback_id: null,
            is_free: false,
            drip_days: video.drip_days || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check content dripping
    const dripDays = video.drip_days || 0;
    if (dripDays > 0 && entitlement?.current_period_start) {
      const subscriptionStart = new Date(entitlement.current_period_start);
      const dripUnlockDate = new Date(subscriptionStart);
      dripUnlockDate.setDate(dripUnlockDate.getDate() + dripDays);

      if (new Date() < dripUnlockDate) {
        const daysUntilUnlock = Math.ceil(
          (dripUnlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return new Response(
          JSON.stringify({
            hasAccess: false,
            reason: `This content unlocks in ${daysUntilUnlock} day${daysUntilUnlock === 1 ? "" : "s"}`,
            video: {
              id: video.id,
              title: video.title,
              mux_playback_id: null,
              is_free: false,
              drip_days: dripDays,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // User has access
    const playbackId = video.mux_playback_id || video.video_library?.mux_playback_id;
    return new Response(
      JSON.stringify({
        hasAccess: true,
        video: {
          id: video.id,
          title: video.title,
          mux_playback_id: playbackId,
          is_free: false,
          drip_days: dripDays,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ hasAccess: false, reason: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
