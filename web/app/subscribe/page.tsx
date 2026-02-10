'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

// Individual Plan configurations
const INDIVIDUAL_PLANS = {
  signature: {
    name: 'Signature',
    monthlyPrice: 49,
    annualPrice: null,
    description: 'Core education access',
    features: [
      'Core curriculum & vault',
      'Monthly live workshop',
      'Celebrity cut breakdown',
      'Full community access',
      'Stylist directory listing',
      'Certification eligible',
    ],
  },
  studio: {
    name: 'Studio',
    monthlyPrice: 127,
    annualPrice: 1200,
    description: 'Direct access to Ray',
    popular: true,
    features: [
      'Everything in Signature',
      'Weekly "Ask Ray" live sessions',
      'Demand (business/pricing content)',
      'Studio-only replays',
      'Reserved seats at live events',
      'Priority support',
    ],
  },
};

// Salon Plan configurations
const SALON_PLANS = {
  foundations: {
    name: 'Foundations',
    price: 1500,
    period: '/year',
    description: 'Education-only access',
    features: [
      '5 team seats included',
      'Signature-level content access',
      'Team progress dashboard',
      'Admin management tools',
      'Swap team members anytime',
    ],
  },
  'studio-team': {
    name: 'Studio Team',
    price: 4500,
    period: '/year',
    description: 'Full team access + certifications',
    popular: true,
    features: [
      '5 team seats included',
      'All Signature + Studio content',
      '3 certifications included',
      'Weekly "Ask Ray" live sessions',
      'Reserved event seats for team',
      'Priority support',
    ],
    savings: 'Save $3,000+ vs individual plans',
  },
};

type UserType = 'individual' | 'salon';

function UserTypeToggle({
  userType,
  onChange,
}: {
  userType: UserType;
  onChange: (type: UserType) => void;
}) {
  return (
    <div className="flex bg-surface rounded-xl p-1 mb-8">
      <button
        onClick={() => onChange('individual')}
        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
          userType === 'individual'
            ? 'bg-primary text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Individual Stylist
      </button>
      <button
        onClick={() => onChange('salon')}
        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
          userType === 'salon'
            ? 'bg-primary text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Salon Team
      </button>
    </div>
  );
}

function BillingToggle({
  isAnnual,
  onToggle,
  disabled,
  savingsPercent,
}: {
  isAnnual: boolean;
  onToggle: () => void;
  disabled: boolean;
  savingsPercent?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>
        Monthly
      </span>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          disabled
            ? 'bg-gray-700 cursor-not-allowed'
            : isAnnual ? 'bg-primary' : 'bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
            isAnnual ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
        Annual
      </span>
      {!disabled && savingsPercent && (
        <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
          Save {savingsPercent}%
        </span>
      )}
    </div>
  );
}

function IndividualPlanCard({
  plan,
  planKey,
  isAnnual,
  isSelected,
  onSelect,
}: {
  plan: typeof INDIVIDUAL_PLANS.signature;
  planKey: string;
  isAnnual: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasAnnual = plan.annualPrice !== null;
  const showAnnual = isAnnual && hasAnnual;
  const price = showAnnual ? plan.annualPrice : plan.monthlyPrice;
  const period = showAnnual ? '/year' : '/month';
  const effectiveMonthly = showAnnual && plan.annualPrice ? Math.round(plan.annualPrice / 12) : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-gray-800 bg-surface hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            {plan.popular && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{plan.description}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'border-primary bg-primary' : 'border-gray-600'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">${price}</span>
        <span className="text-gray-400">{period}</span>
      </div>

      {effectiveMonthly && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-green-400 text-sm font-medium">
            ${effectiveMonthly}/mo effective
          </span>
          <span className="text-gray-500 text-sm line-through">
            ${plan.monthlyPrice}/mo
          </span>
        </div>
      )}

      {!hasAnnual && isAnnual && (
        <p className="text-gray-500 text-xs mt-2">Monthly billing only</p>
      )}
    </button>
  );
}

function SalonPlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: typeof SALON_PLANS.foundations;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-gray-800 bg-surface hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            {plan.popular && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Best Value
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{plan.description}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'border-primary bg-primary' : 'border-gray-600'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">${plan.price.toLocaleString()}</span>
        <span className="text-gray-400">{plan.period}</span>
      </div>

      {plan.savings && (
        <p className="text-green-400 text-sm font-medium mt-1">{plan.savings}</p>
      )}
    </button>
  );
}

function SubscribeContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || 'studio';
  const email = searchParams.get('email') || '';
  const source = searchParams.get('source') || 'web';

  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>(
    planParam.includes('salon') ? 'salon' : 'individual'
  );
  const [selectedIndividualPlan, setSelectedIndividualPlan] = useState<'signature' | 'studio'>(
    planParam === 'signature' ? 'signature' : 'studio'
  );
  const [selectedSalonPlan, setSelectedSalonPlan] = useState<'foundations' | 'studio-team'>(
    'studio-team'
  );
  const [isAnnual, setIsAnnual] = useState(false);

  const individualPlan = INDIVIDUAL_PLANS[selectedIndividualPlan];
  const salonPlan = SALON_PLANS[selectedSalonPlan];
  const hasAnnual = individualPlan.annualPrice !== null;
  const useAnnual = isAnnual && hasAnnual;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      let checkoutPlan: string;

      if (userType === 'individual') {
        checkoutPlan = useAnnual ? `${selectedIndividualPlan}-annual` : selectedIndividualPlan;
      } else {
        checkoutPlan = `salon-${selectedSalonPlan === 'studio-team' ? 'studio' : 'foundations'}`;
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: checkoutPlan,
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

  // Calculate display values
  const displayPrice = userType === 'individual'
    ? (useAnnual ? individualPlan.annualPrice : individualPlan.monthlyPrice)
    : salonPlan.price;
  const displayPeriod = userType === 'individual'
    ? (useAnnual ? '/year' : '/month')
    : salonPlan.period;
  const features = userType === 'individual' ? individualPlan.features : salonPlan.features;
  const planName = userType === 'individual' ? individualPlan.name : salonPlan.name;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
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
            Choose Your Plan
          </h1>
          <p className="text-gray-400">
            Master cutting techniques with expert-led courses
          </p>
        </div>

        {/* User Type Toggle */}
        <UserTypeToggle userType={userType} onChange={setUserType} />

        {/* Individual Plans */}
        {userType === 'individual' && (
          <>
            <BillingToggle
              isAnnual={isAnnual}
              onToggle={() => setIsAnnual(!isAnnual)}
              disabled={selectedIndividualPlan === 'signature'}
              savingsPercent={21}
            />

            <div className="space-y-3 mb-8">
              <IndividualPlanCard
                plan={INDIVIDUAL_PLANS.signature}
                planKey="signature"
                isAnnual={isAnnual}
                isSelected={selectedIndividualPlan === 'signature'}
                onSelect={() => setSelectedIndividualPlan('signature')}
              />
              <IndividualPlanCard
                plan={INDIVIDUAL_PLANS.studio}
                planKey="studio"
                isAnnual={isAnnual}
                isSelected={selectedIndividualPlan === 'studio'}
                onSelect={() => setSelectedIndividualPlan('studio')}
              />
            </div>
          </>
        )}

        {/* Salon Plans */}
        {userType === 'salon' && (
          <>
            <p className="text-center text-gray-400 text-sm mb-6">
              Annual billing only • 5 team seats included
            </p>

            <div className="space-y-3 mb-8">
              <SalonPlanCard
                plan={SALON_PLANS.foundations}
                isSelected={selectedSalonPlan === 'foundations'}
                onSelect={() => setSelectedSalonPlan('foundations')}
              />
              <SalonPlanCard
                plan={SALON_PLANS['studio-team']}
                isSelected={selectedSalonPlan === 'studio-team'}
                onSelect={() => setSelectedSalonPlan('studio-team')}
              />
            </div>
          </>
        )}

        {/* Features */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {planName} includes:
          </h3>
          <ul className="space-y-3">
            {features.map((feature, i) => (
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
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              Subscribe for ${displayPrice?.toLocaleString()}{displayPeriod}
            </>
          )}
        </button>

        {userType === 'individual' && useAnnual && (
          <p className="text-center text-green-400 text-sm mt-3">
            You&apos;re saving $324/year with annual billing!
          </p>
        )}

        {userType === 'salon' && selectedSalonPlan === 'studio-team' && (
          <p className="text-center text-green-400 text-sm mt-3">
            Includes 3 certifications ($891 value)!
          </p>
        )}

        {/* Info */}
        <p className="text-gray-500 text-xs text-center mt-6">
          Payments are processed securely by Stripe. Cancel anytime.
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
