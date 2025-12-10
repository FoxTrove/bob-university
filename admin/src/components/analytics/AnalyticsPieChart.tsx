'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/analytics';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface AnalyticsPieChartProps {
  data: DataPoint[];
  height?: number;
  formatValue?: 'number' | 'currency' | 'percent';
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
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

export function AnalyticsPieChart({
  data,
  height = 300,
  formatValue = 'number',
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: AnalyticsPieChartProps) {
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderLegend = (props: { payload?: readonly { value: unknown; color?: string }[] }) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const entryValue = String(entry.value);
          const item = data.find((d) => d.name === entryValue);
          const percentage = item ? ((item.value / total) * 100).toFixed(1) : '0';

          return (
            <li key={`legend-${index}`} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || '#6B7280' }}
              />
              <span className="text-sm text-gray-600">
                {entryValue} ({percentage}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatTooltipValue(value)]}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && <Legend content={renderLegend} />}
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PieChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="w-48 h-48 rounded-full bg-gray-200 relative">
        <div className="absolute inset-8 rounded-full bg-white" />
      </div>
    </div>
  );
}
