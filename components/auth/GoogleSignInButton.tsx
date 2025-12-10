import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, Alert } from 'react-native';
import { signInWithGoogle, configureGoogleSignIn, isGoogleSignInAvailable } from '../../lib/auth/google';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Google Sign In Button Component
 *
 * Custom styled button that follows Google's branding guidelines
 * Requires a development build (won't work in Expo Go)
 * Returns null if Google Sign-In is not available
 */
export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Google Sign-In is available and configure if so
    const available = isGoogleSignInAvailable();
    setIsAvailable(available);
    if (available) {
      configureGoogleSignIn();
    }
  }, []);

  const handlePress = async () => {
    const result = await signInWithGoogle();

    if (result.success) {
      onSuccess?.();
    } else if (result.error && result.error !== 'Sign in was cancelled') {
      // Don't show error for user cancellation
      Alert.alert('Sign In Failed', result.error);
      onError?.(result.error);
    }
  };

  // Don't render anything if Google Sign-In is not available (Expo Go)
  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      className="w-full h-[50px] bg-white border border-gray-300 rounded-lg flex-row items-center justify-center"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Google "G" Logo */}
      <View className="w-5 h-5 mr-3">
        <GoogleLogo />
      </View>
      <Text className="text-gray-700 font-semibold text-base">
        Continue with Google
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Google "G" logo as SVG-like component
 * Following Google's brand guidelines for the multicolor G
 */
function GoogleLogo() {
  return (
    <View className="w-5 h-5 items-center justify-center">
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        <Text style={{ color: '#4285F4' }}>G</Text>
      </Text>
    </View>
  );
}
