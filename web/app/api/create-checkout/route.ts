import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
let supabase: SupabaseClient | null = null;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

// Price IDs from Stripe (configure in .env)
// Founders Pricing (Feb 2026 Launch)
const PRICE_IDS: Record<string, string> = {
  // Individual plans
  signature: process.env.STRIPE_SIGNATURE_PRICE_ID!, // $49/mo
  studio: process.env.STRIPE_STUDIO_PRICE_ID!, // $97/mo (Founders)
  'studio-annual': process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID!, // $970/yr (Founders)
  individual: process.env.STRIPE_SIGNATURE_PRICE_ID!, // Legacy, same as signature
  // One-time purchases
  certification: process.env.STRIPE_CERTIFICATION_PRICE_ID!, // $297 one-time
  // Salon plans
  'virtual-salon': process.env.STRIPE_VIRTUAL_SALON_PRICE_ID!, // $3,000/yr
  'inperson-cert': process.env.STRIPE_INPERSON_CERT_PRICE_ID!, // $9,500 one-time
  'inperson-cert-founders': process.env.STRIPE_INPERSON_CERT_FOUNDERS_PRICE_ID!, // $7,500 one-time (limited)
};

export async function POST(request: NextRequest) {
  try {
    const { plan, email, source } = await request.json();

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    const stripeClient = getStripe();
    const supabaseClient = getSupabase();

    // Look up user by email if provided
    let customerId: string | undefined;
    let userId: string | undefined;

    if (email) {
      // Check if user exists in Supabase
      const { data: profile } = await supabaseClient
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
        const customers = await stripeClient.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      }
    }

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create({
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
