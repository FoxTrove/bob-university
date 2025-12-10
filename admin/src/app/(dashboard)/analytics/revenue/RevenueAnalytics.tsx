'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Download,
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
  ExportCSVButton,
} from '@/components/analytics';
import {
  DateRange,
  getDateRangeFromPreset,
  getComparisonPeriod,
  formatCurrency,
  formatNumber,
} from '@/lib/analytics';

interface RevenueData {
  metrics: {
    totalRevenue: number;
    previousRevenue: number;
    mrr: number;
    previousMrr: number;
    arpu: number;
    previousArpu: number;
    refundRate: number;
    previousRefundRate: number;
  };
  revenueChart: { date: string; revenue: number }[];
  revenueByProduct: { name: string; value: number; color: string }[];
  revenueBySource: { name: string; value: number; color: string }[];
  transactions: {
    id: string;
    date: string;
    user_email: string;
    product_type: string;
    source: string;
    amount: number;
    status: string;
  }[];
}

export function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset('30d')
  );
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rangeWithComparison = getComparisonPeriod(dateRange);
        const response = await fetch('/api/analytics/revenue', {
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
        console.error('Failed to fetch revenue analytics:', error);
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
              title="Total Revenue"
              value={formatCurrency(data.metrics.totalRevenue)}
              currentValue={data.metrics.totalRevenue}
              previousValue={data.metrics.previousRevenue}
              icon={DollarSign}
              iconColor="bg-green-100 text-green-600"
            />
            <MetricCard
              title="MRR"
              value={formatCurrency(data.metrics.mrr)}
              currentValue={data.metrics.mrr}
              previousValue={data.metrics.previousMrr}
              icon={TrendingUp}
              iconColor="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="ARPU"
              value={formatCurrency(data.metrics.arpu)}
              currentValue={data.metrics.arpu}
              previousValue={data.metrics.previousArpu}
              icon={CreditCard}
              iconColor="bg-purple-100 text-purple-600"
            />
            <MetricCard
              title="Refund Rate"
              value={`${data.metrics.refundRate.toFixed(1)}%`}
              currentValue={data.metrics.refundRate}
              previousValue={data.metrics.previousRefundRate}
              icon={RefreshCw}
              iconColor="bg-red-100 text-red-600"
            />
          </>
        ) : null}
      </div>

      {/* Revenue Trend Chart */}
      <ChartCard
        title="Revenue Over Time"
        subtitle="Daily revenue in selected period"
      >
        {loading ? (
          <LineChartSkeleton height={350} />
        ) : data ? (
          <AnalyticsLineChart
            data={data.revenueChart}
            lines={[{ dataKey: 'revenue', name: 'Revenue', color: '#10B981' }]}
            preset={dateRange.preset}
            height={350}
            formatValue="currency"
            showLegend={false}
          />
        ) : null}
      </ChartCard>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue by Product"
          subtitle="Breakdown by product type"
        >
          {loading ? (
            <PieChartSkeleton height={280} />
          ) : data && data.revenueByProduct.length > 0 ? (
            <AnalyticsPieChart
              data={data.revenueByProduct}
              height={280}
              formatValue="currency"
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Revenue by Platform"
          subtitle="iOS (Apple) vs Android/Web (Stripe)"
        >
          {loading ? (
            <BarChartSkeleton height={280} />
          ) : data && data.revenueBySource.length > 0 ? (
            <AnalyticsBarChart
              data={data.revenueBySource}
              height={280}
              formatValue="currency"
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Transactions Table */}
      <ChartCard
        title="Recent Transactions"
        subtitle="Latest purchases and payments"
        action={
          data && data.transactions.length > 0 ? (
            <ExportCSVButton
              data={data.transactions}
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'user_email', label: 'User' },
                { key: 'product_type', label: 'Product' },
                { key: 'source', label: 'Source' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' },
              ]}
              filename={`transactions-${dateRange.preset}`}
              variant="ghost"
            />
          ) : undefined
        }
      >
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : data && data.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {tx.user_email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {tx.product_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {tx.source}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : tx.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No transactions in selected period
          </div>
        )}
      </ChartCard>
    </div>
  );
}
