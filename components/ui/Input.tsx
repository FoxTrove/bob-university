import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = '',
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text mb-1 font-medium">{label}</Text>
      )}
      <TextInput
        className={`
          w-full border rounded-lg px-4 py-3 bg-surface text-text
          ${hasError ? 'border-error' : 'border-border'}
          ${className}
        `}
        placeholderTextColor="#71717a" // textMuted (Zinc 500) for better contrast
        {...props}
      />
      {error && (
        <Text className="text-error text-sm mt-1">{error}</Text>
      )}
      {hint && !error && (
        <Text className="text-textMuted text-sm mt-1">{hint}</Text>
      )}
    </View>
  );
}
