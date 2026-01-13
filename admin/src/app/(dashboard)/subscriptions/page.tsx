import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { SubscriptionsTable, SubscriptionRow } from '@/components/SubscriptionsTable';

async function getSubscriptions(): Promise<SubscriptionRow[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      entitlements (
        plan,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        stripe_subscription_id
      ),
      subscription_records (
        source,
        status,
        plan,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        external_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }

  return (profiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    entitlement: profile.entitlements?.[0] || null,
    subscriptionRecord: profile.subscription_records?.[0] || null,
  }));
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const rows = await getSubscriptions();

  return (
    <>
      <Header user={user} title="Subscription Management" />
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage subscription status across Stripe now. Apple/Google actions will unlock once platform APIs are connected.
          </p>
        </div>
        <SubscriptionsTable initialRows={rows} />
      </div>
    </>
  );
}
