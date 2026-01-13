import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { UserAnalytics } from './UserAnalytics';
import { MetricCardSkeleton, ChartCardSkeleton } from '@/components/analytics';

export default async function UserAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} title="User Analytics" />
      <div className="p-6">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCardSkeleton count={4} />
              </div>
              <ChartCardSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCardSkeleton />
                <ChartCardSkeleton />
              </div>
            </div>
          }
        >
          <UserAnalytics />
        </Suspense>
      </div>
    </>
  );
}
