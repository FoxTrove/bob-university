'use client';

import { Download } from 'lucide-react';
import { toCSV, downloadCSV } from '@/lib/analytics';

interface Column<T> {
  key: keyof T;
  label: string;
}

interface ExportCSVButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  filename: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function ExportCSVButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  label = 'Export CSV',
  variant = 'secondary',
}: ExportCSVButtonProps<T>) {
  const handleExport = () => {
    const csvContent = toCSV(data, columns);
    downloadCSV(csvContent, filename);
  };

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  };

  return (
    <button
      onClick={handleExport}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${variantStyles[variant]}`}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
