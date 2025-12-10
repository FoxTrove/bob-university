import React from 'react';
import { View, Text } from 'react-native';

interface SocialDividerProps {
  text?: string;
}

/**
 * Divider component for separating social login buttons from email/password form
 * Displays a line with text in the middle (e.g., "or continue with")
 */
export function SocialDivider({ text = 'or' }: SocialDividerProps) {
  return (
    <View className="flex-row items-center my-6">
      <View className="flex-1 h-[1px] bg-gray-300" />
      <Text className="mx-4 text-gray-500 text-sm">{text}</Text>
      <View className="flex-1 h-[1px] bg-gray-300" />
    </View>
  );
}
