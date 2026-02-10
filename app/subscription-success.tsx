import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useEntitlement } from '../lib/hooks/useEntitlement';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { refetch, isPremium, loading } = useEntitlement();

  // Refresh entitlement on mount to pick up the new subscription
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-navigate to home after entitlement is confirmed
  useEffect(() => {
    if (isPremium && !loading) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPremium, loading, router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeContainer className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center px-6">
          {/* Success Animation */}
          <View className="relative mb-8">
            <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center">
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            </View>
          </View>

          <Text className="text-3xl font-serifBold text-white text-center mb-4">
            Welcome to Bob University!
          </Text>

          <Text className="text-textMuted text-center text-lg mb-8 px-4">
            Your subscription is now active. You have full access to all premium content.
          </Text>

          {loading ? (
            <View className="items-center">
              <Text className="text-textMuted">Activating your subscription...</Text>
            </View>
          ) : isPremium ? (
            <View className="items-center w-full">
              <View className="bg-surface rounded-2xl p-6 mb-6 w-full max-w-sm">
                <Text className="text-white font-medium text-center mb-4">
                  Ready to start learning?
                </Text>
                <View className="space-y-3">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="play-circle" size={24} color="#3b82f6" />
                    <Text className="text-gray-300 flex-1">14+ hours of core curriculum</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="videocam" size={24} color="#3b82f6" />
                    <Text className="text-gray-300 flex-1">Live workshops with Ray</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="people" size={24} color="#3b82f6" />
                    <Text className="text-gray-300 flex-1">Private community access</Text>
                  </View>
                </View>
              </View>

              <Button
                title="Start Learning"
                onPress={() => router.replace('/(tabs)')}
                variant="primary"
                fullWidth
              />

              <Text className="text-textMuted text-sm text-center mt-4">
                Taking you to the app in a moment...
              </Text>
            </View>
          ) : (
            <View className="items-center w-full">
              <Text className="text-textMuted text-center mb-4">
                If your subscription doesn&apos;t appear, please restart the app.
              </Text>
              <Button
                title="Go to Home"
                onPress={() => router.replace('/(tabs)')}
                variant="outline"
                fullWidth
              />
            </View>
          )}
        </View>
      </SafeContainer>
    </>
  );
}
