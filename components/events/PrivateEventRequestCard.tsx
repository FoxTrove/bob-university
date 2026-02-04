import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { router } from 'expo-router';

export interface PrivateEventRequest {
  id: string;
  salon_id: string;
  requested_by_user_id: string;
  event_type: 'team_training' | 'certification_prep' | 'advanced_workshop' | 'custom';
  preferred_start_date: string;
  preferred_end_date: string | null;
  flexible_dates: boolean;
  estimated_attendees: number;
  location_type: 'at_salon' | 'nearby_venue' | 'virtual' | 'flexible';
  salon_address: string | null;
  preferred_city: string | null;
  special_requests: string | null;
  status: 'pending' | 'reviewing' | 'scheduled_call' | 'confirmed' | 'declined' | 'cancelled';
  admin_notes: string | null;
  scheduled_call_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PrivateEventRequestCardProps {
  request: PrivateEventRequest;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  team_training: 'Team Training',
  certification_prep: 'Certification Prep',
  advanced_workshop: 'Advanced Workshop',
  custom: 'Custom Event',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  at_salon: 'At Salon',
  nearby_venue: 'Nearby Venue',
  virtual: 'Virtual',
  flexible: 'Flexible',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: {
    label: 'Pending Review',
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    icon: 'time-outline',
  },
  reviewing: {
    label: 'Under Review',
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    icon: 'eye-outline',
  },
  scheduled_call: {
    label: 'Call Scheduled',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100',
    icon: 'call-outline',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#22c55e',
    bgColor: 'bg-green-100',
    icon: 'checkmark-circle-outline',
  },
  declined: {
    label: 'Declined',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    icon: 'close-circle-outline',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    icon: 'ban-outline',
  },
};

export function PrivateEventRequestCard({ request }: PrivateEventRequestCardProps) {
  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

  const formattedDate = new Date(request.preferred_start_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const scheduledCallDate = request.scheduled_call_at
    ? new Date(request.scheduled_call_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/events/request/${request.id}`)}
      activeOpacity={0.7}
    >
      <Card className="mb-4 p-4">
        {/* Header with event type and status */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-text">
              {EVENT_TYPE_LABELS[request.event_type]}
            </Text>
            <Text className="text-textMuted text-sm">Private Event Request</Text>
          </View>
          <View className={`${statusConfig.bgColor} px-3 py-1 rounded-full flex-row items-center`}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={{ color: statusConfig.color }} className="font-medium text-sm ml-1">
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#a1a1aa" />
            <Text className="text-textMuted ml-2">
              {formattedDate}
              {request.flexible_dates && ' (Flexible)'}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#a1a1aa" />
            <Text className="text-textMuted ml-2">
              {LOCATION_TYPE_LABELS[request.location_type]}
              {request.location_type === 'at_salon' && request.salon_address && ` • ${request.salon_address}`}
              {request.location_type === 'nearby_venue' && request.preferred_city && ` • ${request.preferred_city}`}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={16} color="#a1a1aa" />
            <Text className="text-textMuted ml-2">{request.estimated_attendees} attendees</Text>
          </View>

          {/* Scheduled call info */}
          {request.status === 'scheduled_call' && scheduledCallDate && (
            <View className="mt-2 bg-purple-50 p-3 rounded-lg">
              <View className="flex-row items-center">
                <Ionicons name="call" size={16} color="#8b5cf6" />
                <Text className="text-purple-700 font-medium ml-2">
                  Call scheduled: {scheduledCallDate}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tap to view details hint */}
        <View className="flex-row items-center justify-end mt-3">
          <Text className="text-textMuted text-sm mr-1">View details</Text>
          <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}
