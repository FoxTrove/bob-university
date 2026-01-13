'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  DateRangePreset,
  DateRange,
  getDateRangeFromPreset,
  PRESET_LABELS,
} from '@/lib/analytics';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(format(value.start, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(value.end, 'yyyy-MM-dd'));

  const presets: DateRangePreset[] = ['1d', '7d', '30d', '90d', '1y'];

  const handlePresetClick = (preset: DateRangePreset) => {
    setShowCustom(false);
    onChange(getDateRangeFromPreset(preset));
  };

  const handleCustomApply = () => {
    onChange({
      start: new Date(customStart + 'T00:00:00'),
      end: new Date(customEnd + 'T23:59:59'),
      preset: 'custom',
    });
    setShowCustom(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Preset buttons */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              value.preset === preset
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
            value.preset === 'custom'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Calendar className="h-4 w-4" />
          {value.preset === 'custom' ? (
            <span>
              {format(value.start, 'MMM d')} - {format(value.end, 'MMM d, yyyy')}
            </span>
          ) : (
            <span>Custom</span>
          )}
        </button>

        {showCustom && (
          <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomApply}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
