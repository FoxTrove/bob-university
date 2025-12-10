import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getRevenueOverTime,
  getRevenueByProduct,
  getRevenueBySource,
  getTransactions,
} from '@/lib/analytics-queries';
import { DateRangePreset } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start, end, comparisonStart, comparisonEnd, preset } = body;

    const range = {
      start: new Date(start),
      end: new Date(end),
      preset: preset as DateRangePreset,
    };

    const comparisonRange = {
      start: new Date(comparisonStart),
      end: new Date(comparisonEnd),
      preset: preset as DateRangePreset,
    };

    // Fetch revenue data
    const [
      currentRevenueResult,
      previousRevenueResult,
      revenueChart,
      revenueByProduct,
      revenueBySource,
      transactions,
    ] = await Promise.all([
      // Current period total
      supabase
        .from('purchases')
        .select('amount_cents')
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .eq('status', 'completed'),

      // Previous period total
      supabase
        .from('purchases')
        .select('amount_cents')
        .gte('created_at', comparisonRange.start.toISOString())
        .lte('created_at', comparisonRange.end.toISOString())
        .eq('status', 'completed'),

      // Chart data
      getRevenueOverTime(supabase, range),

      // By product
      getRevenueByProduct(supabase, range),

      // By source
      getRevenueBySource(supabase, range),

      // Recent transactions
      getTransactions(supabase, range, 50),
    ]);

    // Calculate totals
    const totalRevenue =
      currentRevenueResult.data?.reduce(
        (sum, p) => sum + (p.amount_cents || 0),
        0
      ) || 0;
    const previousRevenue =
      previousRevenueResult.data?.reduce(
        (sum, p) => sum + (p.amount_cents || 0),
        0
      ) || 0;

    // Get MRR from active subscriptions
    const { data: activeEntitlements } = await supabase
      .from('entitlements')
      .select('plan')
      .eq('status', 'active');

    const premiumCount =
      activeEntitlements?.filter((e) => e.plan === 'individual').length || 0;
    const salonCount =
      activeEntitlements?.filter((e) => e.plan === 'salon').length || 0;
    const mrr = premiumCount * 4900 + salonCount * 9700;
    const previousMrr = mrr * 0.9; // Placeholder

    // Get total users for ARPU
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const arpu = totalUsers ? totalRevenue / totalUsers : 0;
    const previousArpu = totalUsers ? previousRevenue / totalUsers : 0;

    // Calculate refund rate
    const { count: refundedCount } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())
      .eq('status', 'refunded');

    const { count: totalPurchases } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString());

    const refundRate =
      totalPurchases && totalPurchases > 0
        ? ((refundedCount || 0) / totalPurchases) * 100
        : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue,
        previousRevenue,
        mrr,
        previousMrr,
        arpu,
        previousArpu,
        refundRate,
        previousRefundRate: refundRate * 0.95, // Placeholder
      },
      revenueChart,
      revenueByProduct,
      revenueBySource,
      transactions,
    });
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
