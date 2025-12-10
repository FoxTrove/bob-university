import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type ProgressBarVariant = 'default' | 'success' | 'brand';
type ProgressBarSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps extends ViewProps {
  progress: number; // 0-100
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showLabel?: boolean;
  label?: string;
}

const variantStyles: Record<ProgressBarVariant, string> = {
  default: 'bg-gray-600',
  success: 'bg-green-500',
  brand: 'bg-black',
};

const sizeStyles: Record<ProgressBarSize, { track: string; bar: string }> = {
  sm: {
    track: 'h-1',
    bar: 'h-1',
  },
  md: {
    track: 'h-2',
    bar: 'h-2',
  },
  lg: {
    track: 'h-3',
    bar: 'h-3',
  },
};

export function ProgressBar({
  progress,
  variant = 'brand',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const sizeStyle = sizeStyles[size];

  return (
    <View className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <View className="flex-row justify-between mb-1">
          {label && <Text className="text-sm text-gray-600">{label}</Text>}
          {showLabel && (
            <Text className="text-sm text-gray-600">{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View className={`w-full bg-gray-200 rounded-full ${sizeStyle.track}`}>
        <View
          className={`${variantStyles[variant]} rounded-full ${sizeStyle.bar}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </View>
    </View>
  );
}
