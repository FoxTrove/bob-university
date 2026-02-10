'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

// Plan configurations matching mobile app
const PLANS = {
  signature: {
    name: 'Signature',
    price: '$69',
    period: '/month',
    description: 'Full course access',
    priceId: process.env.NEXT_PUBLIC_STRIPE_SIGNATURE_PRICE_ID,
    features: [
      'Core curriculum & vault',
      'Monthly live workshop',
      'Celebrity cut breakdown',
      'Full community access',
      'Stylist directory listing',
      'Certification eligible ($297)',
    ],
  },
  studio: {
    name: 'Studio',
    price: '$149',
    period: '/month',
    description: 'Direct access to Ray',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID,
    popular: true,
    features: [
      'Everything in Signature',
      'Weekly "Ask Ray" live sessions',
      'Demand (business/pricing content)',
      'Studio-only replays',
      'Reserved seats at live events',
      'Certification eligible ($297)',
    ],
  },
  individual: {
    name: 'Signature',
    price: '$69',
    period: '/month',
    description: 'Full course access',
    priceId: process.env.NEXT_PUBLIC_STRIPE_SIGNATURE_PRICE_ID,
    features: [
      'Core curriculum & vault',
      'Monthly live workshop',
      'Celebrity cut breakdown',
      'Full community access',
      'Stylist directory listing',
      'Certification eligible ($297)',
    ],
  },
  salon: {
    name: 'Salon',
    price: '$150',
    period: '/month',
    description: 'Train your entire team',
    priceId: process.env.NEXT_PUBLIC_STRIPE_SALON_PRICE_ID,
    features: [
      '5 team seats included',
      'All Signature + Studio content',
      'Team progress dashboard',
      '~30% off certifications',
      'Reserved event seats for team',
      'Priority support',
    ],
  },
};

function SubscribeContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'signature';
  const email = searchParams.get('email') || '';
  const source = searchParams.get('source') || 'web';

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(planId);

  const plan = PLANS[selectedPlan as keyof typeof PLANS] || PLANS.signature;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          source,
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            Subscribe to Bob University
          </h1>
          <p className="text-gray-400">
            Master cutting techniques with expert-led courses
          </p>
        </div>

        {/* Plan Selector */}
        <div className="flex gap-2 mb-6">
          {Object.entries(PLANS).map(([id, p]) => {
            if (id === 'individual') return null; // Skip duplicate
            return (
              <button
                key={id}
                onClick={() => setSelectedPlan(id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlan === id
                    ? 'bg-primary text-white'
                    : 'bg-surface text-gray-400 hover:bg-surface/80'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Selected Plan Card */}
        <div
          className={`bg-surface rounded-2xl p-6 mb-6 border-2 ${
            plan.popular ? 'border-primary' : 'border-gray-800'
          }`}
        >
          {plan.popular && (
            <div className="bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full inline-block mb-4">
              Most Popular
            </div>
          )}

          <h2 className="text-2xl font-serif font-bold text-white mb-1">
            {plan.name}
          </h2>
          <div className="flex items-baseline mb-2">
            <span className="text-4xl font-serif font-bold text-white">
              {plan.price}
            </span>
            <span className="text-gray-400 ml-1">{plan.period}</span>
          </div>
          <p className="text-gray-400 mb-6 pb-6 border-b border-gray-800">
            {plan.description}
          </p>

          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-primary flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-white">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>

        {/* Info */}
        <p className="text-gray-500 text-xs text-center">
          Payments are processed securely by Stripe. You can cancel at any time
          in your account settings.
        </p>

        {source === 'ios_app' && (
          <p className="text-gray-500 text-xs text-center mt-4">
            After subscribing, return to the Bob University app to access your
            content.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}
