import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Card } from '../components/ui/Card';

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

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  return (
    <Card variant={plan.popular ? 'elevated' : 'outlined'} className="p-4 mb-4">
      {plan.popular && (
        <View className="absolute -top-3 right-4 bg-brand-accent px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-medium">Most Popular</Text>
        </View>
      )}

      <Text className="text-lg font-bold text-brand-primary">{plan.name}</Text>
      <View className="flex-row items-baseline mt-1">
        <Text className="text-3xl font-bold text-brand-primary">{plan.price}</Text>
        <Text className="text-brand-muted ml-1">{plan.period}</Text>
      </View>
      <Text className="text-brand-muted mt-2">{plan.description}</Text>

      <View className="mt-4 space-y-2">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-center gap-2">
            <Text className={feature.included ? 'text-green-500' : 'text-brand-muted'}>
              {feature.included ? '✓' : '✗'}
            </Text>
            <Text
              className={feature.included ? 'text-brand-primary' : 'text-brand-muted'}
            >
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onSelect}
        className={`mt-4 py-3 rounded-lg items-center ${
          plan.popular ? 'bg-brand-accent' : 'bg-brand-primary'
        }`}
      >
        <Text className="text-white font-semibold">
          {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
        </Text>
      </Pressable>
    </Card>
  );
}

export default function Subscribe() {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      router.back();
      return;
    }
    // TODO: Implement Apple IAP subscription flow in Sprint 6
    console.log('Selected plan:', planId);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Choose Your Plan',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-brand-accent font-medium">Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <SafeContainer edges={['bottom']}>
        <ScrollView className="flex-1 bg-brand-background">
          <View className="p-4">
            <Text className="text-2xl font-bold text-brand-primary text-center">
              Unlock Premium Content
            </Text>
            <Text className="text-brand-muted text-center mt-2 mb-6">
              Get full access to all courses and certifications
            </Text>

            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}

            <Text className="text-brand-muted text-xs text-center mt-4">
              Subscriptions are managed through Apple. Cancel anytime.
            </Text>
          </View>
        </ScrollView>
      </SafeContainer>
    </>
  );
}
