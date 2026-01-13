'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DateRangePreset, formatChartDate, formatCurrency } from '@/lib/analytics';

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  strokeDasharray?: string;
}

interface AnalyticsLineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
  preset: DateRangePreset;
  height?: number;
  formatValue?: 'number' | 'currency' | 'percent';
  showLegend?: boolean;
}

export function AnalyticsLineChart({
  data,
  lines,
  preset,
  height = 300,
  formatValue = 'number',
  showLegend = true,
}: AnalyticsLineChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => formatChartDate(date, preset)}
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
          labelFormatter={(label) => formatChartDate(label, preset)}
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
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.strokeDasharray}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LineChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-100 rounded-lg"
      style={{ height: `${height}px` }}
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    </div>
  );
}
