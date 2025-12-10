import {
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  differenceInDays,
  format,
  parseISO,
} from 'date-fns';

// Date range presets
export type DateRangePreset = '1d' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

export interface DateRangeWithComparison extends DateRange {
  comparison: {
    start: Date;
    end: Date;
  };
}

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const end = endOfDay(new Date());
  let start: Date;

  switch (preset) {
    case '1d':
      start = startOfDay(new Date());
      break;
    case '7d':
      start = startOfDay(subDays(new Date(), 6));
      break;
    case '30d':
      start = startOfDay(subDays(new Date(), 29));
      break;
    case '90d':
      start = startOfDay(subDays(new Date(), 89));
      break;
    case '1y':
      start = startOfDay(subYears(new Date(), 1));
      break;
    default:
      start = startOfDay(subDays(new Date(), 29)); // Default to 30 days
  }

  return { start, end, preset };
}

/**
 * Calculate the comparison period (previous period of same duration)
 */
export function getComparisonPeriod(range: DateRange): DateRangeWithComparison {
  const daysDiff = differenceInDays(range.end, range.start) + 1;

  const comparisonEnd = startOfDay(subDays(range.start, 1));
  const comparisonStart = startOfDay(subDays(comparisonEnd, daysDiff - 1));

  return {
    ...range,
    comparison: {
      start: comparisonStart,
      end: endOfDay(comparisonEnd),
    },
  };
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage change for display
 */
export function formatPercentageChange(change: number | null): string {
  if (change === null) return 'N/A';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Format currency in cents to dollars
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Format large numbers with abbreviations (1.2K, 3.4M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format date for chart axis
 */
export function formatChartDate(date: Date | string, preset: DateRangePreset): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  switch (preset) {
    case '1d':
      return format(d, 'HH:mm');
    case '7d':
      return format(d, 'EEE');
    case '30d':
      return format(d, 'MMM d');
    case '90d':
      return format(d, 'MMM d');
    case '1y':
      return format(d, 'MMM');
    default:
      return format(d, 'MMM d');
  }
}

/**
 * Convert data to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const headers = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        // Escape commas and quotes in string values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate date labels for charts
 */
export function generateDateLabels(
  start: Date,
  end: Date,
  preset: DateRangePreset
): string[] {
  const labels: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    labels.push(format(current, 'yyyy-MM-dd'));

    // Increment based on preset
    if (preset === '1y') {
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  return labels;
}

/**
 * Preset labels for display
 */
export const PRESET_LABELS: Record<DateRangePreset, string> = {
  '1d': 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
  'custom': 'Custom',
};
