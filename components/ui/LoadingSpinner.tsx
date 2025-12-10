import React from 'react';
import { View, ActivityIndicator, Text, ViewProps } from 'react-native';

type SpinnerSize = 'small' | 'large';

interface LoadingSpinnerProps extends ViewProps {
  size?: SpinnerSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = '#000000',
  message,
  fullScreen = false,
  className = '',
  ...props
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-600 mt-3 text-center">{message}</Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View
        className={`flex-1 justify-center items-center bg-white ${className}`}
        {...props}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      className={`justify-center items-center py-8 ${className}`}
      {...props}
    >
      {content}
    </View>
  );
}
