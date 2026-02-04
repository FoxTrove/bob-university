import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeContainer } from '../../../../components/layout/SafeContainer';
import { BackButton } from '../../../../components/ui/BackButton';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { supabase } from '../../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { PrivateEventRequest } from '../../../../components/events/PrivateEventRequestCard';

const EVENT_TYPE_LABELS: Record<string, string> = {
  team_training: 'Team Training',
  certification_prep: 'Certification Prep',
  advanced_workshop: 'Advanced Workshop',
  custom: 'Custom Event',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  at_salon: 'At My Salon',
  nearby_venue: 'Nearby Venue',
  virtual: 'Virtual / Online',
  flexible: 'Flexible',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  pending: {
    label: 'Pending Review',
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    description: 'Your request has been submitted and is waiting for review.',
  },
  reviewing: {
    label: 'Under Review',
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    description: 'Ray is reviewing your request and will contact you soon.',
  },
  scheduled_call: {
    label: 'Call Scheduled',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100',
    description: 'A call has been scheduled to discuss your event details.',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#22c55e',
    bgColor: 'bg-green-100',
    description: 'Your private event has been confirmed! Check back for event details.',
  },
  declined: {
    label: 'Declined',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    description: 'Unfortunately, we were unable to accommodate this request.',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    description: 'This request has been cancelled.',
  },
};

export default function PrivateEventRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<PrivateEventRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('private_event_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data as PrivateEventRequest);
    } catch (error) {
      console.error('Error fetching request:', error);
      Alert.alert('Error', 'Failed to load request details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this private event request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const { error } = await supabase
                .from('private_event_requests')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', request.id);

              if (error) throw error;

              Alert.alert('Cancelled', 'Your request has been cancelled.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel the request');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeContainer edges={['top']}>
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeContainer>
    );
  }

  if (!request) {
    return (
      <SafeContainer edges={['top']}>
        <View className="flex-1 bg-background items-center justify-center p-4">
          <Text className="text-textMuted text-center">Request not found</Text>
        </View>
      </SafeContainer>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

  const formattedStartDate = new Date(request.preferred_start_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedEndDate = request.preferred_end_date
    ? new Date(request.preferred_end_date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const scheduledCallDate = request.scheduled_call_at
    ? new Date(request.scheduled_call_at).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const canCancel = ['pending', 'reviewing'].includes(request.status);

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <BackButton />
          <View className="flex-1 ml-3">
            <Text className="text-xl font-bold text-text">Private Event Request</Text>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Status Card */}
          <Card className={`mb-4 p-4 ${statusConfig.bgColor}`}>
            <View className="flex-row items-center mb-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: statusConfig.color }}
              />
              <Text style={{ color: statusConfig.color }} className="font-bold text-lg">
                {statusConfig.label}
              </Text>
            </View>
            <Text className="text-gray-700">{statusConfig.description}</Text>

            {request.status === 'scheduled_call' && scheduledCallDate && (
              <View className="mt-3 bg-white rounded-lg p-3">
                <View className="flex-row items-center">
                  <Ionicons name="call" size={20} color="#8b5cf6" />
                  <Text className="text-purple-700 font-semibold ml-2">{scheduledCallDate}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Event Details */}
          <Card className="mb-4 p-4">
            <Text className="text-lg font-bold text-text mb-4">Event Details</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-textMuted text-sm mb-1">Event Type</Text>
                <Text className="text-text font-medium">
                  {EVENT_TYPE_LABELS[request.event_type]}
                </Text>
              </View>

              <View>
                <Text className="text-textMuted text-sm mb-1">Preferred Date(s)</Text>
                <Text className="text-text font-medium">
                  {formattedStartDate}
                  {formattedEndDate && ` - ${formattedEndDate}`}
                </Text>
                {request.flexible_dates && (
                  <Text className="text-primary text-sm">Flexible on dates</Text>
                )}
              </View>

              <View>
                <Text className="text-textMuted text-sm mb-1">Estimated Attendees</Text>
                <Text className="text-text font-medium">{request.estimated_attendees} people</Text>
              </View>

              <View>
                <Text className="text-textMuted text-sm mb-1">Location Preference</Text>
                <Text className="text-text font-medium">
                  {LOCATION_TYPE_LABELS[request.location_type]}
                </Text>
                {request.location_type === 'at_salon' && request.salon_address && (
                  <Text className="text-textMuted text-sm">{request.salon_address}</Text>
                )}
                {request.location_type === 'nearby_venue' && request.preferred_city && (
                  <Text className="text-textMuted text-sm">{request.preferred_city}</Text>
                )}
              </View>

              {request.special_requests && (
                <View>
                  <Text className="text-textMuted text-sm mb-1">Special Requests</Text>
                  <Text className="text-text">{request.special_requests}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Admin Notes (if any) */}
          {request.admin_notes && (
            <Card className="mb-4 p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
                <Text className="text-lg font-bold text-text ml-2">Notes from Ray</Text>
              </View>
              <Text className="text-text">{request.admin_notes}</Text>
            </Card>
          )}

          {/* Request Info */}
          <Card className="mb-4 p-4">
            <Text className="text-textMuted text-sm">
              Submitted on{' '}
              {new Date(request.created_at).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Card>

          {/* Cancel Button */}
          {canCancel && (
            <Button
              title="Cancel Request"
              variant="outline"
              onPress={handleCancel}
              loading={cancelling}
              fullWidth
            />
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeContainer>
  );
}
