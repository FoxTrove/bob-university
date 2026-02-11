import React from 'react';
import { View, Text, Image } from 'react-native';

interface BobUniversityHeaderProps {
  /** Optional subtitle text below the logo */
  subtitle?: string;
  /** Size variant - compact for inline use, full for page headers */
  variant?: 'compact' | 'full';
  /** Show the tagline "Haircutting Education" */
  showTagline?: boolean;
}

// Import the Bob University logo
const bobUniversityLogo = require('../../assets/bob-university-logo.png');

export function BobUniversityHeader({
  subtitle,
  variant = 'full',
  showTagline = false
}: BobUniversityHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <View className={`items-center ${isCompact ? 'py-2' : 'py-4'}`}>
      {/* Logo */}
      <Image
        source={bobUniversityLogo}
        className={isCompact ? 'w-32 h-16' : 'w-48 h-24'}
        resizeMode="contain"
      />

      {/* Optional Subtitle */}
      {subtitle && (
        <Text
          className={`text-bu-navy font-medium mt-2 ${
            isCompact ? 'text-sm' : 'text-base'
          }`}
        >
          {subtitle}
        </Text>
      )}

      {/* Tagline (if not already in logo or needs emphasis) */}
      {showTagline && (
        <View className="flex-row items-center mt-2">
          <View className="h-px w-8 bg-bu-gold" />
          <Text className="text-bu-navy/70 text-xs uppercase tracking-wider mx-3 font-medium">
            Haircutting Education
          </Text>
          <View className="h-px w-8 bg-bu-gold" />
        </View>
      )}
    </View>
  );
}

/**
 * A compact badge version for use in cards and list items
 */
export function BobUniversityBadge() {
  return (
    <View className="flex-row items-center bg-bu-cream px-2 py-1 rounded-full">
      <Image
        source={bobUniversityLogo}
        className="w-5 h-5 mr-1"
        resizeMode="contain"
      />
      <Text className="text-bu-navy text-xs font-medium">Bob University</Text>
    </View>
  );
}

/**
 * Section divider with Bob University branding
 */
export function BobUniversitySectionHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-bu-cream/50 border-y border-bu-gold/20">
      <Image
        source={bobUniversityLogo}
        className="w-8 h-8 mr-3"
        resizeMode="contain"
      />
      <View className="flex-1">
        <Text className="text-bu-navy font-serifBold text-lg">{title}</Text>
      </View>
    </View>
  );
}
