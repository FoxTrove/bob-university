import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  },
  success: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  premium: {
    bg: 'bg-black',
    text: 'text-white',
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string }> = {
  sm: {
    container: 'px-2 py-0.5 rounded',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1 rounded-md',
    text: 'text-sm',
  },
};

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  className = '',
  ...props
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`
        ${variantStyle.bg}
        ${sizeStyle.container}
        self-start
        ${className}
      `}
      {...props}
    >
      <Text className={`${variantStyle.text} ${sizeStyle.text} font-medium`}>
        {label}
      </Text>
    </View>
  );
}
