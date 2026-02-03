import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

// Helper to call edge functions internally
async function callEdgeFunction(
  functionName: string,
  payload: Record<string, unknown>,
  serviceKey: string
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`${functionName} failed:`, await response.text());
    }
  } catch (error) {
    console.error(`${functionName} error:`, error);
  }
}

// Send transactional email via send-email function
async function sendEmail(
  serviceKey: string,
  to: string,
  template: string,
  data: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await callEdgeFunction('send-email', { to, template, data, user_id: userId }, serviceKey);
}

// Trigger GHL workflow event
async function triggerGHLEvent(
  serviceKey: string,
  event: string,
  email: string,
  data: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await callEdgeFunction('ghl-event-trigger', { event, email, data, user_id: userId }, serviceKey);
}

// Update GHL contact tags
async function updateGHLTags(
  serviceKey: string,
  userId: string,
  addTags?: string[],
  removeTags?: string[]
): Promise<void> {
  await callEdgeFunction('ghl-tag-update', { user_id: userId, add_tags: addTags, remove_tags: removeTags }, serviceKey);
}

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

function mapProductType(value: string | null | undefined): 'subscription' | 'event' | 'certification' | 'other' {
  if (value === 'subscription' || value === 'event' || value === 'certification') {
    return value;
  }
  return 'other';
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
  // Webhooks are server-to-server only - no CORS needed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
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

    async function upsertRevenueLedger({
      userId,
      source,
      productType,
      plan,
      status,
      amountCents,
      feeCents,
      netCents,
      currency,
      externalId,
      paymentIntentId,
      chargeId,
      subscriptionId,
      occurredAt,
      metadata,
    }: {
      userId: string | null;
      source: 'stripe';
      productType: 'subscription' | 'event' | 'certification' | 'other';
      plan?: string | null;
      status: 'completed' | 'pending' | 'refunded' | 'failed';
      amountCents: number;
      feeCents?: number | null;
      netCents?: number | null;
      currency: string;
      externalId?: string | null;
      paymentIntentId?: string | null;
      chargeId?: string | null;
      subscriptionId?: string | null;
      occurredAt?: string | null;
      metadata?: Record<string, unknown> | null;
    }) {
      if (!userId) return;
      await supabase.from('revenue_ledger').insert({
        user_id: userId,
        source,
        platform: 'web',
        product_type: productType,
        plan: plan || null,
        status,
        amount_cents: amountCents,
        fee_cents: feeCents ?? 0,
        net_cents: netCents ?? amountCents,
        currency: currency.toUpperCase(),
        external_id: externalId || null,
        payment_intent_id: paymentIntentId || null,
        charge_id: chargeId || null,
        subscription_id: subscriptionId || null,
        occurred_at: occurredAt || new Date().toISOString(),
        metadata: metadata || {},
      });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, productType, certificationId, eventId } = paymentIntent.metadata || {};

      let feeCents = 0;
      let netCents = paymentIntent.amount;
      const latestChargeId = paymentIntent.latest_charge as string | null;
      if (latestChargeId) {
        const charge = await stripe.charges.retrieve(latestChargeId, {
          expand: ['balance_transaction'],
        });
        if (charge.balance_transaction && typeof charge.balance_transaction !== 'string') {
          feeCents = charge.balance_transaction.fee || 0;
          netCents = charge.balance_transaction.net || paymentIntent.amount - feeCents;
        }
      }

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

        await upsertRevenueLedger({
          userId,
          source: 'stripe',
          productType: mapProductType(productType),
          status: 'completed',
          amountCents: paymentIntent.amount,
          feeCents,
          netCents,
          currency: paymentIntent.currency,
          externalId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          chargeId: paymentIntent.latest_charge as string | null,
          subscriptionId: paymentIntent.invoice as string | null,
          occurredAt: new Date(paymentIntent.created * 1000).toISOString(),
          metadata: paymentIntent.metadata || {},
        });

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

          // Get user email and certification name for notifications
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          const { data: cert } = await supabase
            .from('certifications')
            .select('name')
            .eq('id', certificationId)
            .single();

          if (profile?.email) {
            const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            // Send certification purchased email
            await sendEmail(serviceKey, profile.email, 'certification-purchased', {
              firstName: profile.full_name?.split(' ')[0] || '',
              certificationName: cert?.name || 'Certification',
              amount: (paymentIntent.amount / 100).toFixed(2),
            }, userId);

            // Trigger GHL workflow
            await triggerGHLEvent(serviceKey, 'certification.purchased', profile.email, {
              certification_name: cert?.name,
              amount: paymentIntent.amount / 100,
            }, userId);

            // Update GHL tags
            await updateGHLTags(serviceKey, userId, ['cert_purchased'], ['cert_eligible']);
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
        const recordStatus = subscription.pause_collection?.behavior
          ? 'paused'
          : status;

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

        await supabase.from('subscription_records').upsert(
          {
            user_id: userId,
            source: 'stripe',
            external_id: subscription.id,
            status: recordStatus,
            plan: planRow?.plan || null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            paused_at: subscription.pause_collection?.behavior ? new Date().toISOString() : null,
            provider_metadata: subscription.metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, source' }
        );

        // Send email/GHL notifications based on event type
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          const planName = planRow?.plan === 'individual' ? 'Individual' : planRow?.plan === 'salon' ? 'Salon' : 'Premium';
          const nextBillingDate = new Date(subscription.current_period_end * 1000).toLocaleDateString();

          if (event.type === 'customer.subscription.created') {
            // Send subscription confirmed email
            await sendEmail(serviceKey, profile.email, 'subscription-confirmed', {
              firstName: profile.full_name?.split(' ')[0] || '',
              planName,
              billingPeriod: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'Yearly' : 'Monthly',
              nextBillingDate,
            }, userId);

            // Trigger GHL workflow
            await triggerGHLEvent(serviceKey, 'subscription.created', profile.email, {
              plan: planRow?.plan,
              plan_name: planName,
              next_billing_date: nextBillingDate,
            }, userId);

            // Update GHL tags
            const planTag = planRow?.plan === 'salon' ? 'paid_salon' : 'paid_individual';
            await updateGHLTags(serviceKey, userId, [planTag], ['free_user']);
          }

          if (event.type === 'customer.subscription.deleted') {
            // Trigger GHL workflow for win-back sequence
            await triggerGHLEvent(serviceKey, 'subscription.canceled', profile.email, {
              plan: planRow?.plan,
            }, userId);

            // Update GHL tags
            await updateGHLTags(serviceKey, userId, ['churned'], ['paid_individual', 'paid_salon']);
          }
        }
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

      let feeCents = 0;
      let netCents = invoice.amount_paid;
      if (invoice.charge) {
        const charge = await stripe.charges.retrieve(invoice.charge as string, {
          expand: ['balance_transaction'],
        });
        if (charge.balance_transaction && typeof charge.balance_transaction !== 'string') {
          feeCents = charge.balance_transaction.fee || 0;
          netCents = charge.balance_transaction.net || invoice.amount_paid - feeCents;
        }
      }

      if (userId && priceId) {
        const planRow = await supabase
          .from('subscription_plans')
          .select('plan')
          .eq('stripe_price_id', priceId)
          .single();

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

        await upsertRevenueLedger({
          userId,
          source: 'stripe',
          productType: 'subscription',
          plan: planRow.data?.plan || null,
          status: 'completed',
          amountCents: invoice.amount_paid,
          feeCents,
          netCents,
          currency: invoice.currency,
          externalId: invoice.id,
          paymentIntentId: invoice.payment_intent as string | null,
          chargeId: invoice.charge as string | null,
          subscriptionId: subscriptionId,
          occurredAt: invoice.created
            ? new Date(invoice.created * 1000).toISOString()
            : new Date().toISOString(),
          metadata: invoice.metadata || {},
        });

        // Send payment receipt email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          await sendEmail(serviceKey, profile.email, 'payment-receipt', {
            firstName: profile.full_name?.split(' ')[0] || '',
            amount: (invoice.amount_paid / 100).toFixed(2),
            description: 'Bob University Subscription',
            date: invoice.created
              ? new Date(invoice.created * 1000).toLocaleDateString()
              : new Date().toLocaleDateString(),
            receiptId: invoice.id,
          }, userId);
        }
      }
    }

    // Handle failed payments for dunning flow
    if (event.type === 'invoice.payment_failed') {
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

      if (userId) {
        // Update entitlement status to past_due
        await supabase.from('entitlements').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        // Get user email for notifications
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

          // Send payment failed email
          await sendEmail(serviceKey, profile.email, 'payment-failed', {
            firstName: profile.full_name?.split(' ')[0] || '',
            amount: (invoice.amount_due / 100).toFixed(2),
            reason: 'Payment method declined',
          }, userId);

          // Trigger GHL dunning workflow
          await triggerGHLEvent(serviceKey, 'payment.failed', profile.email, {
            amount: invoice.amount_due / 100,
            subscription_id: subscriptionId,
          }, userId);

          // Add payment_failed tag
          await updateGHLTags(serviceKey, userId, ['payment_failed']);
        }
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string | null;
      const userId = await resolveUserId({
        customerId: charge.customer as string | null,
        metadata: charge.metadata,
      });

      await upsertRevenueLedger({
        userId,
        source: 'stripe',
        productType: 'other',
        status: 'refunded',
        amountCents: charge.amount_refunded || charge.amount,
        feeCents: 0,
        netCents: -(charge.amount_refunded || charge.amount),
        currency: charge.currency,
        externalId: charge.id,
        paymentIntentId,
        chargeId: charge.id,
        subscriptionId: charge.invoice as string | null,
        occurredAt: charge.created
          ? new Date(charge.created * 1000).toISOString()
          : new Date().toISOString(),
        metadata: charge.metadata || {},
      });
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
