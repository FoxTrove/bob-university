import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  salon_name: string | null;
  years_experience: string | null;
  role: string | null;
  skills_assessment: Record<string, string> | null;
  ghl_contact_id: string | null;
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

function splitName(fullName: string | null): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

async function createOrUpdateGHLContact(
  apiKey: string,
  locationId: string,
  profile: Profile
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  const { firstName, lastName } = splitName(profile.full_name);

  const contactData: GHLContact = {
    email: profile.email,
    firstName,
    lastName,
  };

  if (profile.phone) contactData.phone = profile.phone;
  if (profile.salon_name) contactData.companyName = profile.salon_name;

  if (profile.city || profile.state || profile.country) {
    contactData.address = {};
    if (profile.city) contactData.address.city = profile.city;
    if (profile.state) contactData.address.state = profile.state;
    if (profile.country) contactData.address.country = profile.country;
  }

  // Add tags based on profile data
  const tags: string[] = ["app_user"];
  if (profile.role) tags.push(`role_${profile.role}`);
  if (profile.skills_assessment?.role) tags.push(`assessment_${profile.skills_assessment.role}`);
  contactData.tags = tags;

  // Custom fields for assessment data
  const customFields: Array<{ key: string; field_value: string }> = [];
  if (profile.years_experience) {
    customFields.push({ key: "years_experience", field_value: profile.years_experience });
  }
  if (profile.skills_assessment) {
    if (profile.skills_assessment.role) {
      customFields.push({ key: "app_role", field_value: profile.skills_assessment.role });
    }
    if (profile.skills_assessment.goal) {
      customFields.push({ key: "app_goal", field_value: profile.skills_assessment.goal });
    }
    if (profile.skills_assessment.challenge) {
      customFields.push({ key: "app_challenge", field_value: profile.skills_assessment.challenge });
    }
    if (profile.skills_assessment.experience) {
      customFields.push({ key: "app_experience", field_value: profile.skills_assessment.experience });
    }
  }
  if (customFields.length > 0) {
    contactData.customFields = customFields;
  }

  try {
    // First try to find existing contact by email
    const searchResponse = await fetch(
      `${GHL_API_BASE}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(profile.email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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

    if (contactId) {
      // Update existing contact
      const updateResponse = await fetch(
        `${GHL_API_BASE}/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return { success: false, error: `Update failed: ${errorText}` };
      }

      return { success: true, contactId };
    } else {
      // Create new contact
      const createResponse = await fetch(
        `${GHL_API_BASE}/contacts/?locationId=${locationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        return { success: false, error: `Create failed: ${errorText}` };
      }

      const createData = await createResponse.json();
      return { success: true, contactId: createData.contact?.id };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
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
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization Header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      throw new Error("Forbidden - Admin access required");
    }

    // Get GHL credentials
    const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const ghlLocationId = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GHL credentials not configured",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all profiles using service role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, phone, city, state, country, salon_name, years_experience, role, skills_assessment, ghl_contact_id")
      .order("created_at", { ascending: false });

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    let synced = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const p of profiles || []) {
      if (!p.email) continue;

      const result = await createOrUpdateGHLContact(ghlApiKey, ghlLocationId, p as Profile);

      if (result.success) {
        synced++;

        // Store the GHL contact ID if we got one
        if (result.contactId && result.contactId !== p.ghl_contact_id) {
          await adminClient
            .from("profiles")
            .update({ ghl_contact_id: result.contactId })
            .eq("id", p.id);
        }
      } else {
        errors++;
        errorDetails.push(`${p.email}: ${result.error}`);
      }

      // Rate limiting - GHL has rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        errors,
        total: profiles?.length || 0,
        message: `Synced ${synced} of ${profiles?.length || 0} users to GHL`,
        errorDetails: errors > 0 ? errorDetails.slice(0, 5) : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GHL bulk sync error:", error);
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
