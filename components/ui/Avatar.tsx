import React from 'react';
import { View, Image, Text } from 'react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dimension: number }> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-xs',
    dimension: 24,
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-sm',
    dimension: 32,
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-base',
    dimension: 40,
  },
  lg: {
    container: 'w-14 h-14',
    text: 'text-lg',
    dimension: 56,
  },
  xl: {
    container: 'w-20 h-20',
    text: 'text-2xl',
    dimension: 80,
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  source,
  name = '',
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeStyle = sizeStyles[size];
  const initials = getInitials(name || '?');

  if (source) {
    return (
      <View
        className={`${sizeStyle.container} rounded-full overflow-hidden ${className}`}
      >
        <Image
          source={{ uri: source }}
          style={{ width: sizeStyle.dimension, height: sizeStyle.dimension }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      className={`
        ${sizeStyle.container}
        rounded-full
        bg-gray-200
        items-center
        justify-center
        ${className}
      `}
    >
      <Text className={`${sizeStyle.text} font-semibold text-gray-600`}>
        {initials}
      </Text>
    </View>
  );
}
