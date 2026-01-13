import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { UsersTable } from '@/components/UsersTable';
import { Users, Crown, Clock, XCircle } from 'lucide-react';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

interface UserWithEntitlement {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  entitlements: Array<{
    plan: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
  }>;
  ltv_cents: number;
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set');
    return null;
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function getUsers(): Promise<{ users: UserWithEntitlement[]; error: string | null }> {
  const supabase = getAdminClient();

  if (!supabase) {
    return { users: [], error: 'Service role key not configured' };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    return { users: [], error: profilesError.message };
  }

  if (!profiles || profiles.length === 0) {
    return { users: [], error: null };
  }

  const userIds = profiles.map((p) => p.id);

  // Get entitlements
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('user_id, plan, status, current_period_start, current_period_end')
    .in('user_id', userIds);

  const entitlementsByUser = new Map(
    (entitlements || []).map((e) => [
      e.user_id,
      {
        plan: e.plan,
        status: e.status,
        current_period_start: e.current_period_start,
        current_period_end: e.current_period_end,
      },
    ])
  );

  // Get revenue data
  const { data: ledgerRows } = await supabase
    .from('revenue_ledger')
    .select('user_id, net_cents, amount_cents, status')
    .in('user_id', userIds)
    .in('status', ['completed', 'refunded']);

  const ltvByUser = new Map<string, number>();
  (ledgerRows || []).forEach((row) => {
    const current = ltvByUser.get(row.user_id) ?? 0;
    // Use net_cents if available and non-zero, otherwise fall back to amount_cents
    const net = (row.net_cents && row.net_cents !== 0) ? row.net_cents : (row.amount_cents ?? 0);
    ltvByUser.set(row.user_id, current + net);
  });

  const users = profiles.map((profile) => ({
    ...profile,
    entitlements: entitlementsByUser.get(profile.id)
      ? [entitlementsByUser.get(profile.id)!]
      : [],
    ltv_cents: ltvByUser.get(profile.id) ?? 0,
  }));

  return { users, error: null };
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { users, error } = await getUsers();

  const premiumCount = users.filter((u) => {
    const entitlement = u.entitlements?.[0];
    if (!entitlement) return false;
    if (entitlement.status !== 'active') return false;
    return entitlement.plan === 'individual' || entitlement.plan === 'salon';
  }).length;

  const canceledCount = users.filter((u) => {
    const entitlement = u.entitlements?.[0];
    return entitlement?.status === 'canceled';
  }).length;

  return (
    <>
      <Header user={user} title="Users" />
      <div className="p-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading users</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
            <div className="bg-red-100 p-3 rounded-lg mr-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Canceled</p>
              <p className="text-2xl font-semibold">{canceledCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Free Users</p>
              <p className="text-2xl font-semibold">{users.length - premiumCount - canceledCount}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <UsersTable users={users} />
      </div>
    </>
  );
}
