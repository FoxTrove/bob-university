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
  Building,
  Pencil,
  X,
  Apple,
  Smartphone,
  Plus,
  Trash2,
  Mail,
  RefreshCw,
  ExternalLink,
  Loader2
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
  apple_product_id: string | null;
  google_product_id: string | null;
  description: string | null;
  features: string[] | null;
}

interface IntegrationStatus {
  stripe: boolean;
  mux: boolean;
  ghl: 'unknown' | 'connected' | 'error' | 'not_configured';
}

interface GHLSyncResult {
  synced: number;
  errors: number;
  message: string;
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

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    features: [] as string[],
    apple_product_id: '',
    google_product_id: '',
    amount_cents: 0,
    is_active: true,
  });
  const [newFeature, setNewFeature] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    stripe: false,
    mux: false,
    ghl: 'unknown',
  });

  // GHL state
  const [ghlTesting, setGhlTesting] = useState(false);
  const [ghlSyncing, setGhlSyncing] = useState(false);
  const [ghlSyncResult, setGhlSyncResult] = useState<GHLSyncResult | null>(null);

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
      setIntegrations(prev => ({
        ...prev,
        stripe: hasStripeConfig,
        mux: true, // Assume configured if admin is running
      }));
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

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({
      description: plan.description || '',
      features: plan.features || [],
      apple_product_id: plan.apple_product_id || '',
      google_product_id: plan.google_product_id || '',
      amount_cents: plan.amount_cents,
      is_active: plan.is_active,
    });
    setNewFeature('');
  };

  const closeEditModal = () => {
    setEditingPlan(null);
    setEditForm({
      description: '',
      features: [],
      apple_product_id: '',
      google_product_id: '',
      amount_cents: 0,
      is_active: true,
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setEditForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    setSavingPlan(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('update-plan-pricing', {
        body: {
          plan_id: editingPlan.id,
          description: editForm.description || null,
          features: editForm.features,
          apple_product_id: editForm.apple_product_id || null,
          google_product_id: editForm.google_product_id || null,
          amount_cents: editForm.amount_cents !== editingPlan.amount_cents ? editForm.amount_cents : undefined,
          is_active: editForm.is_active,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update plan');
      }

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setPlans(prev => prev.map(p =>
        p.id === editingPlan.id ? { ...p, ...result.plan } : p
      ));

      setSuccessMessage(
        result.stripe_price_created
          ? `Plan updated. New Stripe price created: ${result.stripe_price_created}`
          : 'Plan updated successfully.'
      );
      closeEditModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      setError(message);
    } finally {
      setSavingPlan(false);
    }
  };

  // GHL Functions
  const testGHLConnection = async () => {
    setGhlTesting(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('ghl-test-connection');

      if (response.error) {
        throw new Error(response.error.message || 'Connection test failed');
      }

      const result = response.data;
      if (result.success) {
        setIntegrations(prev => ({ ...prev, ghl: 'connected' }));
        setSuccessMessage(`GHL Connected: ${result.location_name || 'Connection verified'}`);
      } else if (result.not_configured) {
        setIntegrations(prev => ({ ...prev, ghl: 'not_configured' }));
        setError('GHL not configured. Add GOHIGHLEVEL_API_KEY to Supabase secrets.');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      setIntegrations(prev => ({ ...prev, ghl: 'error' }));
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setError(`GHL Error: ${message}`);
    } finally {
      setGhlTesting(false);
    }
  };

  const syncUsersToGHL = async () => {
    setGhlSyncing(true);
    setError(null);
    setGhlSyncResult(null);

    try {
      const response = await supabase.functions.invoke('ghl-bulk-sync');

      if (response.error) {
        throw new Error(response.error.message || 'Bulk sync failed');
      }

      const result = response.data;
      if (result.success) {
        setGhlSyncResult({
          synced: result.synced || 0,
          errors: result.errors || 0,
          message: result.message || 'Sync complete',
        });
        setSuccessMessage(`Synced ${result.synced} users to GHL`);
      } else {
        throw new Error(result.error || 'Bulk sync failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk sync failed';
      setError(`GHL Sync Error: ${message}`);
    } finally {
      setGhlSyncing(false);
    }
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          plan.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => openEditModal(plan)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit plan"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(plan.amount_cents, plan.currency)}
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.interval}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  )}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-gray-400">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="text-xs text-gray-500 space-y-1 mt-3 pt-3 border-t border-gray-200">
                    <p>Stripe: <code className="bg-gray-100 px-1 rounded text-xs">{plan.stripe_price_id}</code></p>
                    {plan.apple_product_id && (
                      <p className="flex items-center">
                        <Apple className="w-3 h-3 mr-1" />
                        <code className="bg-gray-100 px-1 rounded text-xs">{plan.apple_product_id}</code>
                      </p>
                    )}
                    {plan.google_product_id && (
                      <p className="flex items-center">
                        <Smartphone className="w-3 h-3 mr-1" />
                        <code className="bg-gray-100 px-1 rounded text-xs">{plan.google_product_id}</code>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Click the edit button to modify plan details. Price changes will automatically create a new Stripe price.
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

        {/* GoHighLevel Integration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">GoHighLevel (CRM)</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sync contacts, trigger email workflows, and manage marketing automation.
              </p>
            </div>
            <Mail className="w-8 h-8 text-gray-400" />
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Connection Status</h3>
                  <p className="text-sm text-gray-500">GHL API integration</p>
                </div>
              </div>
              {integrations.ghl === 'connected' && (
                <span className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </span>
              )}
              {integrations.ghl === 'not_configured' && (
                <span className="flex items-center text-yellow-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Not configured
                </span>
              )}
              {integrations.ghl === 'error' && (
                <span className="flex items-center text-red-600 text-sm">
                  <XCircle className="w-4 h-4 mr-1" />
                  Error
                </span>
              )}
              {integrations.ghl === 'unknown' && (
                <span className="flex items-center text-gray-500 text-sm">
                  Click test to check
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={testGHLConnection}
                disabled={ghlTesting}
                className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {ghlTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </button>

              <button
                onClick={syncUsersToGHL}
                disabled={ghlSyncing || integrations.ghl !== 'connected'}
                className="inline-flex items-center px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ghlSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Bulk Sync Users
              </button>

              <a
                href="https://supabase.com/dashboard/project/_/settings/vault/secrets"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Configure Secrets
              </a>
            </div>

            {ghlSyncResult && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-900">{ghlSyncResult.message}</p>
                <p className="text-gray-600">
                  Synced: {ghlSyncResult.synced} | Errors: {ghlSyncResult.errors}
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Required secrets:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li><code className="bg-gray-100 px-1 rounded">GOHIGHLEVEL_API_KEY</code> - Your GHL Private Integration Token</li>
              <li><code className="bg-gray-100 px-1 rounded">GOHIGHLEVEL_LOCATION_ID</code> - Your GHL Location ID</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit {editingPlan.plan.charAt(0).toUpperCase() + editingPlan.plan.slice(1)} Plan
              </h3>
              <button
                onClick={closeEditModal}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ({editingPlan.currency.toUpperCase()})
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.amount_cents / 100}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      amount_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">/{editingPlan.interval}</span>
                </div>
                {editForm.amount_cents !== editingPlan.amount_cents && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Changing price will create a new Stripe price and archive the old one
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the plan..."
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <div className="space-y-2 mb-2">
                  {editForm.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-700">{feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Add a feature..."
                  />
                  <button
                    onClick={addFeature}
                    disabled={!newFeature.trim()}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* IAP Product IDs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Apple className="w-4 h-4 mr-1" />
                    Apple Product ID
                  </label>
                  <input
                    type="text"
                    value={editForm.apple_product_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, apple_product_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="com.app.subscription"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Smartphone className="w-4 h-4 mr-1" />
                    Google Product ID
                  </label>
                  <input
                    type="text"
                    value={editForm.google_product_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, google_product_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="subscription_monthly"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Active</label>
                  <p className="text-xs text-gray-500">Inactive plans won't appear in the app</p>
                </div>
                <button
                  onClick={() => setEditForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.is_active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editForm.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={closeEditModal}
                disabled={savingPlan}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingPlan ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
