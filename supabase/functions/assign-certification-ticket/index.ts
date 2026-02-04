import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface AssignTicketPayload {
  salon_id: string;
  assigned_to_user_id: string;
  certification_id: string;
  notes?: string;
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

    const payload: AssignTicketPayload = await req.json();
    const { salon_id, assigned_to_user_id, certification_id, notes } = payload;

    if (!salon_id || !assigned_to_user_id || !certification_id) {
      throw new Error("Missing required fields: salon_id, assigned_to_user_id, certification_id");
    }

    // Verify user is owner of this salon
    const { data: salon, error: salonError } = await adminClient
      .from("salons")
      .select("id, name, owner_id")
      .eq("id", salon_id)
      .single();

    if (salonError || !salon) {
      throw new Error("Salon not found");
    }

    if (salon.owner_id !== user.id) {
      throw new Error("You are not the owner of this salon");
    }

    // Verify the assigned user is part of this salon
    const { data: assignee, error: assigneeError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, salon_id")
      .eq("id", assigned_to_user_id)
      .single();

    if (assigneeError || !assignee) {
      throw new Error("Team member not found");
    }

    if (assignee.salon_id !== salon_id) {
      throw new Error("This user is not a member of your salon");
    }

    // Check available tickets
    const { data: ticketPool, error: poolError } = await adminClient
      .from("salon_certification_tickets")
      .select("*")
      .eq("salon_id", salon_id)
      .single();

    if (poolError || !ticketPool) {
      throw new Error("No ticket pool found for this salon");
    }

    if (ticketPool.available_tickets < 1) {
      throw new Error("No available tickets. Purchase more tickets to assign certifications.");
    }

    // Check if this user already has an active assignment for this certification
    const { data: existingAssignment } = await adminClient
      .from("certification_ticket_assignments")
      .select("id, status")
      .eq("assigned_to_user_id", assigned_to_user_id)
      .eq("certification_id", certification_id)
      .in("status", ["assigned", "redeemed"])
      .single();

    if (existingAssignment) {
      throw new Error("This team member already has an active ticket for this certification");
    }

    // Get certification details for notification
    const { data: certification, error: certError } = await adminClient
      .from("certification_settings")
      .select("title")
      .eq("id", certification_id)
      .single();

    if (certError || !certification) {
      throw new Error("Certification not found");
    }

    // Create the assignment
    const { data: assignment, error: assignError } = await adminClient
      .from("certification_ticket_assignments")
      .insert({
        salon_id,
        assigned_to_user_id,
        assigned_by_user_id: user.id,
        certification_id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    if (assignError) {
      throw new Error(`Failed to create assignment: ${assignError.message}`);
    }

    // Decrement available tickets
    const { error: updateError } = await adminClient
      .from("salon_certification_tickets")
      .update({
        available_tickets: ticketPool.available_tickets - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketPool.id);

    if (updateError) {
      // Rollback the assignment if ticket update fails
      await adminClient
        .from("certification_ticket_assignments")
        .delete()
        .eq("id", assignment.id);
      throw new Error(`Failed to update ticket pool: ${updateError.message}`);
    }

    // Send push notification to the assigned user
    const { data: tokens } = await adminClient
      .from("push_tokens")
      .select("token")
      .eq("user_id", assigned_to_user_id);

    const pushTokens = (tokens || [])
      .map((row) => row.token)
      .filter((t) => Boolean(t));

    let notificationSent = false;

    if (pushTokens.length > 0) {
      const messages = pushTokens.map((tokenValue) => ({
        to: tokenValue,
        title: "Certification Ticket Assigned",
        body: `You've been assigned a ${certification.title} ticket from ${salon.name}!`,
        data: { deep_link: "/(tabs)/certification" },
      }));

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });

        if (response.ok) {
          notificationSent = true;
        }
      } catch (pushError) {
        console.error("Push notification error:", pushError);
        // Don't fail the whole operation if notification fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignment,
        notification_sent: notificationSent,
        remaining_tickets: ticketPool.available_tickets - 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Assign ticket error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
