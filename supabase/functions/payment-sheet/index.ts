import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        throw new Error('User not found');
    }

    const { amountCents, certificationId, eventId, description } = await req.json();

    if (!amountCents) {
        throw new Error('Amount is required');
    }

    // Validate amount against actual product price to prevent manipulation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let expectedAmount: number | null = null;

    if (certificationId) {
      const { data: cert } = await supabaseAdmin
        .from('certification_settings')
        .select('price_cents')
        .eq('id', certificationId)
        .single();
      expectedAmount = cert?.price_cents;
    } else if (eventId) {
      const { data: event } = await supabaseAdmin
        .from('events')
        .select('price_cents, early_bird_price_cents, early_bird_deadline')
        .eq('id', eventId)
        .single();

      if (event) {
        // Check if early bird pricing applies
        const now = new Date();
        const earlyBirdDeadline = event.early_bird_deadline ? new Date(event.early_bird_deadline) : null;
        if (earlyBirdDeadline && now < earlyBirdDeadline && event.early_bird_price_cents) {
          expectedAmount = event.early_bird_price_cents;
        } else {
          expectedAmount = event.price_cents;
        }
      }
    }

    if (expectedAmount !== null && amountCents !== expectedAmount) {
      throw new Error(`Invalid amount. Expected ${expectedAmount}, received ${amountCents}`);
    }

    // 1. Get user profile to check for existing Stripe Customer ID
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .single();
    
    let customerId = profile?.stripe_customer_id;
    const email = profile?.email || user.email;

    // 2. Create customer in Stripe if they don't exist
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: email,
            metadata: { supabase_uuid: user.id }
        });
        customerId = customer.id;
        
        // Save back to profile
        await supabaseClient
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
    }

    // 3. Create Ephemeral Key (required for mobile Payment Sheet)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    // 4. Create PaymentIntent
    // We expect amount in cents (e.g. 29700 for $297.00)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      description: description || 'Bob University Purchase',
      metadata: {
        userId: user.id,
        certificationId: certificationId || null,
        eventId: eventId || null,
        productType: certificationId ? 'certification' : (eventId ? 'event' : 'onetime')
      }
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in payment-sheet:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
