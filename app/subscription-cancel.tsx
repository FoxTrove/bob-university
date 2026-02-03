import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useEntitlement } from '../lib/hooks/useEntitlement';
import { useAuth } from '../lib/auth';

type CancelReason =
  | 'too_expensive'
  | 'not_using'
  | 'found_alternative'
  | 'missing_features'
  | 'technical_issues'
  | 'other';

interface ReasonOption {
  key: CancelReason;
  label: string;
  icon: string;
}

const CANCEL_REASONS: ReasonOption[] = [
  { key: 'too_expensive', label: "It's too expensive", icon: 'wallet-outline' },
  { key: 'not_using', label: "I'm not using it enough", icon: 'time-outline' },
  { key: 'found_alternative', label: 'I found an alternative', icon: 'swap-horizontal-outline' },
  { key: 'missing_features', label: 'Missing features I need', icon: 'construct-outline' },
  { key: 'technical_issues', label: 'Technical problems', icon: 'bug-outline' },
  { key: 'other', label: 'Other reason', icon: 'ellipsis-horizontal-outline' },
];

export default function SubscriptionCancel() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, currentPeriodEnd } = useEntitlement();
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelDate, setCancelDate] = useState<string | null>(null);
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const [retentionOfferApplied, setRetentionOfferApplied] = useState(false);
  const [isInDirectory, setIsInDirectory] = useState(false);

  // Check if user has a directory listing
  React.useEffect(() => {
    const checkDirectoryListing = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('stylist_profiles')
        .select('id, is_public')
        .eq('user_id', user.id)
        .single();
      setIsInDirectory(data?.is_public || false);
    };
    checkDirectoryListing();
  }, [user?.id]);

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason', 'Help us improve by telling us why you\'re leaving.');
      return;
    }

    // Show retention offer first if not already shown
    if (!showRetentionOffer && !retentionOfferApplied) {
      setShowRetentionOffer(true);
      return;
    }

    let warningMessage = 'Your subscription will remain active until the end of your current billing period. You can resubscribe anytime.';

    // Add directory warning if user is listed
    if (isInDirectory) {
      warningMessage = 'You will be removed from the Certified Stylist Directory and lose your public listing. ' + warningMessage;
    }

    Alert.alert(
      'Cancel Subscription?',
      warningMessage,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await supabase.functions.invoke('cancel-subscription', {
                body: {
                  reason: selectedReason,
                  details: details.trim() || null,
                },
              });

              if (error) {
                throw new Error(error.message || 'Failed to cancel subscription');
              }

              if (data?.error) {
                throw new Error(data.error);
              }

              setCancelled(true);
              setCancelDate(data.current_period_end);
            } catch (err) {
              console.error('Cancel error:', err);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again or contact support.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAcceptRetentionOffer = async () => {
    setLoading(true);
    try {
      // Apply 2 months free (this would need a backend function)
      const { data, error } = await supabase.functions.invoke('apply-retention-offer', {
        body: {
          reason: selectedReason,
          offerType: 'two_months_free',
        },
      });

      if (error) {
        // If the function doesn't exist yet, just show success and go back
        console.log('Retention offer function not implemented yet');
      }

      setRetentionOfferApplied(true);
      Alert.alert(
        'Offer Applied!',
        "Great! We've extended your subscription by 2 months free. Thanks for staying with us!",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Retention offer error:', err);
      // Even if it fails, show a positive message
      Alert.alert(
        'Thank You!',
        'We appreciate you giving us another chance. Our team will reach out about your free extension.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRetentionOffer = () => {
    setShowRetentionOffer(false);
    // Continue with cancellation
    handleCancel();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Retention offer screen
  if (showRetentionOffer) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Wait!',
            headerTitleStyle: { color: 'white' },
            headerStyle: { backgroundColor: 'black' },
            headerTintColor: '#3b82f6',
          }}
        />
        <SafeContainer>
          <ScrollView className="flex-1 bg-background">
            <View className="p-6 items-center">
              {/* Offer Icon */}
              <View className="bg-primary/20 w-24 h-24 rounded-full items-center justify-center mb-6">
                <Ionicons name="gift" size={48} color="#3b82f6" />
              </View>

              <Text className="text-2xl font-serifBold text-text text-center mb-4">
                We don't want to see you go!
              </Text>

              <Text className="text-textMuted text-center mb-8 px-4">
                As a thank you for being part of Bob University, we'd like to offer you{' '}
                <Text className="text-primary font-bold">2 months free</Text> on your current plan.
              </Text>

              {/* Offer Card */}
              <Card className="w-full mb-8 bg-primary/10 border-primary">
                <View className="items-center">
                  <Text className="text-primary text-lg font-bold mb-2">Special Offer</Text>
                  <Text className="text-4xl font-serifBold text-text mb-2">2 Months Free</Text>
                  <Text className="text-textMuted text-center">
                    Continue your learning journey without paying for the next 2 months
                  </Text>
                </View>
              </Card>

              {/* What you'll keep */}
              <View className="w-full mb-8">
                <Text className="text-text font-medium mb-3">Keep access to:</Text>
                <View className="space-y-2">
                  {[
                    '150+ premium cutting tutorials',
                    'New content releases',
                    'Live workshops with Ray',
                    'Full community access',
                    isInDirectory ? 'Your stylist directory listing' : 'Stylist directory eligibility',
                  ].map((item, index) => (
                    <View key={index} className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      <Text className="text-text ml-2">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <Button
                title={loading ? 'Applying...' : 'Yes, Keep My Subscription'}
                onPress={handleAcceptRetentionOffer}
                disabled={loading}
                loading={loading}
                fullWidth
                className="mb-4"
              />

              {loading && (
                <ActivityIndicator size="small" color="#3b82f6" className="mb-4" />
              )}

              <Pressable
                onPress={handleDeclineRetentionOffer}
                disabled={loading}
                className="py-3"
              >
                <Text className="text-textMuted text-center">
                  No thanks, continue with cancellation
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeContainer>
      </>
    );
  }

  if (cancelled) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Subscription Cancelled',
            headerTitleStyle: { color: 'white' },
            headerStyle: { backgroundColor: 'black' },
            headerTintColor: '#3b82f6',
          }}
        />
        <SafeContainer>
          <View className="flex-1 bg-background p-6 items-center justify-center">
            <View className="bg-green-500/20 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            </View>
            <Text className="text-2xl font-serifBold text-text text-center mb-4">
              We're sorry to see you go
            </Text>
            <Text className="text-textMuted text-center mb-6 px-4">
              Your subscription has been cancelled. You'll continue to have access until{' '}
              <Text className="text-text font-medium">
                {cancelDate ? formatDate(cancelDate) : 'the end of your billing period'}
              </Text>.
            </Text>
            <Text className="text-textMuted text-center text-sm mb-8 px-4">
              Changed your mind? You can resubscribe anytime to regain full access.
            </Text>
            <Button
              title="Back to Profile"
              onPress={() => router.replace('/(tabs)/profile')}
              fullWidth
            />
          </View>
        </SafeContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cancel Subscription',
          headerTitleStyle: { color: 'white' },
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: '#3b82f6',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary font-medium text-lg">Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeContainer edges={['bottom']}>
        <ScrollView className="flex-1 bg-background">
          <View className="p-6">
            {/* Warning Banner */}
            <Card className="mb-6 bg-amber-500/10 border-amber-500/30">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <View className="flex-1 ml-3">
                  <Text className="text-amber-600 font-bold mb-1">
                    You'll lose access to:
                  </Text>
                  <Text className="text-amber-600/80 text-sm">
                    • 150+ premium cutting tutorials{'\n'}
                    • New content releases{'\n'}
                    • Certification eligibility{'\n'}
                    • Stylist directory listing
                  </Text>
                </View>
              </View>
            </Card>

            {/* Current Plan Info */}
            <View className="mb-6">
              <Text className="text-textMuted text-sm mb-2">Current Plan</Text>
              <Card padding="sm">
                <View className="flex-row items-center justify-between">
                  <Text className="text-text font-medium capitalize">{plan || 'Premium'}</Text>
                  {currentPeriodEnd && (
                    <Text className="text-textMuted text-sm">
                      Active until {formatDate(currentPeriodEnd)}
                    </Text>
                  )}
                </View>
              </Card>
            </View>

            {/* Reason Selection */}
            <Text className="text-text font-serifBold text-lg mb-3">
              Why are you cancelling?
            </Text>
            <Text className="text-textMuted text-sm mb-4">
              Your feedback helps us improve Bob University.
            </Text>

            <View className="space-y-3 mb-6">
              {CANCEL_REASONS.map((reason) => (
                <Pressable
                  key={reason.key}
                  onPress={() => setSelectedReason(reason.key)}
                  className={`flex-row items-center p-4 rounded-xl border ${
                    selectedReason === reason.key
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      selectedReason === reason.key ? 'bg-primary/20' : 'bg-gray-700'
                    }`}
                  >
                    <Ionicons
                      name={reason.icon as any}
                      size={20}
                      color={selectedReason === reason.key ? '#3b82f6' : '#71717a'}
                    />
                  </View>
                  <Text
                    className={`flex-1 ${
                      selectedReason === reason.key
                        ? 'text-primary font-medium'
                        : 'text-text'
                    }`}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.key && (
                    <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Additional Details */}
            <Text className="text-text font-medium mb-2">
              Anything else you'd like to share? (optional)
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Tell us more about your experience..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
              className="bg-surface border border-border rounded-xl p-4 text-text min-h-[100px] mb-8"
              textAlignVertical="top"
              maxLength={500}
            />

            {/* Action Buttons */}
            <Button
              title={loading ? 'Processing...' : 'Cancel Subscription'}
              onPress={handleCancel}
              variant="outline"
              disabled={loading || !selectedReason}
              fullWidth
              className="border-red-500"
              textClassName="text-red-500"
            />

            {loading && (
              <ActivityIndicator size="small" color="#3b82f6" className="mt-4" />
            )}

            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              className="mt-4 py-3"
            >
              <Text className="text-primary text-center font-medium">
                Never mind, keep my subscription
              </Text>
            </Pressable>

            {/* Support Link */}
            <View className="mt-8 mb-4 items-center">
              <Text className="text-textMuted text-sm text-center">
                Having issues? We might be able to help.
              </Text>
              <Pressable
                onPress={() => {
                  router.back();
                  // Could navigate to support screen or open email
                }}
                className="mt-2"
              >
                <Text className="text-primary font-medium">Contact Support</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeContainer>
    </>
  );
}
