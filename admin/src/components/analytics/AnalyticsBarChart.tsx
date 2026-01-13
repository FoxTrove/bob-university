'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/analytics';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface BarConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface AnalyticsBarChartProps {
  data: DataPoint[];
  bars?: BarConfig[];
  height?: number;
  formatValue?: 'number' | 'currency' | 'percent';
  showLegend?: boolean;
  layout?: 'vertical' | 'horizontal';
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function AnalyticsBarChart({
  data,
  bars,
  height = 300,
  formatValue = 'number',
  showLegend = false,
  layout = 'horizontal',
  colors = DEFAULT_COLORS,
}: AnalyticsBarChartProps) {
  const formatYAxis = (value: number) => {
    switch (formatValue) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value}%`;
      default:
        if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toString();
    }
  };

  const formatTooltipValue = (value: number) => {
    switch (formatValue) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Simple single-bar chart (most common use case)
  if (!bars) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
            </>
          )}
          <Tooltip
            formatter={(value: number) => [formatTooltipValue(value), 'Value']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Multi-bar chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value}</span>
            )}
          />
        )}
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BarChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-100 rounded-lg"
      style={{ height: `${height}px` }}
    >
      <div className="h-full flex items-end justify-around px-8 pb-8 gap-4">
        {[60, 80, 45, 90, 70, 55].map((h, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t w-12"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
