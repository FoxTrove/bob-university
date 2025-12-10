import React, { useEffect, useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple, isAppleSignInAvailable } from '../../lib/auth/apple';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Apple Sign In Button Component
 *
 * Uses Apple's native button styling (required by Apple's Human Interface Guidelines)
 * Only renders on iOS devices that support Sign in with Apple
 */
export function AppleSignInButton({ onSuccess, onError }: AppleSignInButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple Sign In is available on this device
    isAppleSignInAvailable().then(setIsAvailable);
  }, []);

  // Only show on iOS and when available
  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  const handlePress = async () => {
    const result = await signInWithApple();

    if (result.success) {
      onSuccess?.();
    } else if (result.error && result.error !== 'Sign in was cancelled') {
      // Don't show error for user cancellation
      Alert.alert('Sign In Failed', result.error);
      onError?.(result.error);
    }
  };

  return (
    <View className="w-full">
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={{ width: '100%', height: 50 }}
        onPress={handlePress}
      />
    </View>
  );
}
