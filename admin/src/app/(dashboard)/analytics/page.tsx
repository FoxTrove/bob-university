import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { AnalyticsOverview } from './AnalyticsOverview';
import { MetricCardSkeleton, ChartCardSkeleton } from '@/components/analytics';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} title="Analytics" />
      <div className="p-6">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCardSkeleton count={5} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCardSkeleton />
                <ChartCardSkeleton />
              </div>
            </div>
          }
        >
          <AnalyticsOverview />
        </Suspense>
      </div>
    </>
  );
}
