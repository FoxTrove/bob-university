import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

console.log('Manage Event Function Initialized');

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Debug logging
    const authHeader = req.headers.get('Authorization');
    console.log('RAW AUTH HEADER:', authHeader); 

    if (!authHeader) {
        throw new Error('Missing Authorization Header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Authenticate and authorize (Admin only) using explicit token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) {
        console.error('User fetch error:', userError);
    }
    
    if (!user) {
        throw new Error('Unauthorized: No user found. Auth header was ' + (authHeader ? 'present' : 'missing'));
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    console.log('User Role:', profile?.role);

    if (profile?.role !== 'admin') {
        throw new Error(`Forbidden: User role is ${profile?.role}, required admin`);
    }

    const eventData = await req.json();
    const { 
        event_id,
        title, 
        description, 
        event_date, 
        event_end_date, 
        location, 
        venue_name, 
        venue_address, 
        max_capacity, 
        price_cents, 
        early_bird_price_cents, 
        early_bird_deadline, 
        collection_id, 
        is_published, 
        registration_open 
    } = eventData;

    if (!title || !event_date) {
        throw new Error('Title and Event Date are required');
    }

    let stripeProductId = null;
    let stripePriceId = null;
    let existingEvent = null;

    if (event_id) {
        const { data: existing, error: fetchError } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', event_id)
            .single();
        if (fetchError) throw fetchError;
        existingEvent = existing;
    }

    if (price_cents && price_cents > 0) {
        if (existingEvent?.stripe_product_id) {
            stripeProductId = existingEvent.stripe_product_id;
        } else {
            console.log('Creating Stripe Product for event:', title);
            const product = await stripe.products.create({
                name: title,
                description: description || undefined,
                metadata: {
                    type: 'event',
                    location: location || 'TBD'
                }
            });
            stripeProductId = product.id;
        }

        if (existingEvent?.stripe_price_id && existingEvent?.price_cents === price_cents) {
            stripePriceId = existingEvent.stripe_price_id;
        } else {
            console.log('Creating Stripe Price');
            const price = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: price_cents,
                currency: 'usd',
            });
            stripePriceId = price.id;
        }
    } else if (existingEvent?.stripe_product_id) {
        stripeProductId = existingEvent.stripe_product_id;
        stripePriceId = null;
    }

    if (event_id) {
        const { data: updatedEvent, error: updateError } = await supabaseClient
            .from('events')
            .update({
                title,
                description,
                event_date,
                event_end_date,
                location,
                venue_name,
                venue_address,
                max_capacity,
                price_cents,
                early_bird_price_cents,
                early_bird_deadline,
                collection_id,
                is_published,
                registration_open,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId
            })
            .eq('id', event_id)
            .select()
            .single();

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify(updatedEvent),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const { data: newEvent, error: insertError } = await supabaseClient
        .from('events')
        .insert({
            title,
            description,
            event_date,
            event_end_date,
            location,
            venue_name,
            venue_address,
            max_capacity,
            price_cents,
            early_bird_price_cents,
            early_bird_deadline,
            collection_id,
            is_published,
            registration_open,
            stripe_product_id: stripeProductId,
            stripe_price_id: stripePriceId
        })
        .select()
        .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify(newEvent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
