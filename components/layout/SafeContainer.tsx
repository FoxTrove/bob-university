import React from 'react';
import { View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeContainerProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

export function SafeContainer({
  edges = ['top', 'bottom'],
  backgroundColor = '#ffffff',
  className = '',
  children,
  style,
  ...props
}: SafeContainerProps) {
  return (
    <SafeAreaView
      edges={edges}
      className={`flex-1 ${className}`}
      style={[{ backgroundColor }, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
