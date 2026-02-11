import { View, Text, Pressable, ScrollView, Alert, Platform, Linking, ActivityIndicator, Modal } from 'react-native';
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
import { useAuth } from '../lib/auth';

// Web subscription URL - users are directed here for payment
const WEB_SUBSCRIBE_URL = 'https://app.bobuniversity.com/subscribe';

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
}

// Apple-required external link warning modal
function ExternalLinkModal({
  visible,
  planName,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  planName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="bg-surface rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="bg-primary/20 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="open-outline" size={24} color="#C68976" />
            </View>
            <Text className="text-xl font-serifBold text-white text-center">
              Continue to Website
            </Text>
          </View>

          <Text className="text-gray-300 text-center mb-2">
            You&apos;re about to leave the app to subscribe to the{' '}
            <Text className="font-bold text-white">{planName}</Text> plan on our website.
          </Text>

          <Text className="text-gray-400 text-sm text-center mb-6">
            This purchase will be processed by Stripe on bobuniversity.com. Apple is not responsible for this transaction.
          </Text>

          <View className="space-y-3">
            <Button
              title="Continue to Website"
              onPress={onConfirm}
              variant="primary"
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Free plan is static (not stored in database)
const freePlan: DisplayPlan = {
  id: 'free',
  name: 'Free Community',
  price: '$0',
  period: 'forever',
  description: 'Explore and connect',
  features: [
    { text: 'App download & community access', included: true },
    { text: 'Browse stylist directory', included: true },
    { text: 'Core curriculum (14+ hours)', included: false },
    { text: 'Live workshops', included: false },
    { text: 'Ask Ray sessions', included: false },
    { text: 'Directory listing', included: false },
  ],
};

// Feature lists for each tier (used when DB features are empty)
// FOUNDERS PRICING Feb 2026: Signature $49/mo, Studio $97/mo, Studio Annual $970/yr, Salon $3,000/yr
const TIER_FEATURES: Record<string, string[]> = {
  signature: [
    'Full core curriculum (14+ hours)',
    'Monthly specialty workshop (live)',
    'Celebrity cut breakdowns',
    'Rotating replay vault (6 sessions)',
    'Community access',
  ],
  studio: [
    'Everything in Signature',
    'Monthly Ask Ray / Hot Seat (live)',
    'Money & Demand talks (Studio-only)',
    'Full replay archive',
    'Certification eligible',
    'Directory listing',
  ],
  'studio-annual': [
    'Everything in Signature',
    'Monthly Ask Ray / Hot Seat (live)',
    'Money & Demand talks (Studio-only)',
    'Full replay archive',
    'Certification eligible',
    'Directory listing',
    '2 months free vs monthly',
  ],
  individual: [
    'Full core curriculum (14+ hours)',
    'Monthly specialty workshop (live)',
    'Celebrity cut breakdowns',
    'Rotating replay vault (6 sessions)',
    'Community access',
  ],
  salon: [
    '5 Studio memberships included',
    'Full Signature + Studio access',
    'Owner onboarding call',
    'Quarterly optimization calls',
    'Rotate team members freely',
    'Priority support',
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
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // External link modal state (iOS only)
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [selectedExternalPlan, setSelectedExternalPlan] = useState<DisplayPlan | null>(null);

  // Fetch plans from database
  const { plans: dbPlans, loading: plansLoading, error: plansError } = useSubscriptionPlans();

  // Transform database plans to display format
  const displayPlans: DisplayPlan[] = [
    freePlan,
    ...dbPlans.map((plan) => {
      // Use DB features if available, otherwise use predefined features
      const featureList = (plan.features && plan.features.length > 0)
        ? plan.features
        : (TIER_FEATURES[plan.plan] || []);

      // Format plan name (capitalize and handle special cases)
      let displayName = plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1);
      if (plan.plan === 'individual') displayName = 'Signature';
      if (plan.plan === 'studio-annual') displayName = 'Studio Annual';
      if (plan.plan === 'salon') displayName = 'Virtual Studio Salon';

      // Plan descriptions
      const descriptions: Record<string, string> = {
        signature: 'Master the fundamentals',
        studio: 'Direct access to Ray',
        'studio-annual': 'Direct access to Ray (2 months free)',
        individual: 'Master the fundamentals',
        salon: 'Transform your entire team',
      };

      return {
        id: plan.plan,
        name: displayName,
        price: formatPlanPrice(plan.amount_cents, plan.currency),
        period: `/${plan.interval}`,
        description: plan.description || descriptions[plan.plan] || '',
        features: featureList.map((f) => ({ text: f, included: true })),
        popular: plan.plan === 'studio' || plan.plan === 'studio-annual',
      };
    }),
  ];

  // Handle external link confirmation (iOS)
  const handleExternalConfirm = async () => {
    if (!selectedExternalPlan) return;

    setShowExternalModal(false);
    setProcessingPlan(selectedExternalPlan.id);

    try {
      // Build web checkout URL with plan and user info for seamless experience
      const params = new URLSearchParams({
        plan: selectedExternalPlan.id,
        source: 'ios_app',
      });

      // Add user info if available
      if (user?.email) params.set('email', user.email);
      if (user?.user_metadata?.full_name) params.set('name', user.user_metadata.full_name);

      const url = `${WEB_SUBSCRIBE_URL}?${params.toString()}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open subscription URL:', error);
      Alert.alert('Error', 'Unable to open the subscription page. Please try again.');
    } finally {
      setProcessingPlan(null);
      setSelectedExternalPlan(null);
    }
  };

  const handleSelectPlan = async (plan: DisplayPlan) => {
    if (plan.id === 'free') return;

    // iOS: Show external link modal (per Apple guidelines)
    if (Platform.OS === 'ios') {
      setSelectedExternalPlan(plan);
      setShowExternalModal(true);
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
                Choose Your Plan
              </Text>
              <Text className="text-textMuted text-center px-4">
                Master cutting techniques and grow your business with expert-led courses and direct access to Ray.
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

            <Text className="text-textMuted text-xs text-center mt-2 mb-8">
              {Platform.OS === 'ios'
                ? 'You will be directed to our website to complete your subscription. Payments are processed securely by Stripe.'
                : 'Payments are processed securely by Stripe. You can cancel at any time in your account settings.'}
            </Text>
          </View>
        </ScrollView>
      </SafeContainer>

      {/* External link modal for iOS */}
      <ExternalLinkModal
        visible={showExternalModal}
        planName={selectedExternalPlan?.name || ''}
        onConfirm={handleExternalConfirm}
        onCancel={() => {
          setShowExternalModal(false);
          setSelectedExternalPlan(null);
        }}
      />
    </>
  );
}
