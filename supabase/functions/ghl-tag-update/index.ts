import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

interface TagUpdatePayload {
  user_id?: string;
  email?: string;
  ghl_contact_id?: string;
  add_tags?: string[];
  remove_tags?: string[];
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "GHL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: TagUpdatePayload = await req.json();

    if (!payload.add_tags?.length && !payload.remove_tags?.length) {
      throw new Error("Must provide add_tags or remove_tags");
    }

    if (!payload.ghl_contact_id && !payload.user_id && !payload.email) {
      throw new Error("Must provide ghl_contact_id, user_id, or email");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    let ghlContactId = payload.ghl_contact_id;
    let email = payload.email;

    // Look up GHL contact ID from user_id if needed
    if (!ghlContactId && payload.user_id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("ghl_contact_id, email")
        .eq("id", payload.user_id)
        .single();

      if (profile) {
        ghlContactId = profile.ghl_contact_id;
        email = email || profile.email;
      }
    }

    // If still no contact ID, look up by email in GHL
    if (!ghlContactId && email) {
      const searchResponse = await fetch(
        `${GHL_API_BASE}/contacts/search/duplicate?locationId=${ghlLocationId}&email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            Version: "2021-07-28",
            Accept: "application/json",
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.contact?.id) {
          ghlContactId = searchData.contact.id;

          // Update profile with GHL contact ID if we have user_id
          if (payload.user_id) {
            await adminClient
              .from("profiles")
              .update({ ghl_contact_id: ghlContactId })
              .eq("id", payload.user_id);
          }
        }
      }
    }

    if (!ghlContactId) {
      throw new Error("Could not find GHL contact");
    }

    // Get current contact to preserve existing tags
    const contactResponse = await fetch(
      `${GHL_API_BASE}/contacts/${ghlContactId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );

    if (!contactResponse.ok) {
      throw new Error(`Failed to fetch contact: ${contactResponse.status}`);
    }

    const contactData = await contactResponse.json();
    let currentTags: string[] = contactData.contact?.tags || [];

    // Add new tags
    if (payload.add_tags?.length) {
      for (const tag of payload.add_tags) {
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
        }
      }
    }

    // Remove tags
    if (payload.remove_tags?.length) {
      currentTags = currentTags.filter(
        (tag) => !payload.remove_tags!.includes(tag)
      );
    }

    // Update contact with new tags
    const updateResponse = await fetch(
      `${GHL_API_BASE}/contacts/${ghlContactId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ tags: currentTags }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`GHL API error: ${updateResponse.status} - ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        contact_id: ghlContactId,
        tags: currentTags,
        added: payload.add_tags || [],
        removed: payload.remove_tags || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GHL tag update error:", error);
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
