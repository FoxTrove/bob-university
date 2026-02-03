import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

interface SyncPayload {
  user_id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  salon_name?: string | null;
  years_experience?: string | null;
  role?: string | null;
  skills_assessment?: Record<string, string> | null;
  action: "INSERT" | "UPDATE";
  tags?: string[];
}

interface GHLContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  tags?: string[];
  customFields?: Array<{ key: string; field_value: string }>;
}

function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
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
    // Get GHL credentials
    const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const ghlLocationId = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!ghlApiKey || !ghlLocationId) {
      // GHL not configured, skip silently
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "GHL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: SyncPayload = await req.json();

    if (!payload.email) {
      throw new Error("Email is required");
    }

    const { firstName, lastName } = splitName(payload.full_name);

    const contactData: GHLContact = {
      email: payload.email,
      firstName,
      lastName,
    };

    if (payload.phone) contactData.phone = payload.phone;
    if (payload.salon_name) contactData.companyName = payload.salon_name;

    if (payload.city || payload.state || payload.country) {
      contactData.address = {};
      if (payload.city) contactData.address.city = payload.city;
      if (payload.state) contactData.address.state = payload.state;
      if (payload.country) contactData.address.country = payload.country;
    }

    // Add tags
    const tags: string[] = ["app_user"];
    if (payload.action === "INSERT") tags.push("new_signup");
    if (payload.role) tags.push(`role_${payload.role}`);
    if (payload.skills_assessment?.role) tags.push(`assessment_${payload.skills_assessment.role}`);
    if (payload.tags) tags.push(...payload.tags);
    contactData.tags = tags;

    // Custom fields
    const customFields: Array<{ key: string; field_value: string }> = [];
    if (payload.years_experience) {
      customFields.push({ key: "years_experience", field_value: payload.years_experience });
    }
    if (payload.skills_assessment) {
      if (payload.skills_assessment.role) {
        customFields.push({ key: "app_role", field_value: payload.skills_assessment.role });
      }
      if (payload.skills_assessment.goal) {
        customFields.push({ key: "app_goal", field_value: payload.skills_assessment.goal });
      }
      if (payload.skills_assessment.challenge) {
        customFields.push({ key: "app_challenge", field_value: payload.skills_assessment.challenge });
      }
      if (payload.skills_assessment.experience) {
        customFields.push({ key: "app_experience", field_value: payload.skills_assessment.experience });
      }
    }
    if (customFields.length > 0) {
      contactData.customFields = customFields;
    }

    // Try to find existing contact by email
    const searchResponse = await fetch(
      `${GHL_API_BASE}/contacts/search/duplicate?locationId=${ghlLocationId}&email=${encodeURIComponent(payload.email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );

    let contactId: string | undefined;

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.contact?.id) {
        contactId = searchData.contact.id;
      }
    }

    let response: Response;

    if (contactId) {
      // Update existing contact
      response = await fetch(
        `${GHL_API_BASE}/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );
    } else {
      // Create new contact
      response = await fetch(
        `${GHL_API_BASE}/contacts/?locationId=${ghlLocationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const newContactId = result.contact?.id || contactId;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Update profile with GHL contact ID if we have it
    if (newContactId && payload.user_id) {
      if (supabaseUrl && serviceKey) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        await adminClient
          .from("profiles")
          .update({ ghl_contact_id: newContactId })
          .eq("id", payload.user_id);
      }
    }

    // For new signups, send welcome email and trigger GHL workflow
    if (payload.action === "INSERT" && payload.email) {
      try {
        // Send welcome email via send-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            to: payload.email,
            template: "welcome",
            data: {
              firstName: firstName || "there",
            },
            user_id: payload.user_id,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Welcome email failed:", await emailResponse.text());
        }

        // Trigger GHL workflow for welcome sequence
        const ghlEventResponse = await fetch(`${supabaseUrl}/functions/v1/ghl-event-trigger`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            event: "user.signup",
            email: payload.email,
            user_id: payload.user_id,
            contact: { firstName, lastName },
            data: {
              signup_date: new Date().toISOString(),
              role: payload.skills_assessment?.role || payload.role,
              goal: payload.skills_assessment?.goal,
            },
          }),
        });

        if (!ghlEventResponse.ok) {
          console.error("GHL event trigger failed:", await ghlEventResponse.text());
        }
      } catch (emailError) {
        console.error("Email/GHL trigger error:", emailError);
        // Don't fail the sync if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        contact_id: newContactId,
        action: contactId ? "updated" : "created",
        welcome_email_sent: payload.action === "INSERT",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GHL contact sync error:", error);
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
