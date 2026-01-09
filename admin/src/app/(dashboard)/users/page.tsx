import { createAdminClient, createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Users, Crown, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/analytics';

async function getUsers() {
  const adminClient = createAdminClient();
  const supabase = adminClient ?? await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const userIds = (profiles || []).map((profile) => profile.id);
  const ltvByUser = new Map<string, number>();
  let entitlementsByUser = new Map<string, {
    plan: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
  }>();

  if (userIds.length > 0) {
    const { data: entitlements, error: entitlementError } = await supabase
      .from('entitlements')
      .select('user_id, plan, status, current_period_start, current_period_end')
      .in('user_id', userIds);

    if (entitlementError) {
      console.error('Error fetching entitlements:', entitlementError);
    } else if (entitlements) {
      entitlementsByUser = new Map(
        entitlements.map((entitlement) => [
          entitlement.user_id,
          {
            plan: entitlement.plan,
            status: entitlement.status,
            current_period_start: entitlement.current_period_start,
            current_period_end: entitlement.current_period_end,
          },
        ])
      );
    }

    const { data: ledgerRows, error: ledgerError } = await supabase
      .from('revenue_ledger')
      .select('user_id, net_cents')
      .in('user_id', userIds)
      .eq('status', 'completed');

    if (ledgerError) {
      console.error('Error fetching revenue ledger:', ledgerError);
    } else if (ledgerRows) {
      ledgerRows.forEach((row) => {
        const current = ltvByUser.get(row.user_id) ?? 0;
        ltvByUser.set(row.user_id, current + (row.net_cents ?? 0));
      });
    }
  }

  return (profiles || []).map((profile) => ({
    ...profile,
    entitlements: entitlementsByUser.get(profile.id)
      ? [entitlementsByUser.get(profile.id)]
      : [],
    ltv_cents: ltvByUser.get(profile.id) ?? 0,
  }));
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const users = await getUsers();

  const premiumCount = users.filter((u) => {
    const entitlement = u.entitlements?.[0];
    if (!entitlement) return false;
    if (entitlement.status !== 'active') return false;
    return entitlement.plan === 'individual' || entitlement.plan === 'salon';
  }).length;

  return (
    <>
      <Header user={user} title="Users" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Premium Subscribers</p>
              <p className="text-2xl font-semibold">{premiumCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Free Users</p>
              <p className="text-2xl font-semibold">{users.length - premiumCount}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LTV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((profile) => {
                const entitlement = profile.entitlements?.[0];
                const isPremium = entitlement?.status === 'active' && (entitlement?.plan === 'individual' || entitlement?.plan === 'salon');
                const planLabel = entitlement?.plan === 'salon'
                  ? 'Salon'
                  : entitlement?.plan === 'individual'
                    ? 'Individual'
                    : 'Free';

                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.full_name || ''}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 font-medium">
                              {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/users/${profile.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {profile.full_name || 'No name'}
                          </Link>
                          <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isPremium
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isPremium ? planLabel : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(entitlement?.current_period_start)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(entitlement?.current_period_end)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatCurrency(profile.ltv_cents || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {profile.role === 'admin' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Admin
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">User</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
