import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-surfaceHighlight',
    text: 'text-text',
  },
  outline: {
    container: 'bg-transparent border border-border',
    text: 'text-text',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-text',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'py-2 px-4 rounded-md',
    text: 'text-sm',
  },
  md: {
    container: 'py-3 px-6 rounded-lg',
    text: 'text-base',
  },
  lg: {
    container: 'py-4 px-8 rounded-lg',
    text: 'text-lg',
  },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      className={`
        ${variantStyle.container}
        ${sizeStyle.container}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        items-center justify-center flex-row
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#000000'}
        />
      ) : children ? (
        children
      ) : (
        <Text className={`${variantStyle.text} ${sizeStyle.text} font-bold tracking-wide`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
