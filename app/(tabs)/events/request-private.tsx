import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { BackButton } from '../../../components/ui/BackButton';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../lib/auth';
import { useProfile } from '../../../lib/hooks/useProfile';
import { supabase } from '../../../lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type EventType = 'team_training' | 'certification_prep' | 'advanced_workshop' | 'custom';
type LocationType = 'at_salon' | 'nearby_venue' | 'virtual' | 'flexible';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; description: string }[] = [
  { value: 'team_training', label: 'Team Training', description: 'Foundational skills for your team' },
  { value: 'certification_prep', label: 'Certification Prep', description: 'Prepare for Bob certification exams' },
  { value: 'advanced_workshop', label: 'Advanced Workshop', description: 'Advanced cutting techniques' },
  { value: 'custom', label: 'Custom Event', description: 'Something specific to your needs' },
];

const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'at_salon', label: 'At My Salon' },
  { value: 'nearby_venue', label: 'Nearby Venue' },
  { value: 'virtual', label: 'Virtual / Online' },
  { value: 'flexible', label: 'Flexible' },
];

export default function RequestPrivateEventScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Form state
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [preferredEndDate, setPreferredEndDate] = useState('');
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [estimatedAttendees, setEstimatedAttendees] = useState('');
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [salonAddress, setSalonAddress] = useState('');
  const [preferredCity, setPreferredCity] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const validateForm = (): string | null => {
    if (!eventType) return 'Please select an event type';
    if (!preferredStartDate) return 'Please enter a preferred start date';
    if (!estimatedAttendees || parseInt(estimatedAttendees) < 1) {
      return 'Please enter the number of attendees';
    }
    if (!locationType) return 'Please select a location preference';
    if (locationType === 'at_salon' && !salonAddress) {
      return 'Please enter your salon address';
    }
    if (locationType === 'nearby_venue' && !preferredCity) {
      return 'Please enter your preferred city';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Missing Information', error);
      return;
    }

    if (!user?.id || !profile?.salon_id) {
      Alert.alert('Error', 'Unable to submit request. Please try again.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from('private_event_requests')
        .insert({
          salon_id: profile.salon_id,
          requested_by_user_id: user.id,
          event_type: eventType,
          preferred_start_date: preferredStartDate,
          preferred_end_date: preferredEndDate || null,
          flexible_dates: flexibleDates,
          estimated_attendees: parseInt(estimatedAttendees),
          location_type: locationType,
          salon_address: locationType === 'at_salon' ? salonAddress : null,
          preferred_city: locationType === 'nearby_venue' ? preferredCity : null,
          special_requests: specialRequests || null,
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Request Submitted!',
        'Thank you for your request. Ray will review it and schedule a call to discuss details. You\'ll receive a notification once your request is reviewed.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Error submitting private event request:', err);
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEventType = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType);
  const selectedLocationType = LOCATION_TYPE_OPTIONS.find((o) => o.value === locationType);

  return (
    <SafeContainer edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center p-4 border-b border-border">
            <BackButton />
            <View className="flex-1 ml-3">
              <Text className="text-xl font-bold text-text">Request Private Event</Text>
              <Text className="text-textMuted text-sm">Custom training for your team</Text>
            </View>
          </View>

          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            {/* Event Type */}
            <View className="mb-5">
              <Text className="text-text font-medium mb-2">Event Type *</Text>
              <TouchableOpacity
                onPress={() => setShowEventTypePicker(!showEventTypePicker)}
                className="border border-border rounded-lg p-4 bg-surface flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="calendar-outline" size={20} color="#71717a" />
                  <Text className={`ml-3 ${eventType ? 'text-text' : 'text-textMuted'}`}>
                    {selectedEventType?.label || 'Select event type'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#71717a" />
              </TouchableOpacity>

              {showEventTypePicker && (
                <View className="mt-2 border border-border rounded-lg bg-surface overflow-hidden">
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setEventType(option.value);
                        setShowEventTypePicker(false);
                      }}
                      className={`p-4 border-b border-border ${
                        eventType === option.value ? 'bg-surfaceHighlight' : ''
                      }`}
                    >
                      <Text className="text-text font-medium">{option.label}</Text>
                      <Text className="text-textMuted text-sm">{option.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Preferred Dates */}
            <View className="mb-5">
              <Text className="text-text font-medium mb-2">Preferred Dates *</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    placeholder="Start date (YYYY-MM-DD)"
                    value={preferredStartDate}
                    onChangeText={setPreferredStartDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="End date (optional)"
                    value={preferredEndDate}
                    onChangeText={setPreferredEndDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setFlexibleDates(!flexibleDates)}
                className="flex-row items-center mt-2"
              >
                <View
                  className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                    flexibleDates ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {flexibleDates && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-textMuted">I'm flexible on dates</Text>
              </TouchableOpacity>
            </View>

            {/* Estimated Attendees */}
            <View className="mb-5">
              <Text className="text-text font-medium mb-2">Estimated Attendees *</Text>
              <View className="flex-row items-center border border-border rounded-lg p-4 bg-surface">
                <Ionicons name="people-outline" size={20} color="#71717a" />
                <View className="flex-1 ml-3">
                  <Input
                    placeholder="Number of team members"
                    value={estimatedAttendees}
                    onChangeText={setEstimatedAttendees}
                    keyboardType="number-pad"
                    className="border-0 p-0 bg-transparent"
                  />
                </View>
              </View>
            </View>

            {/* Location Preference */}
            <View className="mb-5">
              <Text className="text-text font-medium mb-2">Location Preference *</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(!showLocationPicker)}
                className="border border-border rounded-lg p-4 bg-surface flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="location-outline" size={20} color="#71717a" />
                  <Text className={`ml-3 ${locationType ? 'text-text' : 'text-textMuted'}`}>
                    {selectedLocationType?.label || 'Select location preference'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#71717a" />
              </TouchableOpacity>

              {showLocationPicker && (
                <View className="mt-2 border border-border rounded-lg bg-surface overflow-hidden">
                  {LOCATION_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setLocationType(option.value);
                        setShowLocationPicker(false);
                      }}
                      className={`p-4 border-b border-border ${
                        locationType === option.value ? 'bg-surfaceHighlight' : ''
                      }`}
                    >
                      <Text className="text-text">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Conditional address/city fields */}
              {locationType === 'at_salon' && (
                <View className="mt-3">
                  <Input
                    label="Salon Address"
                    placeholder="Enter your salon's full address"
                    value={salonAddress}
                    onChangeText={setSalonAddress}
                    multiline
                  />
                </View>
              )}

              {locationType === 'nearby_venue' && (
                <View className="mt-3">
                  <Input
                    label="Preferred City"
                    placeholder="City for the event venue"
                    value={preferredCity}
                    onChangeText={setPreferredCity}
                  />
                </View>
              )}
            </View>

            {/* Special Requests */}
            <View className="mb-5">
              <Text className="text-text font-medium mb-2">Special Requests</Text>
              <View className="border border-border rounded-lg p-4 bg-surface">
                <View className="flex-row items-start">
                  <Ionicons name="document-text-outline" size={20} color="#71717a" style={{ marginTop: 4 }} />
                  <View className="flex-1 ml-3">
                    <Input
                      placeholder="Any specific topics, techniques, or accommodations you'd like us to know about..."
                      value={specialRequests}
                      onChangeText={setSpecialRequests}
                      multiline
                      numberOfLines={4}
                      className="border-0 p-0 bg-transparent min-h-[100px]"
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Info Card */}
            <View className="bg-surfaceHighlight rounded-lg p-4 mb-6">
              <Text className="text-text font-medium mb-2">What happens next?</Text>
              <Text className="text-textMuted text-sm leading-5">
                1. Ray will review your request{'\n'}
                2. You'll receive a notification to schedule a call{'\n'}
                3. Discuss details and customize your event{'\n'}
                4. Confirm booking and payment
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              title="Submit Request"
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              size="lg"
            />

            <View className="h-8" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}
