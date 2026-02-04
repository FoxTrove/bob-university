import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { salonId, seatCount } = await req.json();

    if (!salonId) {
      return new Response(JSON.stringify({ error: 'Salon ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!seatCount || seatCount < 1 || seatCount > 20) {
      return new Response(JSON.stringify({ error: 'Invalid seat count (1-20 allowed)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user owns the salon
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salons')
      .select('id, owner_id, name, max_staff, seat_subscription_id')
      .eq('id', salonId)
      .single();

    if (salonError || !salon) {
      return new Response(JSON.stringify({ error: 'Salon not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (salon.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'You are not the owner of this salon' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the additional_seat plan from subscription_plans
    const { data: seatPlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('plan', 'additional_seat')
      .eq('is_active', true)
      .single();

    if (planError || !seatPlan) {
      return new Response(JSON.stringify({ error: 'Additional seat plan not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id || null;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { supabase_uuid: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Check if salon already has a seat subscription
    if (salon.seat_subscription_id) {
      // Update existing subscription quantity
      const existingSubscription = await stripe.subscriptions.retrieve(salon.seat_subscription_id);

      if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
        // Get current quantity and add new seats
        const currentQuantity = existingSubscription.items.data[0]?.quantity || 0;
        const newQuantity = currentQuantity + seatCount;

        const updatedSubscription = await stripe.subscriptions.update(salon.seat_subscription_id, {
          items: [{
            id: existingSubscription.items.data[0].id,
            quantity: newQuantity,
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            userId: user.id,
            salonId: salonId,
            seatCount: newQuantity.toString(),
          },
        });

        // Update salon max_staff immediately
        const additionalSeats = newQuantity;
        const newMaxStaff = 5 + additionalSeats; // Base 5 + purchased seats

        await supabaseAdmin
          .from('salons')
          .update({
            max_staff: newMaxStaff,
            updated_at: new Date().toISOString(),
          })
          .eq('id', salonId);

        return new Response(
          JSON.stringify({
            success: true,
            updated: true,
            subscriptionId: updatedSubscription.id,
            totalSeats: newMaxStaff,
            additionalSeats: newQuantity,
            message: `Added ${seatCount} seat${seatCount > 1 ? 's' : ''}. You now have ${newMaxStaff} total team seats.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create new subscription for seats
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: seatPlan.stripe_price_id, quantity: seatCount }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        salonId: salonId,
        seatCount: seatCount.toString(),
        productType: 'additional_seats',
      },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent as Stripe.PaymentIntent | null;

    if (!paymentIntent?.client_secret) {
      // Cancel the incomplete subscription
      await stripe.subscriptions.cancel(subscription.id);
      return new Response(JSON.stringify({ error: 'Failed to initialize payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the subscription ID on the salon (will be confirmed by webhook)
    await supabaseAdmin
      .from('salons')
      .update({
        seat_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    return new Response(
      JSON.stringify({
        customer: customerId,
        ephemeralKey: ephemeralKey.secret,
        paymentIntent: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        seatCount: seatCount,
        pricePerSeat: seatPlan.amount_cents,
        totalAmount: seatCount * seatPlan.amount_cents,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in purchase-seats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
