import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    // Get the current user
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const payload = await req.json();
    const { invite_id, action } = payload;

    if (!invite_id) {
      throw new Error("Missing invite_id");
    }

    if (!action || !["accept", "decline"].includes(action)) {
      throw new Error("Invalid action. Must be 'accept' or 'decline'");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch the invite and verify it belongs to this user
    const { data: invite, error: inviteError } = await adminClient
      .from("salon_invites")
      .select(`
        *,
        salon:salons(id, name, owner_id, max_staff),
        access_code:staff_access_codes(id, used_count, max_uses)
      `)
      .eq("id", invite_id)
      .eq("invited_user_id", user.id)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invite not found or you don't have permission to access it");
    }

    if (invite.status !== "pending") {
      throw new Error(`This invite has already been ${invite.status}`);
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await adminClient
        .from("salon_invites")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", invite_id);
      throw new Error("This invite has expired");
    }

    // Handle decline
    if (action === "decline") {
      await adminClient
        .from("salon_invites")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invite_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Invite declined",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle accept
    // 1. Check if salon has room (seat limit)
    const { data: currentStaff } = await adminClient
      .from("profiles")
      .select("id")
      .eq("salon_id", invite.salon_id);

    const currentCount = currentStaff?.length || 0;
    const maxStaff = invite.salon?.max_staff || 5;

    if (currentCount >= maxStaff) {
      throw new Error(
        "This salon has reached its team member limit. The salon owner needs to purchase additional seats."
      );
    }

    // 2. Check if user has an active individual subscription that needs to be cancelled
    let subscriptionCancelled = false;
    let cancellationDetails: { plan?: string; cancel_at?: string } = {};

    const { data: entitlement } = await adminClient
      .from("entitlements")
      .select("stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .single();

    if (
      entitlement &&
      entitlement.status === "active" &&
      entitlement.stripe_subscription_id &&
      (entitlement.plan === "individual" || entitlement.plan === "signature" || entitlement.plan === "studio")
    ) {
      // Cancel the individual subscription at period end
      try {
        const subscription = await stripe.subscriptions.update(
          entitlement.stripe_subscription_id,
          {
            cancel_at_period_end: true,
          }
        );

        // Update entitlements to reflect cancel_at_period_end
        await adminClient
          .from("entitlements")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        // Update subscription_records
        await adminClient
          .from("subscription_records")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("source", "stripe");

        subscriptionCancelled = true;
        cancellationDetails = {
          plan: entitlement.plan,
          cancel_at: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        console.log(`Cancelled individual subscription for user ${user.id} joining salon`);
      } catch (stripeError) {
        console.error("Failed to cancel subscription:", stripeError);
        // Don't fail the whole operation, but log it
      }
    }

    // 3. Update user's profile to join the salon
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        salon_id: invite.salon_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw new Error("Failed to join salon: " + profileError.message);
    }

    // 4. Mark invite as accepted
    await adminClient
      .from("salon_invites")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite_id);

    // 5. Increment access code used_count if there's an associated code
    if (invite.access_code_id && invite.access_code) {
      await adminClient
        .from("staff_access_codes")
        .update({
          used_count: (invite.access_code.used_count || 0) + 1,
        })
        .eq("id", invite.access_code_id);
    }

    // 6. Notify the salon owner (optional - via push notification)
    try {
      const { data: userProfile } = await adminClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (invite.salon?.owner_id) {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: invite.salon.owner_id,
            title: "New Team Member Joined!",
            body: `${userProfile?.full_name || userProfile?.email || "A team member"} has accepted your invite to join ${invite.salon.name}.`,
            data: {
              type: "team_member_joined",
              salon_id: invite.salon_id,
            },
          }),
        });
      }
    } catch (notifyError) {
      console.error("Failed to send notification to salon owner:", notifyError);
      // Don't fail the operation
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `You have joined ${invite.salon?.name || "the salon"}!`,
        salon_id: invite.salon_id,
        salon_name: invite.salon?.name,
        subscription_cancelled: subscriptionCancelled,
        cancellation_details: subscriptionCancelled ? cancellationDetails : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Accept salon invite error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
