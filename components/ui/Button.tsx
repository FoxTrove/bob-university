import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-black',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-gray-200',
    text: 'text-gray-900',
  },
  outline: {
    container: 'bg-transparent border border-gray-300',
    text: 'text-gray-900',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-gray-900',
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
      ) : (
        <Text className={`${variantStyle.text} ${sizeStyle.text} font-semibold`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
