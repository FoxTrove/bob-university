import { View, Text, Pressable, ScrollView, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as LinkingExpo from 'expo-linking';
import { useSubscriptionPlans, formatPlanPrice } from '../lib/hooks/useSubscriptionPlans';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface DisplayPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  appleProductId?: string | null;
}

// Free plan is static (not stored in database)
const freePlan: DisplayPlan = {
  id: 'free',
  name: 'Free',
  price: '$0',
  period: 'forever',
  description: 'Get started with basic content',
  features: [
    { text: 'Access to free videos', included: true },
    { text: 'Basic tutorials', included: true },
    { text: 'Premium courses', included: false },
    { text: 'Certifications', included: false },
    { text: 'Stylist directory listing', included: false },
  ],
};

function PlanCard({ plan, onSelect, loading }: { plan: DisplayPlan; onSelect: () => void; loading: boolean }) {
  const isPopular = plan.popular;

  return (
    <Card
      className={`p-6 mb-6 border-2 ${isPopular ? 'border-primary bg-surfaceHighlight' : 'border-border bg-surface'}`}
      padding="none"
    >
      {isPopular && (
        <View className="absolute -top-3 right-6 bg-primary px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Most Popular</Text>
        </View>
      )}

      <Text className="text-xl font-serifBold text-text mb-2">{plan.name}</Text>
      <View className="flex-row items-baseline mb-4">
        <Text className="text-4xl font-serifBold text-text">{plan.price}</Text>
        <Text className="text-textMuted ml-1 font-medium">{plan.period}</Text>
      </View>
      <Text className="text-textMuted mb-6 pb-6 border-b border-border">{plan.description}</Text>

      <View className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-center gap-3">
            <Ionicons
              name={feature.included ? "checkmark-circle" : "close-circle"}
              size={20}
              color={feature.included ? "#3b82f6" : "#52525b"}
            />
            <Text
              className={`flex-1 ${feature.included ? 'text-text' : 'text-textMuted'}`}
            >
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title={plan.id === 'free' ? 'Current Plan' : 'Subscribe Now'}
        onPress={onSelect}
        variant={isPopular ? 'primary' : 'outline'}
        disabled={plan.id === 'free' || loading}
        loading={loading}
        fullWidth
      />
    </Card>
  );
}

export default function Subscribe() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Fetch plans from database
  const { plans: dbPlans, loading: plansLoading, error: plansError } = useSubscriptionPlans();

  // Transform database plans to display format
  const displayPlans: DisplayPlan[] = [
    freePlan,
    ...dbPlans.map((plan) => ({
      id: plan.plan,
      name: plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1),
      price: formatPlanPrice(plan.amount_cents, plan.currency),
      period: `/${plan.interval}`,
      description: plan.description || '',
      features: (plan.features || []).map((f) => ({ text: f, included: true })),
      popular: plan.plan === 'individual',
      appleProductId: plan.apple_product_id,
    })),
  ];

  const handleSelectPlan = async (plan: DisplayPlan) => {
    if (plan.id === 'free') return;

    // iOS: Use Apple IAP for subscriptions
    if (Platform.OS === 'ios') {
      if (plan.appleProductId) {
        // TODO: Implement Apple IAP purchase flow using StoreKit
        // For now, show placeholder alert
        Alert.alert(
          'Apple In-App Purchase',
          `Subscription will be processed through Apple.\n\nProduct ID: ${plan.appleProductId}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Coming Soon',
          'iOS subscriptions will be available through Apple In-App Purchases.'
        );
      }
      return;
    }

    // Android/Web: Use Stripe
    setProcessingPlan(plan.id);

    try {
      const returnUrl = LinkingExpo.createURL('stripe-redirect');

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan: plan.id,
          platform: Platform.OS === 'web' ? 'web' : 'mobile',
          successUrl: returnUrl,
          cancelUrl: returnUrl,
          returnUrl,
        },
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to initialize subscription');
      }

      if (Platform.OS === 'web') {
        if (data.checkoutUrl) {
          await Linking.openURL(data.checkoutUrl);
          return;
        }
        throw new Error('Missing checkout URL');
      }

      const { paymentIntent, ephemeralKey, customer } = data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Bob University",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        returnURL: returnUrl,
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);

      Alert.alert("Success", "Subscription active!");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Upgrade Plan',
          headerTitleStyle: { color: 'white' },
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: '#3b82f6',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-white font-medium text-lg">Close</Text>
            </Pressable>
          ),
        }}
      />
      <SafeContainer edges={['bottom']}>
        <ScrollView className="flex-1 bg-black">
          <View className="p-6">
            <View className="items-center mb-8">
              <View className="bg-primary/20 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="star" size={32} color="#3b82f6" />
              </View>
              <Text className="text-3xl font-serifBold text-white text-center mb-2">
                Unlock Premium
              </Text>
              <Text className="text-textMuted text-center px-4">
                Get unlimited access to 150+ expert cutting tutorials and join the community.
              </Text>
            </View>

            {plansLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-textMuted mt-4">Loading plans...</Text>
              </View>
            ) : plansError ? (
              <View className="py-12 items-center">
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text className="text-red-500 mt-4 text-center">
                  Failed to load plans. Please try again.
                </Text>
              </View>
            ) : (
              displayPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => handleSelectPlan(plan)}
                  loading={processingPlan === plan.id}
                />
              ))
            )}

            <Text className="text-textMuted text-xs text-center mt-6 mb-8">
              {Platform.OS === 'ios'
                ? 'Subscriptions are processed through Apple. You can cancel anytime in your Apple ID settings.'
                : 'Payments are processed securely by Stripe. You can cancel at any time in your account settings.'}
            </Text>
          </View>
        </ScrollView>
      </SafeContainer>
    </>
  );
}
