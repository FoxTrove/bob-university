import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
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
  },
  {
    id: 'individual',
    name: 'Individual',
    price: '$19.99',
    period: '/month',
    description: 'Full access for solo stylists',
    features: [
      { text: 'Access to free videos', included: true },
      { text: 'All premium courses', included: true },
      { text: 'Earn certifications', included: true },
      { text: 'Stylist directory listing', included: true },
      { text: 'Team management', included: false },
    ],
    popular: true,
  },
  {
    id: 'salon',
    name: 'Salon',
    price: '$49.99',
    period: '/month',
    description: 'Train your entire team',
    features: [
      { text: 'Everything in Individual', included: true },
      { text: 'Up to 5 team members', included: true },
      { text: 'Team progress tracking', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom branding', included: true },
    ],
  },
];

function PlanCard({ plan, onSelect, loading }: { plan: Plan; onSelect: () => void; loading: boolean }) {
  const isSelected = plan.popular;
  
  return (
    <Card 
      className={`p-6 mb-6 border-2 ${isSelected ? 'border-primary bg-surfaceHighlight' : 'border-border bg-surface'}`}
      padding="none"
    >
      {plan.popular && (
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
        variant={plan.popular ? 'primary' : 'outline'}
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
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') return;
    
    setLoading(true);
    
    try {
      // 1. Fetch PaymentIntent from your backend
      // TODO: Replace with actual backend call
      // const response = await fetch(`${API_URL}/create-payment-subscription`, {
      //   method: 'POST',
      //   body: JSON.stringify({ planId }),
      // });
      // const { paymentIntent, ephemeralKey, customer } = await response.json();

      // Placeholder for now
      Alert.alert("Backend Required", "Payment integration requires backend setup for Stripe Payment Sheet.");
      
      // 2. Initialize Payment Sheet
      // const { error: initError } = await initPaymentSheet({
      //   merchantDisplayName: "Bob University",
      //   customerId: customer,
      //   customerEphemeralKeySecret: ephemeralKey,
      //   paymentIntentClientSecret: paymentIntent,
      //   allowsDelayedPaymentMethods: true,
      //   defaultBillingDetails: {
      //     name: 'Jane Doe',
      //   }
      // });
      // if (initError) throw new Error(initError.message);

      // 3. Present Payment Sheet
      // const { error: presentError } = await presentPaymentSheet();
      // if (presentError) throw new Error(presentError.message);
      
      // Alert.alert("Success", "Subscription active!");
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => handleSelectPlan(plan.id)}
                loading={loading}
              />
            ))}

            <Text className="text-textMuted text-xs text-center mt-6 mb-8">
              Payments are processed securely by Stripe. You can cancel at any time in your account settings.
            </Text>
          </View>
        </ScrollView>
      </SafeContainer>
    </>
  );
}
