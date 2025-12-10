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
        <Text className="text-gray-700 mb-1 font-medium">{label}</Text>
      )}
      <TextInput
        className={`
          w-full border rounded-lg px-4 py-3 bg-gray-50 text-gray-900
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
      {hint && !error && (
        <Text className="text-gray-500 text-sm mt-1">{hint}</Text>
      )}
    </View>
  );
}
