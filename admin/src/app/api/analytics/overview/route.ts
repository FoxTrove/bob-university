import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOverviewMetrics,
  getRevenueOverTime,
  getUsersOverTime,
  getPlatformDistribution,
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

    const rangeWithComparison = {
      ...range,
      comparison: {
        start: new Date(comparisonStart),
        end: new Date(comparisonEnd),
      },
    };

    // Fetch all data in parallel
    const [metrics, revenueChart, userChart, platformDistribution] =
      await Promise.all([
        getOverviewMetrics(supabase, rangeWithComparison),
        getRevenueOverTime(supabase, range),
        getUsersOverTime(supabase, range),
        getPlatformDistribution(supabase),
      ]);

    return NextResponse.json({
      metrics,
      revenueChart,
      userChart,
      platformDistribution,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
