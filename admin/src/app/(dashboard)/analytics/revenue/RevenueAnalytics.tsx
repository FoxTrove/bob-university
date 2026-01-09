'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
  ArrowRight,
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
import { createClient } from '@/lib/supabase/client';
import {
  DateRange,
  getDateRangeFromPreset,
  getComparisonPeriod,
  formatCurrency,
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
    external_id?: string | null;
    payment_intent_id?: string | null;
    charge_id?: string | null;
  }[];
}

export function RevenueAnalytics() {
  const supabase = createClient();
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset('30d')
  );
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refundState, setRefundState] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rangeWithComparison = getComparisonPeriod(dateRange);
        const filters = {
          sources: sourceFilter === 'all' ? [] : [sourceFilter],
          productTypes: productFilter === 'all' ? [] : [productFilter],
          plans: planFilter === 'all' ? [] : [planFilter],
          statuses: statusFilter === 'all' ? [] : [statusFilter],
        };
        const response = await fetch('/api/analytics/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: rangeWithComparison.start.toISOString(),
            end: rangeWithComparison.end.toISOString(),
            comparisonStart: rangeWithComparison.comparison.start.toISOString(),
            comparisonEnd: rangeWithComparison.comparison.end.toISOString(),
            preset: dateRange.preset,
            filters,
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
  }, [dateRange, sourceFilter, productFilter, planFilter, statusFilter, refreshKey]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleRefund = async (transaction: RevenueData['transactions'][number]) => {
    if (transaction.source !== 'stripe') return;
    if (!transaction.payment_intent_id && !transaction.charge_id && !transaction.external_id) {
      return;
    }

    setRefundState(transaction.id);
    try {
      const payload: Record<string, unknown> = {
        action: 'refund',
        source: 'stripe',
      };

      if (transaction.payment_intent_id) {
        payload.payment_intent_id = transaction.payment_intent_id;
      } else if (transaction.charge_id) {
        payload.charge_id = transaction.charge_id;
      } else {
        payload.invoice_id = transaction.external_id;
      }

      const { data: result, error } = await supabase.functions.invoke('admin-subscription', {
        body: payload,
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setRefundState(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
        <div className="flex flex-wrap gap-3">
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="all">All Sources</option>
            <option value="stripe">Stripe (Web)</option>
            <option value="apple">Apple (iOS)</option>
            <option value="google">Google (Android)</option>
          </select>
          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="all">All Products</option>
            <option value="subscription">Subscriptions</option>
            <option value="event">Events</option>
            <option value="certification">Certifications</option>
            <option value="other">Other</option>
          </select>
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="all">All Plans</option>
            <option value="individual">Individual</option>
            <option value="salon">Salon</option>
            <option value="free">Free</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
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
          subtitle="Apple, Google Play, and Stripe breakdown"
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {tx.source === 'stripe' && tx.status === 'completed' ? (
                        <button
                          onClick={() => handleRefund(tx)}
                          className="text-xs text-red-600 hover:text-red-700 inline-flex items-center"
                        >
                          {refundState === tx.id ? 'Refunding...' : 'Refund'}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
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
