import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium' | 'gold' | 'outline' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: 'bg-surfaceHighlight',
    text: 'text-text',
  },
  success: {
    bg: 'bg-green-900/50',
    text: 'text-green-400',
  },
  warning: {
    bg: 'bg-yellow-900/50',
    text: 'text-yellow-400',
  },
  error: {
    bg: 'bg-red-900/50',
    text: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-900/50',
    text: 'text-blue-400',
  },
  premium: {
    bg: 'bg-primary',
    text: 'text-white',
  },
  gold: {
    bg: 'bg-accent',
    text: 'text-white',
  },
  outline: {
    bg: 'bg-transparent border border-text',
    text: 'text-text',
  },
  purple: {
    bg: 'bg-purple-900/50',
    text: 'text-purple-400',
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
