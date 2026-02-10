import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Price IDs from Stripe (configure in .env)
const PRICE_IDS: Record<string, string> = {
  signature: process.env.STRIPE_SIGNATURE_PRICE_ID!,
  studio: process.env.STRIPE_STUDIO_PRICE_ID!,
  individual: process.env.STRIPE_SIGNATURE_PRICE_ID!, // Same as signature
  salon: process.env.STRIPE_SALON_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const { plan, email, source } = await request.json();

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];

    // Look up user by email if provided
    let customerId: string | undefined;
    let userId: string | undefined;

    if (email) {
      // Check if user exists in Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, stripe_customer_id')
        .eq('email', email)
        .single();

      if (profile) {
        userId = profile.id;
        customerId = profile.stripe_customer_id || undefined;
      }

      // If no Stripe customer, check Stripe directly
      if (!customerId) {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      customer_email: customerId ? undefined : email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        plan,
        source,
        user_id: userId || '',
      },
      subscription_data: {
        metadata: {
          plan,
          source,
          user_id: userId || '',
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
