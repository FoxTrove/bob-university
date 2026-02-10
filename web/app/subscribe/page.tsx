'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

interface IndividualPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number | null;
  description: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
}

interface SalonPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
  highlight?: string;
}

// Individual Plan configurations
const INDIVIDUAL_PLANS: Record<string, IndividualPlan> = {
  signature: {
    name: 'Signature',
    monthlyPrice: 49,
    annualPrice: null,
    description: 'Master the fundamentals',
    highlight: 'Most Popular for Beginners',
    features: [
      'Full core curriculum access',
      'Monthly live workshop with Ray',
      'Celebrity cut breakdowns',
      'Private community access',
      'Stylist directory listing',
      'Certification eligible',
    ],
  },
  studio: {
    name: 'Studio',
    monthlyPrice: 127,
    annualPrice: 1200,
    description: 'Direct mentorship from Ray',
    popular: true,
    highlight: 'Best Value',
    features: [
      'Everything in Signature, plus:',
      'Weekly "Ask Ray" live sessions',
      'Demand: business & pricing mastery',
      'Studio-exclusive replays',
      'Reserved seats at live events',
      'Priority support',
    ],
  },
};

// Salon Plan configurations
const SALON_PLANS: Record<string, SalonPlan> = {
  foundations: {
    name: 'Foundations',
    price: 1500,
    period: '/year',
    description: 'Education for your whole team',
    features: [
      '5 team seats included',
      'Signature-level content access',
      'Team progress dashboard',
      'Admin management tools',
      'Swap team members anytime',
      'Group onboarding call',
    ],
  },
  'studio-team': {
    name: 'Studio Team',
    price: 4500,
    period: '/year',
    description: 'Complete team transformation',
    popular: true,
    highlight: 'Best Value',
    features: [
      '5 team seats included',
      'Full Signature + Studio access',
      '3 certifications included ($891 value)',
      'Weekly "Ask Ray" for your team',
      'Reserved event seats',
      'Dedicated account manager',
    ],
    savings: 'Save $3,120 vs individual plans',
  },
};

const TESTIMONIALS = [
  {
    quote: "Bob University transformed how I approach every client. My confidence and my prices have both doubled.",
    author: "Maria S.",
    role: "Studio Owner, Miami",
    avatar: "MS",
  },
  {
    quote: "The Ask Ray sessions alone are worth 10x the price. Getting direct feedback from a master changed everything.",
    author: "James T.",
    role: "Senior Stylist, NYC",
    avatar: "JT",
  },
  {
    quote: "We enrolled our whole team. Six months later, our retention is up 40% and clients are requesting our stylists by name.",
    author: "Linda K.",
    role: "Salon Director, LA",
    avatar: "LK",
  },
];

type UserType = 'individual' | 'salon';

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function UserTypeToggle({
  userType,
  onChange,
}: {
  userType: UserType;
  onChange: (type: UserType) => void;
}) {
  return (
    <div className="inline-flex bg-gray-900 rounded-full p-1.5 border border-gray-800">
      <button
        onClick={() => onChange('individual')}
        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
          userType === 'individual'
            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Individual Stylist
      </button>
      <button
        onClick={() => onChange('salon')}
        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
          userType === 'salon'
            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25'
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
}: {
  isAnnual: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>
        Monthly
      </span>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
          disabled
            ? 'bg-gray-800 cursor-not-allowed opacity-50'
            : isAnnual
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25'
              : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
            isAnnual ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
          Annual
        </span>
        {!disabled && (
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-green-500/25">
            Save 21%
          </span>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  description,
  features,
  popular,
  highlight,
  effectiveMonthly,
  originalMonthly,
  isSelected,
  onSelect,
  savings,
}: {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
  effectiveMonthly?: number | null;
  originalMonthly?: number;
  isSelected: boolean;
  onSelect: () => void;
  savings?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-primary shadow-2xl shadow-primary/20 scale-[1.02]'
          : 'ring-1 ring-gray-800 hover:ring-gray-700 hover:scale-[1.01]'
      }`}
    >
      {/* Popular badge */}
      {popular && highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-primary/25 whitespace-nowrap">
            {highlight}
          </span>
        </div>
      )}

      <div className={`p-6 rounded-2xl ${popular ? 'bg-gradient-to-b from-gray-900 to-surface' : 'bg-surface'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isSelected
                ? 'border-primary bg-primary shadow-lg shadow-primary/50'
                : 'border-gray-600'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">${price.toLocaleString()}</span>
            <span className="text-gray-400 text-lg">{period}</span>
          </div>
          {effectiveMonthly && originalMonthly && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-green-400 font-semibold">
                ${effectiveMonthly}/mo effective
              </span>
              <span className="text-gray-500 line-through text-sm">
                ${originalMonthly}/mo
              </span>
            </div>
          )}
          {savings && (
            <p className="mt-2 text-green-400 font-semibold text-sm">{savings}</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className={`text-sm ${i === 0 && feature.includes('Everything') ? 'text-primary font-medium' : 'text-gray-300'}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

function TestimonialCard({ quote, author, role, avatar }: typeof TESTIMONIALS[0]) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-gray-800">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} />
        ))}
      </div>
      <p className="text-gray-300 mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{author}</p>
          <p className="text-gray-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Secure checkout</span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Cancel anytime</span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span>4.9/5 rating</span>
      </div>
    </div>
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
  const [isAnnual, setIsAnnual] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-gray-950">
      {/* Hero Section */}
      <div className="pt-16 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-full px-4 py-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">BU</span>
            </div>
            <span className="text-gray-300 font-medium">Bob University</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
            Elevate Your Craft.<br />
            <span className="text-primary">Transform Your Career.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of stylists mastering precision cutting with Ray&apos;s proven techniques.
          </p>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
            <div className="flex -space-x-2">
              {['JM', 'SK', 'AP', 'TC', 'LR'].map((initials, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-semibold">2,400+</span> stylists enrolled
              </p>
            </div>
          </div>

          {/* User Type Toggle */}
          <UserTypeToggle userType={userType} onChange={setUserType} />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Individual Plans */}
          {userType === 'individual' && (
            <>
              <div className="mb-8">
                <BillingToggle
                  isAnnual={isAnnual}
                  onToggle={() => setIsAnnual(!isAnnual)}
                  disabled={selectedIndividualPlan === 'signature'}
                />
                {selectedIndividualPlan === 'signature' && (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    Annual billing available with Studio plan
                  </p>
                )}
              </div>

              <div className="grid gap-4 mb-8">
                <PlanCard
                  name={INDIVIDUAL_PLANS.signature.name}
                  price={INDIVIDUAL_PLANS.signature.monthlyPrice}
                  period="/month"
                  description={INDIVIDUAL_PLANS.signature.description}
                  features={INDIVIDUAL_PLANS.signature.features}
                  isSelected={selectedIndividualPlan === 'signature'}
                  onSelect={() => setSelectedIndividualPlan('signature')}
                />
                <PlanCard
                  name={INDIVIDUAL_PLANS.studio.name}
                  price={useAnnual ? INDIVIDUAL_PLANS.studio.annualPrice! : INDIVIDUAL_PLANS.studio.monthlyPrice}
                  period={useAnnual ? '/year' : '/month'}
                  description={INDIVIDUAL_PLANS.studio.description}
                  features={INDIVIDUAL_PLANS.studio.features}
                  popular={true}
                  highlight={INDIVIDUAL_PLANS.studio.highlight}
                  effectiveMonthly={useAnnual ? Math.round(INDIVIDUAL_PLANS.studio.annualPrice! / 12) : null}
                  originalMonthly={useAnnual ? INDIVIDUAL_PLANS.studio.monthlyPrice : undefined}
                  isSelected={selectedIndividualPlan === 'studio'}
                  onSelect={() => setSelectedIndividualPlan('studio')}
                />
              </div>
            </>
          )}

          {/* Salon Plans */}
          {userType === 'salon' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-primary font-medium">5 team seats included • Billed annually</span>
                </div>
              </div>

              <div className="grid gap-4 mb-8">
                <PlanCard
                  name={SALON_PLANS.foundations.name}
                  price={SALON_PLANS.foundations.price}
                  period={SALON_PLANS.foundations.period}
                  description={SALON_PLANS.foundations.description}
                  features={SALON_PLANS.foundations.features}
                  isSelected={selectedSalonPlan === 'foundations'}
                  onSelect={() => setSelectedSalonPlan('foundations')}
                />
                <PlanCard
                  name={SALON_PLANS['studio-team'].name}
                  price={SALON_PLANS['studio-team'].price}
                  period={SALON_PLANS['studio-team'].period}
                  description={SALON_PLANS['studio-team'].description}
                  features={SALON_PLANS['studio-team'].features}
                  popular={true}
                  highlight={SALON_PLANS['studio-team'].highlight}
                  savings={SALON_PLANS['studio-team'].savings}
                  isSelected={selectedSalonPlan === 'studio-team'}
                  onSelect={() => setSelectedSalonPlan('studio-team')}
                />
              </div>
            </>
          )}

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>Start Learning for ${displayPrice?.toLocaleString()}{displayPeriod}</>
            )}
          </button>

          {/* Value callout */}
          {userType === 'individual' && useAnnual && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-400 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You&apos;re saving $324/year with annual billing!
              </span>
            </div>
          )}

          {userType === 'salon' && selectedSalonPlan === 'studio-team' && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-400 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Includes 3 certifications ($891 value)!
              </span>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-8">
            <TrustBadges />
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-white text-center mb-8">
            Trusted by Top Stylists
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="px-4 pb-16">
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-surface rounded-2xl p-8 border border-gray-800 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Risk-Free Guarantee</h3>
            <p className="text-gray-400">
              Not satisfied? Cancel anytime with no questions asked. We&apos;re confident you&apos;ll love the education,
              but we want you to feel completely comfortable trying it out.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-12">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            Payments processed securely by Stripe. Questions? Email{' '}
            <a href="mailto:support@bobuniversity.com" className="text-primary hover:underline">
              support@bobuniversity.com
            </a>
          </p>
          {source === 'ios_app' && (
            <p className="text-gray-500 text-sm mt-4">
              After subscribing, return to the Bob University app to access your content.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </div>
        </div>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}
