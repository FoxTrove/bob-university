import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercentageChange } from '@/lib/analytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  currentValue?: number;
  icon?: LucideIcon;
  iconColor?: string;
  format?: 'number' | 'currency' | 'percent';
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  previousValue,
  currentValue,
  icon: Icon,
  iconColor = 'bg-blue-100 text-blue-600',
  subtitle,
}: MetricCardProps) {
  // Calculate change if both values provided
  let change: number | null = null;
  let changeDirection: 'up' | 'down' | 'neutral' = 'neutral';

  if (previousValue !== undefined && currentValue !== undefined) {
    if (previousValue === 0) {
      change = currentValue > 0 ? 100 : null;
    } else {
      change = ((currentValue - previousValue) / previousValue) * 100;
    }

    if (change !== null) {
      changeDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    }
  }

  const TrendIcon =
    changeDirection === 'up'
      ? TrendingUp
      : changeDirection === 'down'
      ? TrendingDown
      : Minus;

  const changeColor =
    changeDirection === 'up'
      ? 'text-green-600 bg-green-50'
      : changeDirection === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-500 bg-gray-50';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>

          {change !== null && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${changeColor}`}
              >
                <TrendIcon className="h-3 w-3" />
                {formatPercentageChange(change)}
              </span>
              <span className="text-xs text-gray-500">vs previous period</span>
            </div>
          )}

          {subtitle && !change && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardSkeletonProps {
  count?: number;
}

export function MetricCardSkeleton({ count = 1 }: MetricCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="mt-3 h-8 w-32 bg-gray-200 rounded" />
              <div className="mt-3 h-5 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}
