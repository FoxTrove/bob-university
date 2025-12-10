'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  UserPlus,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import {
  DateRangeSelector,
  MetricCard,
  MetricCardSkeleton,
  ChartCard,
  AnalyticsLineChart,
  AnalyticsPieChart,
  LineChartSkeleton,
  PieChartSkeleton,
} from '@/components/analytics';
import {
  DateRange,
  DateRangeWithComparison,
  getDateRangeFromPreset,
  getComparisonPeriod,
  formatCurrency,
  formatNumber,
} from '@/lib/analytics';

interface OverviewData {
  metrics: {
    totalRevenue: number;
    previousRevenue: number;
    mrr: number;
    previousMrr: number;
    totalUsers: number;
    previousTotalUsers: number;
    activeUsers: number;
    previousActiveUsers: number;
    newUsers: number;
    previousNewUsers: number;
    churnRate: number;
    previousChurnRate: number;
    conversionRate: number;
    previousConversionRate: number;
  };
  revenueChart: { date: string; revenue: number }[];
  userChart: { date: string; total: number; new: number }[];
  platformDistribution: { name: string; value: number; color: string }[];
}

export function AnalyticsOverview() {
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset('30d')
  );
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rangeWithComparison = getComparisonPeriod(dateRange);
        const response = await fetch('/api/analytics/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: rangeWithComparison.start.toISOString(),
            end: rangeWithComparison.end.toISOString(),
            comparisonStart: rangeWithComparison.comparison.start.toISOString(),
            comparisonEnd: rangeWithComparison.comparison.end.toISOString(),
            preset: dateRange.preset,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          <MetricCardSkeleton count={5} />
        ) : data ? (
          <>
            <MetricCard
              title="Revenue"
              value={formatCurrency(data.metrics.totalRevenue)}
              currentValue={data.metrics.totalRevenue}
              previousValue={data.metrics.previousRevenue}
              icon={DollarSign}
              iconColor="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Active Users (MAU)"
              value={formatNumber(data.metrics.activeUsers)}
              currentValue={data.metrics.activeUsers}
              previousValue={data.metrics.previousActiveUsers}
              icon={Users}
              iconColor="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="New Users"
              value={formatNumber(data.metrics.newUsers)}
              currentValue={data.metrics.newUsers}
              previousValue={data.metrics.previousNewUsers}
              icon={UserPlus}
              iconColor="bg-purple-100 text-purple-600"
            />
            <MetricCard
              title="Churn Rate"
              value={`${data.metrics.churnRate.toFixed(1)}%`}
              currentValue={data.metrics.churnRate}
              previousValue={data.metrics.previousChurnRate}
              icon={TrendingDown}
              iconColor="bg-red-100 text-red-600"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${data.metrics.conversionRate.toFixed(1)}%`}
              currentValue={data.metrics.conversionRate}
              previousValue={data.metrics.previousConversionRate}
              icon={ArrowUpRight}
              iconColor="bg-amber-100 text-amber-600"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ChartCard
          title="Revenue Trend"
          subtitle="Revenue over time"
          action={
            <Link
              href="/analytics/revenue"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View details <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {loading ? (
            <LineChartSkeleton height={280} />
          ) : data ? (
            <AnalyticsLineChart
              data={data.revenueChart}
              lines={[
                { dataKey: 'revenue', name: 'Revenue', color: '#10B981' },
              ]}
              preset={dateRange.preset}
              height={280}
              formatValue="currency"
              showLegend={false}
            />
          ) : null}
        </ChartCard>

        {/* User Growth */}
        <ChartCard
          title="User Growth"
          subtitle="Total and new users over time"
          action={
            <Link
              href="/analytics/users"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View details <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {loading ? (
            <LineChartSkeleton height={280} />
          ) : data ? (
            <AnalyticsLineChart
              data={data.userChart}
              lines={[
                { dataKey: 'total', name: 'Total Users', color: '#3B82F6' },
                {
                  dataKey: 'new',
                  name: 'New Users',
                  color: '#8B5CF6',
                  strokeDasharray: '5 5',
                },
              ]}
              preset={dateRange.preset}
              height={280}
            />
          ) : null}
        </ChartCard>
      </div>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Platform Distribution"
          subtitle="Users by device platform"
        >
          {loading ? (
            <PieChartSkeleton height={250} />
          ) : data && data.platformDistribution.length > 0 ? (
            <AnalyticsPieChart
              data={data.platformDistribution}
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No platform data available
            </div>
          )}
        </ChartCard>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <ChartCard title="Detailed Analytics" subtitle="Explore more insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/analytics/revenue"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-green-900">Revenue Analytics</p>
                  <p className="text-sm text-green-700">
                    MRR, revenue breakdown, transactions
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-green-600" />
              </Link>

              <Link
                href="/analytics/users"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-blue-900">User Analytics</p>
                  <p className="text-sm text-blue-700">
                    Growth, retention, conversions
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-blue-600" />
              </Link>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
