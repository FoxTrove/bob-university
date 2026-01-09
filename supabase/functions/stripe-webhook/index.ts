import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
      return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    let event;
    
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { userId, productType, certificationId, eventId } = paymentIntent.metadata;

        console.log(`Processing successful payment for user ${userId}, type: ${productType}`);

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Must use SERVICE ROLE KEY for webhooks
        );

        // 1. Record Purchase
        const { error: purchaseError } = await supabase.from('purchases').insert({
            user_id: userId,
            source: 'stripe',
            product_type: productType || 'unknown',
            product_id: certificationId || eventId || 'unknown',
            external_id: paymentIntent.id,
            status: 'completed',
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata
        });

        if (purchaseError) {
            console.error('Failed to record purchase:', purchaseError);
            throw purchaseError;
        }

        // 2. Certification Specific Logic
        if (productType === 'certification' && certificationId) {
             // Create or update user_certification to Pending
             const { error: certError } = await supabase
                .from('user_certifications')
                .upsert({
                    user_id: userId,
                    certification_id: certificationId,
                    status: 'pending', // Purchased = ready for submission/pending
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, certification_id' }); // Assuming unique constraint exists

            if (certError) {
                console.error('Failed to update certification status:', certError);
                // Don't fail the webhook if purchase was recorded, but log it
            }
        }
        
        // 3. Event Specific Logic (if needed later, e.g. ticket generation)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
