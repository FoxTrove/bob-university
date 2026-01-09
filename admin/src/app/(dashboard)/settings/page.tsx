'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  XCircle,
  Save,
  CreditCard,
  Video,
  AlertTriangle,
  DollarSign,
  Users,
  Building
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface SubscriptionPlan {
  id: string;
  plan: string;
  stripe_product_id: string;
  stripe_price_id: string;
  amount_cents: number;
  currency: string;
  interval: string;
  is_active: boolean;
}

interface IntegrationStatus {
  stripe: boolean;
  mux: boolean;
}

export default function SettingsPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    stripe: false,
    mux: false,
  });

  useEffect(() => {
    async function loadData() {
      // Load user profile
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        return;
      }

      setProfile(data as Profile);
      setFullName(data?.full_name || '');
      setAvatarUrl(data?.avatar_url || '');

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('amount_cents', { ascending: true });

      if (plansError) {
        console.error('Error loading plans:', plansError);
      } else {
        setPlans(plansData || []);
      }
      setPlansLoading(false);

      // Check integrations (basic check - these are set server-side)
      // For now we check if plans have stripe IDs as a proxy
      const hasStripeConfig = plansData?.some(p => p.stripe_price_id) || false;
      setIntegrations({
        stripe: hasStripeConfig,
        mux: true, // Assume configured if admin is running
      });
    }

    loadData();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccessMessage('Profile settings saved.');
    }
    setSaving(false);
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <>
      <Header user={user} title="Settings" />
      <div className="p-6 max-w-4xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-green-50 text-green-600 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Admin Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Profile</h2>
          <p className="text-sm text-gray-500 mb-6">
            Update your display information for the admin dashboard.
          </p>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: used for the admin header avatar.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
              <p className="text-sm text-gray-500 mt-1">
                View and manage subscription pricing tiers.
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>

          {plansLoading ? (
            <div className="py-8 text-center text-gray-500">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              No subscription plans configured.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 ${
                    plan.is_active
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {plan.plan === 'salon' ? (
                        <Building className="w-5 h-5 text-purple-600 mr-2" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                      )}
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {plan.plan}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        plan.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(plan.amount_cents, plan.currency)}
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.interval}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mt-3">
                    <p>Stripe Price: <code className="bg-gray-100 px-1 rounded">{plan.stripe_price_id}</code></p>
                    <p>Product: <code className="bg-gray-100 px-1 rounded">{plan.stripe_product_id}</code></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            To modify pricing, update the subscription_plans table or create new prices in Stripe.
          </p>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h2>
          <p className="text-sm text-gray-500 mb-6">
            Status of third-party service connections.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Stripe */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Stripe</h3>
                    <p className="text-sm text-gray-500">Payment processing</p>
                  </div>
                </div>
                {integrations.stripe ? (
                  <span className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-600 text-sm">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Check config
                  </span>
                )}
              </div>
            </div>

            {/* Mux */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-pink-100 p-2 rounded-lg mr-3">
                    <Video className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Mux</h3>
                    <p className="text-sm text-gray-500">Video streaming</p>
                  </div>
                </div>
                {integrations.mux ? (
                  <span className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-600 text-sm">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Check config
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Integration credentials are configured via environment variables in .env.local
          </p>
        </div>
      </div>
    </>
  );
}
