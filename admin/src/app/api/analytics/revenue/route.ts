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
    const { start, end, comparisonStart, comparisonEnd, preset, filters } = body;

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
    const applyFilters = (query: any) => {
      if (filters?.sources?.length) {
        query = query.in('source', filters.sources);
      }
      if (filters?.productTypes?.length) {
        query = query.in('product_type', filters.productTypes);
      }
      if (filters?.plans?.length) {
        query = query.in('plan', filters.plans);
      }
      return query;
    };

    const applyStatusFilter = (query: any) => {
      if (filters?.statuses?.length) {
        return query.in('status', filters.statuses);
      }
      return query.eq('status', 'completed');
    };

    const [
      currentRevenueResult,
      previousRevenueResult,
      revenueChart,
      revenueByProduct,
      revenueBySource,
      revenueBySourceSummary,
      transactions,
    ] = await Promise.all([
      // Current period total
      applyStatusFilter(
        applyFilters(
          supabase
        .from('revenue_ledger')
        .select('amount_cents, fee_cents, net_cents')
        .gte('occurred_at', range.start.toISOString())
        .lte('occurred_at', range.end.toISOString())
        )
      ),

      // Previous period total
      applyStatusFilter(
        applyFilters(
          supabase
        .from('revenue_ledger')
        .select('amount_cents, fee_cents, net_cents')
        .gte('occurred_at', comparisonRange.start.toISOString())
        .lte('occurred_at', comparisonRange.end.toISOString())
        )
      ),

      // Chart data
      getRevenueOverTime(supabase, range, filters),

      // By product
      getRevenueByProduct(supabase, range, filters),

      // By source
      getRevenueBySource(supabase, range, filters),

      // Source summary
      applyStatusFilter(
        applyFilters(
          supabase
            .from('revenue_ledger')
            .select('source, amount_cents, fee_cents, net_cents')
            .gte('occurred_at', range.start.toISOString())
            .lte('occurred_at', range.end.toISOString())
        )
      ),

      // Recent transactions
      getTransactions(supabase, range, 50, filters),
    ]);

    // Calculate totals
    type RevenueRow = {
      amount_cents?: number | null;
      fee_cents?: number | null;
      net_cents?: number | null;
    };

    const sumAmount = (rows: RevenueRow[] | null | undefined) =>
      rows?.reduce((sum: number, p: RevenueRow) => sum + (p.amount_cents || 0), 0) || 0;

    const sumFees = (rows: RevenueRow[] | null | undefined) =>
      rows?.reduce((sum: number, p: RevenueRow) => sum + (p.fee_cents || 0), 0) || 0;

    const sumNet = (rows: RevenueRow[] | null | undefined) =>
      rows?.reduce(
        (sum: number, p: RevenueRow) => sum + ((p.net_cents ?? p.amount_cents) || 0),
        0
      ) || 0;

    const totalRevenue = sumAmount(currentRevenueResult.data as RevenueRow[] | null);
    const totalFees = sumFees(currentRevenueResult.data as RevenueRow[] | null);
    const totalNet = sumNet(currentRevenueResult.data as RevenueRow[] | null);
    const previousRevenue = sumAmount(previousRevenueResult.data as RevenueRow[] | null);
    const previousFees = sumFees(previousRevenueResult.data as RevenueRow[] | null);
    const previousNet = sumNet(previousRevenueResult.data as RevenueRow[] | null);

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

    const arpu = totalUsers ? totalNet / totalUsers : 0;
    const previousArpu = totalUsers ? previousNet / totalUsers : 0;

    // Calculate refund rate
    const { count: refundedCount } = await applyFilters(
      supabase
        .from('revenue_ledger')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', range.start.toISOString())
        .lte('occurred_at', range.end.toISOString())
        .eq('status', 'refunded')
    );

    const refundRateStatuses = filters?.statuses?.length
      ? filters.statuses
      : ['completed', 'refunded'];

    const { count: totalPurchases } = await applyFilters(
      supabase
        .from('revenue_ledger')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', range.start.toISOString())
        .lte('occurred_at', range.end.toISOString())
        .in('status', refundRateStatuses)
    );

    const refundRate =
      totalPurchases && totalPurchases > 0
        ? ((refundedCount || 0) / totalPurchases) * 100
        : 0;

    const sourceSummaryMap = new Map<string, { gross: number; fees: number; net: number; count: number }>();
    (revenueBySourceSummary.data || []).forEach((row: { source: string | null; amount_cents?: number | null; fee_cents?: number | null; net_cents?: number | null; }) => {
      const source = row.source || 'unknown';
      const existing = sourceSummaryMap.get(source) || { gross: 0, fees: 0, net: 0, count: 0 };
      const amount = row.amount_cents || 0;
      const fee = row.fee_cents || 0;
      const net = row.net_cents ?? amount;
      sourceSummaryMap.set(source, {
        gross: existing.gross + amount,
        fees: existing.fees + fee,
        net: existing.net + net,
        count: existing.count + 1,
      });
    });

    const sourceSummary = Array.from(sourceSummaryMap.entries()).map(([source, summary]) => {
      const label = source === 'apple'
        ? 'iOS (Apple)'
        : source === 'google'
          ? 'Android (Google)'
          : source === 'stripe'
            ? 'Web (Stripe)'
            : source;
      return {
        source,
        label,
        ...summary,
      };
    });

    return NextResponse.json({
      metrics: {
        totalRevenue,
        previousRevenue,
        totalFees,
        previousFees,
        totalNet,
        previousNet,
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
      sourceSummary,
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
