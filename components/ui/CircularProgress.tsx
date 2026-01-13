import React from 'react';
import { View, Text } from 'react-native';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
}

// Level thresholds for reference
export const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2400, 3500];

export function getLevelProgress(points: number, level: number): { progress: number; currentMin: number; nextThreshold: number; pointsToNext: number } {
  if (level >= 10) {
    return { progress: 1, currentMin: LEVEL_THRESHOLDS[9], nextThreshold: LEVEL_THRESHOLDS[9], pointsToNext: 0 };
  }

  const currentMin = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[9];
  const pointsInLevel = points - currentMin;
  const pointsNeeded = nextThreshold - currentMin;
  const progress = Math.min(1, Math.max(0, pointsInLevel / pointsNeeded));
  const pointsToNext = nextThreshold - points;

  return { progress, currentMin, nextThreshold, pointsToNext };
}

// Simple wrapper that adds a progress ring effect using border
export function CircularProgress({
  progress,
  size,
  strokeWidth = 4,
  children,
  color = '#C68976',
  backgroundColor = '#e5e7eb',
}: CircularProgressProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Avatar container with ring */}
      <View
        style={{
          width: size + strokeWidth * 2,
          height: size + strokeWidth * 2,
          borderRadius: (size + strokeWidth * 2) / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Progress overlay - top arc */}
        <View
          style={{
            position: 'absolute',
            top: -strokeWidth,
            left: -strokeWidth,
            width: size + strokeWidth * 2,
            height: size + strokeWidth * 2,
            borderRadius: (size + strokeWidth * 2) / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: clampedProgress > 0 ? color : 'transparent',
            borderRightColor: clampedProgress > 0.25 ? color : 'transparent',
            borderBottomColor: clampedProgress > 0.5 ? color : 'transparent',
            borderLeftColor: clampedProgress > 0.75 ? color : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
        {children}
      </View>
    </View>
  );
}

// Alternative: Simple progress bar component for below avatar
interface ProgressBarProps {
  progress: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  progress,
  width = 120,
  height = 6,
  color = '#C68976',
  backgroundColor = '#e5e7eb',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width,
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${clampedProgress * 100}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
          }}
        />
      </View>
      {showLabel && label && (
        <Text style={{ fontSize: 10, color: '#71717a', marginTop: 4 }}>
          {label}
        </Text>
      )}
    </View>
  );
}
