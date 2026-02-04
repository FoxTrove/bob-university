import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeContainer } from '../components/layout/SafeContainer';
import { BackButton } from '../components/ui/BackButton';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useSalonInvites, useEntitlement, useProfile } from '../lib/hooks';

export default function SalonInvites() {
  const router = useRouter();
  const { invites, loading, error, acceptInvite, declineInvite, refetch } = useSalonInvites();
  const { plan, isPremium } = useEntitlement();
  const { refetch: refetchProfile } = useProfile();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatExpiresAt = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    } else {
      return 'Expires soon';
    }
  };

  const handleAccept = async (inviteId: string, salonName: string) => {
    // If user has a paid subscription, warn them
    if (isPremium && (plan === 'individual' || plan === 'signature' || plan === 'studio')) {
      Alert.alert(
        'Cancel Individual Subscription?',
        `Joining ${salonName} will cancel your current ${plan} subscription at the end of your billing period. Your access will continue until then, and you'll have full access through your salon membership.\n\nDo you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join Salon',
            onPress: () => processAccept(inviteId),
          },
        ]
      );
    } else {
      processAccept(inviteId);
    }
  };

  const processAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const result = await acceptInvite(inviteId);

      // Refresh the profile to get updated salon_id
      await refetchProfile();

      let message = result.message;
      if (result.subscription_cancelled && result.cancellation_details) {
        message += `\n\nYour ${result.cancellation_details.plan} subscription will be cancelled at the end of your current billing period.`;
      }

      Alert.alert('Welcome!', message, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invite';
      Alert.alert('Error', message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inviteId: string, salonName: string) => {
    Alert.alert(
      'Decline Invite?',
      `Are you sure you want to decline the invitation from ${salonName}? You can ask for a new invite later if you change your mind.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(inviteId);
            try {
              await declineInvite(inviteId);
              Alert.alert('Invite Declined', `You have declined the invitation from ${salonName}.`);
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to decline invite';
              Alert.alert('Error', message);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          <BackButton />
          <Text className="text-3xl font-serifBold text-primary mb-2 mt-4">Salon Invites</Text>
          <Text className="text-textMuted mb-6">
            {invites.length > 0
              ? `You have ${invites.length} pending invite${invites.length === 1 ? '' : 's'}`
              : 'No pending invites'}
          </Text>

          {error && (
            <Card className="mb-4 bg-red-500/10 border border-red-500">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-500 ml-2 flex-1">{error}</Text>
                <TouchableOpacity onPress={refetch}>
                  <Text className="text-red-500 font-bold">Retry</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {invites.length === 0 && !error ? (
            <Card className="items-center py-8">
              <View className="bg-purple-500/10 p-4 rounded-full mb-4">
                <Ionicons name="mail-open-outline" size={32} color="#a855f7" />
              </View>
              <Text className="text-text font-bold text-lg">No Pending Invites</Text>
              <Text className="text-textMuted text-center px-4 mt-2">
                When a salon owner invites you to join their team, the invitation will appear here.
              </Text>
            </Card>
          ) : (
            <View className="gap-4">
              {invites.map((invite) => {
                const isProcessing = processingId === invite.id;
                const inviterName = invite.invitedBy?.full_name || invite.invitedBy?.email || 'Salon Owner';

                return (
                  <Card key={invite.id} className="p-4">
                    {/* Salon Info */}
                    <View className="flex-row items-center mb-4">
                      <View className="bg-purple-500/20 p-3 rounded-full mr-3">
                        <Ionicons name="business" size={24} color="#a855f7" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-text font-bold text-lg">
                          {invite.salon?.name || 'Salon'}
                        </Text>
                        <Text className="text-textMuted text-sm">
                          Invited by {inviterName}
                        </Text>
                      </View>
                    </View>

                    {/* Message */}
                    {invite.message && (
                      <View className="bg-surfaceHighlight rounded-lg p-3 mb-4">
                        <Text className="text-text italic">"{invite.message}"</Text>
                      </View>
                    )}

                    {/* Expiration */}
                    <View className="flex-row items-center mb-4">
                      <Ionicons name="time-outline" size={16} color="#71717a" />
                      <Text className="text-textMuted text-sm ml-2">
                        {formatExpiresAt(invite.expires_at)}
                      </Text>
                    </View>

                    {/* Subscription Warning */}
                    {isPremium && (plan === 'individual' || plan === 'signature' || plan === 'studio') && (
                      <View className="bg-yellow-500/10 rounded-lg p-3 mb-4 flex-row items-start">
                        <Ionicons name="information-circle" size={18} color="#eab308" />
                        <Text className="text-yellow-600 text-sm ml-2 flex-1">
                          Joining this salon will cancel your {plan} subscription at the end of your billing period. You'll have full access through the salon membership.
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 bg-surfaceHighlight py-3 rounded-lg items-center"
                        onPress={() => handleDecline(invite.id, invite.salon?.name || 'the salon')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#71717a" />
                        ) : (
                          <Text className="text-textMuted font-bold">Decline</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 bg-purple-500 py-3 rounded-lg items-center"
                        onPress={() => handleAccept(invite.id, invite.salon?.name || 'the salon')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text className="text-white font-bold">Accept & Join</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Info Card */}
          <View className="mt-6 flex-row items-start">
            <Ionicons name="information-circle-outline" size={18} color="#71717a" />
            <Text className="text-textMuted text-sm ml-2 flex-1">
              Joining a salon gives you access to premium training content through your salon's subscription. Your learning progress and certifications will be preserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
