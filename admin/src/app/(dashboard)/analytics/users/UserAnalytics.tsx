'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Activity,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react';
import {
  DateRangeSelector,
  MetricCard,
  MetricCardSkeleton,
  ChartCard,
  AnalyticsLineChart,
  AnalyticsPieChart,
  AnalyticsBarChart,
  LineChartSkeleton,
  PieChartSkeleton,
  BarChartSkeleton,
} from '@/components/analytics';
import {
  DateRange,
  getDateRangeFromPreset,
  getComparisonPeriod,
  formatNumber,
} from '@/lib/analytics';

interface UserData {
  metrics: {
    totalUsers: number;
    previousTotalUsers: number;
    newUsers: number;
    previousNewUsers: number;
    dau: number;
    wau: number;
    mau: number;
    previousMau: number;
    dauMauRatio: number;
    previousDauMauRatio: number;
    conversionRate: number;
    previousConversionRate: number;
  };
  userChart: { date: string; total: number; new: number }[];
  usersByPlan: { name: string; value: number; color: string }[];
  platformDistribution: { name: string; value: number; color: string }[];
  retentionData: {
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week4: number;
  }[];
}

export function UserAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset('30d')
  );
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rangeWithComparison = getComparisonPeriod(dateRange);
        const response = await fetch('/api/analytics/users', {
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
        console.error('Failed to fetch user analytics:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <MetricCardSkeleton count={4} />
        ) : data ? (
          <>
            <MetricCard
              title="Total Users"
              value={formatNumber(data.metrics.totalUsers)}
              currentValue={data.metrics.totalUsers}
              previousValue={data.metrics.previousTotalUsers}
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
              title="Monthly Active Users"
              value={formatNumber(data.metrics.mau)}
              currentValue={data.metrics.mau}
              previousValue={data.metrics.previousMau}
              icon={Activity}
              iconColor="bg-green-100 text-green-600"
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

      {/* Active Users Summary */}
      {!loading && data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Users
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {formatNumber(data.metrics.dau)}
              </p>
              <p className="text-sm text-blue-700 mt-1">Daily Active (DAU)</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {formatNumber(data.metrics.wau)}
              </p>
              <p className="text-sm text-purple-700 mt-1">Weekly Active (WAU)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {formatNumber(data.metrics.mau)}
              </p>
              <p className="text-sm text-green-700 mt-1">Monthly Active (MAU)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                DAU/MAU Ratio (Stickiness)
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {data.metrics.dauMauRatio.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(data.metrics.dauMauRatio, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Growth Chart */}
      <ChartCard
        title="User Growth"
        subtitle="Total and new users over time"
      >
        {loading ? (
          <LineChartSkeleton height={350} />
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
            height={350}
          />
        ) : null}
      </ChartCard>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Users by Plan"
          subtitle="Distribution across subscription tiers"
        >
          {loading ? (
            <PieChartSkeleton height={280} />
          ) : data && data.usersByPlan.length > 0 ? (
            <AnalyticsPieChart data={data.usersByPlan} height={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              No subscription data available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Platform Distribution"
          subtitle="Users by device platform"
        >
          {loading ? (
            <BarChartSkeleton height={280} />
          ) : data && data.platformDistribution.length > 0 ? (
            <AnalyticsBarChart data={data.platformDistribution} height={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              No platform data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Retention Table */}
      <ChartCard
        title="Retention Cohorts"
        subtitle="User retention by signup week"
      >
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : data && data.retentionData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cohort
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week 0
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week 1
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week 2
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week 4
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.retentionData.map((row) => (
                  <tr key={row.cohort} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.cohort}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <RetentionCell value={row.week0} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <RetentionCell value={row.week1} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <RetentionCell value={row.week2} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <RetentionCell value={row.week4} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Not enough data for retention analysis
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function RetentionCell({ value }: { value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-100 text-green-800';
    if (v >= 60) return 'bg-green-50 text-green-700';
    if (v >= 40) return 'bg-yellow-50 text-yellow-700';
    if (v >= 20) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getColor(
        value
      )}`}
    >
      {value.toFixed(0)}%
    </span>
  );
}
