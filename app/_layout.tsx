import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';
import "../global.css";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading, onboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const isEmbed = segments[0] === 'embed';

    if (!session && !inAuthGroup && !isEmbed) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/sign-in');
    } else if (session) {
      if (onboardingComplete && (inAuthGroup || inOnboardingGroup)) {
         // Redirect to tabs if trying to access auth/onboarding when done
         router.replace('/(tabs)');
      }
      // Note: We removed the auto-redirect to onboarding here. 
      // It is now handled by the Home screen to allow for a delayed effect.
    }
  }, [session, loading, segments, onboardingComplete]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen 
        name="onboarding" 
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
        }}
      />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="embed" />
      <Stack.Screen
        name="module/[id]"
        options={{
          headerShown: true,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="video/[id]"
        options={{
          headerShown: true,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="subscribe"
        options={{
          headerShown: true,
          title: 'Upgrade',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
      merchantIdentifier="merchant.com.bobuniversity.app" // Optional, for Apple Pay
    >
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </StripeProvider>
  );
}
