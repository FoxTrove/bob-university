import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'past_due';
  }
}

async function resolveUserId({
  customerId,
  metadata,
}: {
  customerId?: string | null;
  metadata?: Stripe.Metadata;
}): Promise<string | null> {
  if (metadata?.userId) return metadata.userId;

  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!('deleted' in customer)) {
      const customerMetadata = customer.metadata;
      if (customerMetadata?.supabase_uuid) return customerMetadata.supabase_uuid;
    }
  }

  return null;
}

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, productType, certificationId, eventId } = paymentIntent.metadata || {};

      if (userId) {
        const { error: purchaseError } = await supabase.from('purchases').insert({
          user_id: userId,
          source: 'stripe',
          product_type: productType || 'unknown',
          product_id: certificationId || eventId || 'unknown',
          external_id: paymentIntent.id,
          status: 'completed',
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        });

        if (purchaseError) {
          console.error('Failed to record purchase:', purchaseError);
          throw purchaseError;
        }

        if (productType === 'certification' && certificationId) {
          const { error: certError } = await supabase
            .from('user_certifications')
            .upsert(
              {
                user_id: userId,
                certification_id: certificationId,
                status: 'pending',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, certification_id' }
            );

          if (certError) {
            console.error('Failed to update certification status:', certError);
          }
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id || null;

      const userId = await resolveUserId({
        customerId: subscription.customer as string | null,
        metadata: subscription.metadata,
      });

      if (userId && priceId) {
        const { data: planRow } = await supabase
          .from('subscription_plans')
          .select('plan')
          .eq('stripe_price_id', priceId)
          .single();

        const status = mapSubscriptionStatus(subscription.status);

        await supabase.from('entitlements').upsert(
          {
            user_id: userId,
            plan: planRow?.plan || 'free',
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      const customerId = invoice.customer as string | null;

      let subscription: Stripe.Subscription | null = null;
      if (subscriptionId) {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
      }

      const userId = await resolveUserId({
        customerId,
        metadata: subscription?.metadata || invoice.metadata,
      });

      const priceId = subscription?.items.data[0]?.price?.id || null;

      if (userId && priceId) {
        await supabase.from('purchases').insert({
          user_id: userId,
          source: 'stripe',
          product_type: 'subscription',
          product_id: priceId,
          external_id: invoice.id,
          status: 'completed',
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          metadata: invoice.metadata,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
