import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUsersOverTime,
  getUsersByPlan,
  getPlatformDistribution,
  getActiveUsers,
} from '@/lib/analytics-queries';
import { DateRangePreset } from '@/lib/analytics';
import { format, subWeeks, startOfWeek } from 'date-fns';

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

    // Fetch user data in parallel
    const [
      currentUsersResult,
      previousUsersResult,
      currentNewUsersResult,
      previousNewUsersResult,
      userChart,
      usersByPlan,
      platformDistribution,
      activeUsers,
      entitlementsResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', range.end.toISOString()),

      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', comparisonRange.end.toISOString()),

      // New users in period
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString()),

      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', comparisonRange.start.toISOString())
        .lte('created_at', comparisonRange.end.toISOString()),

      // Charts
      getUsersOverTime(supabase, range),
      getUsersByPlan(supabase),
      getPlatformDistribution(supabase),
      getActiveUsers(supabase, range),

      // For conversion rate
      supabase.from('entitlements').select('plan').eq('status', 'active'),
    ]);

    // Calculate conversion rate
    const entitlements = entitlementsResult.data || [];
    const paidUsers = entitlements.filter(
      (e) => e.plan === 'individual' || e.plan === 'salon'
    ).length;
    const totalEntitlements = entitlements.length;
    const conversionRate =
      totalEntitlements > 0 ? (paidUsers / totalEntitlements) * 100 : 0;

    // DAU/MAU ratio
    const dauMauRatio =
      activeUsers.mau > 0 ? (activeUsers.dau / activeUsers.mau) * 100 : 0;

    // Generate retention data (simplified - would need more complex queries for real data)
    const retentionData = await generateRetentionData(supabase);

    return NextResponse.json({
      metrics: {
        totalUsers: currentUsersResult.count || 0,
        previousTotalUsers: previousUsersResult.count || 0,
        newUsers: currentNewUsersResult.count || 0,
        previousNewUsers: previousNewUsersResult.count || 0,
        dau: activeUsers.dau,
        wau: activeUsers.wau,
        mau: activeUsers.mau,
        previousMau: Math.floor(activeUsers.mau * 0.9), // Placeholder
        dauMauRatio,
        previousDauMauRatio: dauMauRatio * 0.95, // Placeholder
        conversionRate,
        previousConversionRate: conversionRate * 0.95, // Placeholder
      },
      userChart,
      usersByPlan,
      platformDistribution,
      retentionData,
    });
  } catch (error) {
    console.error('User analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}

async function generateRetentionData(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const now = new Date();
  const retentionData = [];

  // Get last 4 weeks of cohorts
  for (let i = 0; i < 4; i++) {
    const cohortStart = startOfWeek(subWeeks(now, i + 4));
    const cohortEnd = startOfWeek(subWeeks(now, i + 3));

    // Get users who signed up in this cohort
    const { data: cohortUsers } = await supabase
      .from('profiles')
      .select('user_id, created_at')
      .gte('created_at', cohortStart.toISOString())
      .lt('created_at', cohortEnd.toISOString());

    if (!cohortUsers || cohortUsers.length === 0) continue;

    const userIds = cohortUsers.map((u) => u.user_id);
    const cohortSize = userIds.length;

    // Check activity at different weeks
    const week0End = cohortEnd;
    const week1End = subWeeks(now, i + 2);
    const week2End = subWeeks(now, i + 1);
    const week4End = subWeeks(now, i - 1);

    // Get activity for each week
    const [week0Activity, week1Activity, week2Activity, week4Activity] =
      await Promise.all([
        supabase
          .from('video_progress')
          .select('user_id')
          .in('user_id', userIds)
          .gte('last_watched_at', cohortStart.toISOString())
          .lt('last_watched_at', week0End.toISOString()),

        supabase
          .from('video_progress')
          .select('user_id')
          .in('user_id', userIds)
          .gte('last_watched_at', week0End.toISOString())
          .lt('last_watched_at', week1End.toISOString()),

        supabase
          .from('video_progress')
          .select('user_id')
          .in('user_id', userIds)
          .gte('last_watched_at', week1End.toISOString())
          .lt('last_watched_at', week2End.toISOString()),

        i >= 2
          ? supabase
              .from('video_progress')
              .select('user_id')
              .in('user_id', userIds)
              .gte('last_watched_at', week2End.toISOString())
              .lt('last_watched_at', week4End.toISOString())
          : { data: [] },
      ]);

    const week0Users = new Set(week0Activity.data?.map((r) => r.user_id) || []);
    const week1Users = new Set(week1Activity.data?.map((r) => r.user_id) || []);
    const week2Users = new Set(week2Activity.data?.map((r) => r.user_id) || []);
    const week4Users = new Set(week4Activity.data?.map((r) => r.user_id) || []);

    retentionData.push({
      cohort: format(cohortStart, 'MMM d'),
      week0: (week0Users.size / cohortSize) * 100,
      week1: (week1Users.size / cohortSize) * 100,
      week2: (week2Users.size / cohortSize) * 100,
      week4: i >= 2 ? (week4Users.size / cohortSize) * 100 : 0,
    });
  }

  return retentionData.reverse();
}
