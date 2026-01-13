import React from 'react';
import { View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  level?: number;
  isCertified?: boolean;
}

const sizeStyles: Record<AvatarSize, {
  container: string;
  text: string;
  dimension: number;
  badgeSize: number;
  badgeOffset: number;
  badgeText: string;
  certSize: number;
  certOffset: number;
}> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-xs',
    dimension: 24,
    badgeSize: 14,
    badgeOffset: -2,
    badgeText: 'text-[8px]',
    certSize: 10,
    certOffset: -3,
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-sm',
    dimension: 32,
    badgeSize: 16,
    badgeOffset: -2,
    badgeText: 'text-[9px]',
    certSize: 12,
    certOffset: -3,
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-base',
    dimension: 40,
    badgeSize: 18,
    badgeOffset: -2,
    badgeText: 'text-[10px]',
    certSize: 14,
    certOffset: -2,
  },
  lg: {
    container: 'w-14 h-14',
    text: 'text-lg',
    dimension: 56,
    badgeSize: 22,
    badgeOffset: -2,
    badgeText: 'text-xs',
    certSize: 18,
    certOffset: -2,
  },
  xl: {
    container: 'w-20 h-20',
    text: 'text-2xl',
    dimension: 80,
    badgeSize: 28,
    badgeOffset: -2,
    badgeText: 'text-sm',
    certSize: 22,
    certOffset: -2,
  },
};

// Level colors - gradient from gray to gold
const levelColors: Record<number, { bg: string; text: string }> = {
  1: { bg: '#9ca3af', text: '#fff' },  // Gray
  2: { bg: '#6b7280', text: '#fff' },  // Dark gray
  3: { bg: '#22c55e', text: '#fff' },  // Green
  4: { bg: '#10b981', text: '#fff' },  // Emerald
  5: { bg: '#3b82f6', text: '#fff' },  // Blue
  6: { bg: '#6366f1', text: '#fff' },  // Indigo
  7: { bg: '#8b5cf6', text: '#fff' },  // Purple
  8: { bg: '#ec4899', text: '#fff' },  // Pink
  9: { bg: '#f59e0b', text: '#fff' },  // Amber
  10: { bg: '#fbbf24', text: '#000' }, // Gold
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
  level,
  isCertified = false,
}: AvatarProps) {
  const sizeStyle = sizeStyles[size];
  const initials = getInitials(name || '?');
  const levelColor = level ? levelColors[Math.min(level, 10)] : levelColors[1];

  const renderBadges = () => (
    <>
      {/* Level Badge - Bottom Right */}
      {level !== undefined && level > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: sizeStyle.badgeOffset,
            right: sizeStyle.badgeOffset,
            width: sizeStyle.badgeSize,
            height: sizeStyle.badgeSize,
            borderRadius: sizeStyle.badgeSize / 2,
            backgroundColor: levelColor.bg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#fff',
          }}
        >
          <Text
            className={`${sizeStyle.badgeText} font-bold`}
            style={{ color: levelColor.text }}
          >
            {level}
          </Text>
        </View>
      )}

      {/* Certified Badge - Top Right */}
      {isCertified && (
        <View
          style={{
            position: 'absolute',
            top: sizeStyle.certOffset,
            right: sizeStyle.certOffset,
            width: sizeStyle.certSize,
            height: sizeStyle.certSize,
            borderRadius: sizeStyle.certSize / 2,
            backgroundColor: '#C68976',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#fff',
          }}
        >
          <Ionicons
            name="checkmark"
            size={sizeStyle.certSize * 0.6}
            color="#fff"
          />
        </View>
      )}
    </>
  );

  if (source) {
    return (
      <View className={`relative ${className}`}>
        <View
          className={`${sizeStyle.container} rounded-full overflow-hidden`}
        >
          <Image
            source={{ uri: source }}
            style={{ width: sizeStyle.dimension, height: sizeStyle.dimension }}
            resizeMode="cover"
          />
        </View>
        {renderBadges()}
      </View>
    );
  }

  return (
    <View className={`relative ${className}`}>
      <View
        className={`
          ${sizeStyle.container}
          rounded-full
          bg-surfaceHighlight
          items-center
          justify-center
        `}
      >
        <Text className={`${sizeStyle.text} font-semibold text-text`}>
          {initials}
        </Text>
      </View>
      {renderBadges()}
    </View>
  );
}
