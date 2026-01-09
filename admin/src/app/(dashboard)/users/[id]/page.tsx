'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, CheckCircle, Save, XCircle } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface Entitlement {
  id?: string;
  user_id: string;
  plan: 'free' | 'individual' | 'salon';
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

function toDateTimeInput(value: string | null): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [plan, setPlan] = useState<Entitlement['plan']>('free');
  const [status, setStatus] = useState<Entitlement['status']>('active');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser || null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .eq('id', userId)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const { data: entitlementData } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const nextEntitlement: Entitlement = entitlementData
        ? (entitlementData as Entitlement)
        : {
          user_id: userId,
          plan: 'free',
          status: 'active',
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
        };

      setEntitlement(nextEntitlement);
      setPlan(nextEntitlement.plan);
      setStatus(nextEntitlement.status);
      setPeriodStart(toDateTimeInput(nextEntitlement.current_period_start));
      setPeriodEnd(toDateTimeInput(nextEntitlement.current_period_end));
      setCancelAtPeriodEnd(Boolean(nextEntitlement.cancel_at_period_end));

      setLoading(false);
    }

    loadData();
  }, [supabase, userId]);

  const handleSave = async () => {
    if (!entitlement) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const updates = {
      user_id: userId,
      plan,
      status,
      current_period_start: periodStart ? new Date(periodStart).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = entitlement.id
      ? await supabase
        .from('entitlements')
        .update(updates)
        .eq('id', entitlement.id)
      : await supabase
        .from('entitlements')
        .insert(updates);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccessMessage('Entitlement updated.');
      setEntitlement({ ...entitlement, ...updates });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <>
        <Header user={user} title="User Details" />
        <div className="p-6 text-gray-500">Loading user data...</div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header user={user} title="User Details" />
        <div className="p-6 text-gray-500">User not found.</div>
      </>
    );
  }

  return (
    <>
      <Header user={user} title="User Details" />
      <div className="p-6 space-y-6">
        <Link
          href="/users"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Users
        </Link>

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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-gray-500">
                  {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900">
                {profile.full_name || 'No name'}
              </div>
              <div className="text-sm text-gray-500">{profile.email}</div>
              <div className="text-xs text-gray-400 mt-1">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entitlement</h2>
          <p className="text-sm text-gray-500 mb-6">
            Use this section to grant or revoke access and override subscription dates.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value as Entitlement['plan'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value="individual">Individual</option>
                <option value="salon">Salon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Entitlement['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Period Start
              </label>
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Period End
              </label>
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
              <input
                type="checkbox"
                checked={cancelAtPeriodEnd}
                onChange={(event) => setCancelAtPeriodEnd(event.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Cancel at period end
            </label>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Entitlement'}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push('/users')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
