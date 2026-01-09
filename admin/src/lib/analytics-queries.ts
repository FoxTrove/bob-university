import { SupabaseClient } from '@supabase/supabase-js';
import { format, eachDayOfInterval, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { DateRange, DateRangeWithComparison } from './analytics';

// ============================================================================
// Types
// ============================================================================

export interface OverviewMetrics {
  // Revenue
  totalRevenue: number;
  previousRevenue: number;
  mrr: number;
  previousMrr: number;

  // Users
  totalUsers: number;
  previousTotalUsers: number;
  activeUsers: number;
  previousActiveUsers: number;
  newUsers: number;
  previousNewUsers: number;

  // Subscription
  freeUsers: number;
  premiumUsers: number;
  salonUsers: number;
  churnRate: number;
  previousChurnRate: number;
  conversionRate: number;
  previousConversionRate: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
}

export interface UsersByDate {
  date: string;
  total: number;
  new: number;
}

export interface PlatformDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RevenueByProduct {
  name: string;
  value: number;
  color: string;
}

export interface RevenueBySource {
  name: string;
  value: number;
  color: string;
}

export interface RevenueFilters {
  sources?: string[];
  productTypes?: string[];
  plans?: string[];
  statuses?: string[];
}

export interface UsersByPlan {
  name: string;
  value: number;
  color: string;
}

export interface RetentionData {
  cohort: string;
  week0: number;
  week1: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
}

// ============================================================================
// Overview Queries
// ============================================================================

export async function getOverviewMetrics(
  supabase: SupabaseClient,
  range: DateRangeWithComparison
): Promise<OverviewMetrics> {
  const { start, end, comparison } = range;

  // Current period queries
  const [
    currentRevenueResult,
    currentUsersResult,
    currentNewUsersResult,
    currentActiveUsersResult,
    currentEntitlementsResult,
    currentChurnedResult,
  ] = await Promise.all([
    // Total revenue in period
    supabase
      .from('revenue_ledger')
      .select('amount_cents')
      .gte('occurred_at', start.toISOString())
      .lte('occurred_at', end.toISOString())
      .eq('status', 'completed'),

    // Total users as of end date
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', end.toISOString()),

    // New users in period
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),

    // Active users (users with video activity in period)
    supabase
      .from('video_progress')
      .select('user_id')
      .gte('last_watched_at', start.toISOString())
      .lte('last_watched_at', end.toISOString()),

    // Current entitlements breakdown
    supabase.from('entitlements').select('plan, status'),

    // Churned users in period
    supabase
      .from('entitlements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString()),
  ]);

  // Previous period queries
  const [
    previousRevenueResult,
    previousUsersResult,
    previousNewUsersResult,
    previousActiveUsersResult,
    previousChurnedResult,
  ] = await Promise.all([
    supabase
      .from('revenue_ledger')
      .select('amount_cents')
      .gte('occurred_at', comparison.start.toISOString())
      .lte('occurred_at', comparison.end.toISOString())
      .eq('status', 'completed'),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', comparison.end.toISOString()),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', comparison.start.toISOString())
      .lte('created_at', comparison.end.toISOString()),

    supabase
      .from('video_progress')
      .select('user_id')
      .gte('last_watched_at', comparison.start.toISOString())
      .lte('last_watched_at', comparison.end.toISOString()),

    supabase
      .from('entitlements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('updated_at', comparison.start.toISOString())
      .lte('updated_at', comparison.end.toISOString()),
  ]);

  // Calculate metrics
  const currentRevenue =
    currentRevenueResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
  const previousRevenue =
    previousRevenueResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

  const activeUserIds = new Set(currentActiveUsersResult.data?.map((r) => r.user_id) || []);
  const previousActiveUserIds = new Set(
    previousActiveUsersResult.data?.map((r) => r.user_id) || []
  );

  // Entitlements breakdown
  const entitlements = currentEntitlementsResult.data || [];
  const activeEntitlements = entitlements.filter((e) => e.status === 'active');
  const freeUsers = activeEntitlements.filter((e) => e.plan === 'free').length;
  const premiumUsers = activeEntitlements.filter((e) => e.plan === 'individual').length;
  const salonUsers = activeEntitlements.filter((e) => e.plan === 'salon').length;

  // MRR calculation (simplified: count of premium * $49 + salon * $97)
  const mrr = premiumUsers * 4900 + salonUsers * 9700;
  // For previous MRR, we'd need historical data - using estimate based on previous users
  const previousMrr = mrr * 0.9; // Placeholder - would need proper historical tracking

  // Churn rate
  const totalSubscribers = premiumUsers + salonUsers;
  const churnedCount = currentChurnedResult.count || 0;
  const previousChurnedCount = previousChurnedResult.count || 0;
  const churnRate = totalSubscribers > 0 ? (churnedCount / totalSubscribers) * 100 : 0;
  const previousChurnRate = totalSubscribers > 0 ? (previousChurnedCount / totalSubscribers) * 100 : 0;

  // Conversion rate (free to paid)
  const conversionRate = freeUsers > 0 ? ((premiumUsers + salonUsers) / (freeUsers + premiumUsers + salonUsers)) * 100 : 0;
  const previousConversionRate = conversionRate * 0.95; // Placeholder

  return {
    totalRevenue: currentRevenue,
    previousRevenue,
    mrr,
    previousMrr,
    totalUsers: currentUsersResult.count || 0,
    previousTotalUsers: previousUsersResult.count || 0,
    activeUsers: activeUserIds.size,
    previousActiveUsers: previousActiveUserIds.size,
    newUsers: currentNewUsersResult.count || 0,
    previousNewUsers: previousNewUsersResult.count || 0,
    freeUsers,
    premiumUsers,
    salonUsers,
    churnRate,
    previousChurnRate,
    conversionRate,
    previousConversionRate,
  };
}

// ============================================================================
// Revenue Queries
// ============================================================================

const getStatusFilter = (filters: RevenueFilters) =>
  filters.statuses && filters.statuses.length > 0 ? filters.statuses : ['completed'];

export async function getRevenueOverTime(
  supabase: SupabaseClient,
  range: DateRange,
  filters: RevenueFilters = {}
): Promise<RevenueByDate[]> {
  const { start, end, preset } = range;

  let query = supabase
    .from('revenue_ledger')
    .select('amount_cents, occurred_at, source, product_type, plan, status')
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .in('status', getStatusFilter(filters));

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }
  if (filters.productTypes && filters.productTypes.length > 0) {
    query = query.in('product_type', filters.productTypes);
  }
  if (filters.plans && filters.plans.length > 0) {
    query = query.in('plan', filters.plans);
  }

  const { data: purchases } = await query;

  // Group by date
  const revenueByDate = new Map<string, number>();

  // Initialize all dates with 0
  if (preset === '1y') {
    const months = eachMonthOfInterval({ start, end });
    months.forEach((date) => {
      revenueByDate.set(format(date, 'yyyy-MM'), 0);
    });
  } else {
    const days = eachDayOfInterval({ start, end });
    days.forEach((date) => {
      revenueByDate.set(format(date, 'yyyy-MM-dd'), 0);
    });
  }

  // Aggregate purchases
  purchases?.forEach((purchase) => {
    const dateKey =
      preset === '1y'
        ? format(new Date(purchase.occurred_at), 'yyyy-MM')
        : format(new Date(purchase.occurred_at), 'yyyy-MM-dd');

    const current = revenueByDate.get(dateKey) || 0;
    revenueByDate.set(dateKey, current + (purchase.amount_cents || 0));
  });

  return Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

export async function getRevenueByProduct(
  supabase: SupabaseClient,
  range: DateRange,
  filters: RevenueFilters = {}
): Promise<RevenueByProduct[]> {
  const { start, end } = range;

  let query = supabase
    .from('revenue_ledger')
    .select('product_type, amount_cents, source, plan, status')
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .in('status', getStatusFilter(filters));

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }
  if (filters.productTypes && filters.productTypes.length > 0) {
    query = query.in('product_type', filters.productTypes);
  }
  if (filters.plans && filters.plans.length > 0) {
    query = query.in('plan', filters.plans);
  }

  const { data: purchases } = await query;

  const byProduct = new Map<string, number>();
  purchases?.forEach((p) => {
    const type = p.product_type || 'other';
    byProduct.set(type, (byProduct.get(type) || 0) + (p.amount_cents || 0));
  });

  const colors: Record<string, string> = {
    subscription: '#3B82F6',
    certification: '#10B981',
    event: '#F59E0B',
    merch: '#8B5CF6',
    other: '#6B7280',
  };

  return Array.from(byProduct.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colors[name] || colors.other,
  }));
}

export async function getRevenueBySource(
  supabase: SupabaseClient,
  range: DateRange,
  filters: RevenueFilters = {}
): Promise<RevenueBySource[]> {
  const { start, end } = range;

  let query = supabase
    .from('revenue_ledger')
    .select('source, amount_cents, product_type, plan, status')
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .in('status', getStatusFilter(filters));

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }
  if (filters.productTypes && filters.productTypes.length > 0) {
    query = query.in('product_type', filters.productTypes);
  }
  if (filters.plans && filters.plans.length > 0) {
    query = query.in('plan', filters.plans);
  }

  const { data: purchases } = await query;

  const bySource = new Map<string, number>();
  purchases?.forEach((p) => {
    const source = p.source || 'unknown';
    bySource.set(source, (bySource.get(source) || 0) + (p.amount_cents || 0));
  });

  const labels: Record<string, string> = {
    apple: 'iOS (Apple)',
    google: 'Android (Google)',
    stripe: 'Web (Stripe)',
    unknown: 'Unknown',
  };

  const colors: Record<string, string> = {
    apple: '#3B82F6',
    google: '#10B981',
    stripe: '#9333EA',
    unknown: '#6B7280',
  };

  return Array.from(bySource.entries()).map(([source, value]) => ({
    name: labels[source] || source,
    value,
    color: colors[source] || colors.unknown,
  }));
}

// ============================================================================
// User Queries
// ============================================================================

export async function getUsersOverTime(
  supabase: SupabaseClient,
  range: DateRange
): Promise<UsersByDate[]> {
  const { start, end, preset } = range;

  const { data: users } = await supabase
    .from('profiles')
    .select('created_at')
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  // Initialize date buckets
  const usersByDate = new Map<string, { total: number; new: number }>();

  if (preset === '1y') {
    const months = eachMonthOfInterval({ start, end });
    months.forEach((date) => {
      usersByDate.set(format(date, 'yyyy-MM'), { total: 0, new: 0 });
    });
  } else {
    const days = eachDayOfInterval({ start, end });
    days.forEach((date) => {
      usersByDate.set(format(date, 'yyyy-MM-dd'), { total: 0, new: 0 });
    });
  }

  // Count users
  let runningTotal = 0;
  const sortedUsers = users?.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ) || [];

  // Count users before the start date
  sortedUsers.forEach((user) => {
    if (new Date(user.created_at) < start) {
      runningTotal++;
    }
  });

  // Process users in the date range
  sortedUsers.forEach((user) => {
    const userDate = new Date(user.created_at);
    if (userDate >= start && userDate <= end) {
      const dateKey =
        preset === '1y'
          ? format(userDate, 'yyyy-MM')
          : format(userDate, 'yyyy-MM-dd');

      const entry = usersByDate.get(dateKey);
      if (entry) {
        entry.new++;
      }
    }
  });

  // Calculate running totals
  let currentTotal = runningTotal;
  const result: UsersByDate[] = [];

  usersByDate.forEach((value, date) => {
    currentTotal += value.new;
    result.push({
      date,
      total: currentTotal,
      new: value.new,
    });
  });

  return result;
}

export async function getUsersByPlan(supabase: SupabaseClient): Promise<UsersByPlan[]> {
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('plan')
    .eq('status', 'active');

  const byPlan = new Map<string, number>();
  entitlements?.forEach((e) => {
    const plan = e.plan || 'free';
    byPlan.set(plan, (byPlan.get(plan) || 0) + 1);
  });

  const labels: Record<string, string> = {
    free: 'Free',
    individual: 'Individual ($49/mo)',
    salon: 'Salon ($97/mo)',
  };

  const colors: Record<string, string> = {
    free: '#6B7280',
    individual: '#3B82F6',
    salon: '#8B5CF6',
  };

  return Array.from(byPlan.entries()).map(([plan, value]) => ({
    name: labels[plan] || plan,
    value,
    color: colors[plan] || '#6B7280',
  }));
}

export async function getPlatformDistribution(
  supabase: SupabaseClient
): Promise<PlatformDistribution[]> {
  const { data: tokens } = await supabase.from('push_tokens').select('platform');

  const byPlatform = new Map<string, number>();
  tokens?.forEach((t) => {
    const platform = t.platform || 'unknown';
    byPlatform.set(platform, (byPlatform.get(platform) || 0) + 1);
  });

  const labels: Record<string, string> = {
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
    unknown: 'Unknown',
  };

  const colors: Record<string, string> = {
    ios: '#3B82F6',
    android: '#10B981',
    web: '#F59E0B',
    unknown: '#6B7280',
  };

  return Array.from(byPlatform.entries()).map(([platform, value]) => ({
    name: labels[platform] || platform,
    value,
    color: colors[platform] || colors.unknown,
  }));
}

export async function getActiveUsers(
  supabase: SupabaseClient,
  range: DateRange
): Promise<{ dau: number; wau: number; mau: number }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dauResult, wauResult, mauResult] = await Promise.all([
    supabase
      .from('video_progress')
      .select('user_id')
      .gte('last_watched_at', dayAgo.toISOString()),
    supabase
      .from('video_progress')
      .select('user_id')
      .gte('last_watched_at', weekAgo.toISOString()),
    supabase
      .from('video_progress')
      .select('user_id')
      .gte('last_watched_at', monthAgo.toISOString()),
  ]);

  return {
    dau: new Set(dauResult.data?.map((r) => r.user_id) || []).size,
    wau: new Set(wauResult.data?.map((r) => r.user_id) || []).size,
    mau: new Set(mauResult.data?.map((r) => r.user_id) || []).size,
  };
}

// ============================================================================
// Transaction History (for export)
// ============================================================================

export interface Transaction {
  id: string;
  date: string;
  user_email: string;
  product_type: string;
  source: string;
  amount: number;
  status: string;
  external_id?: string | null;
  payment_intent_id?: string | null;
  charge_id?: string | null;
}

export async function getTransactions(
  supabase: SupabaseClient,
  range: DateRange,
  limit = 100,
  filters: RevenueFilters = {}
): Promise<Transaction[]> {
  const { start, end } = range;

  let query = supabase
    .from('revenue_ledger')
    .select(`
      id,
      occurred_at,
      user_id,
      product_type,
      source,
      amount_cents,
      status,
      external_id,
      payment_intent_id,
      charge_id
    `)
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }
  if (filters.productTypes && filters.productTypes.length > 0) {
    query = query.in('product_type', filters.productTypes);
  }
  if (filters.plans && filters.plans.length > 0) {
    query = query.in('plan', filters.plans);
  }
  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  const { data: purchases } = await query;

  // Get user emails
  const userIds = [...new Set(purchases?.map((p) => p.user_id) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

  return (purchases || []).map((p) => ({
    id: p.id,
    date: format(new Date(p.occurred_at), 'yyyy-MM-dd HH:mm'),
    user_email: emailMap.get(p.user_id) || 'Unknown',
    product_type: p.product_type || 'Unknown',
    source: p.source || 'Unknown',
    amount: p.amount_cents / 100,
    status: p.status,
    external_id: p.external_id,
    payment_intent_id: p.payment_intent_id,
    charge_id: p.charge_id,
  }));
}
