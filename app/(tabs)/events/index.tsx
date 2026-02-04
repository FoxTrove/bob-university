import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { EventCard, Event } from '../../../components/events/EventCard';
import { PrivateEventRequestCard, PrivateEventRequest } from '../../../components/events/PrivateEventRequestCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfile } from '../../../lib/hooks/useProfile';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen() {
  const { userType, profile } = useProfile();
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [privateEvents, setPrivateEvents] = useState<Event[]>([]);
  const [privateRequests, setPrivateRequests] = useState<PrivateEventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSalonOwner = userType === 'salon_owner';

  const fetchPublicEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .or('is_private.is.null,is_private.eq.false')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedEvents: Event[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          event_date: row.event_date,
          location: row.location || '',
          price_cents: row.price_cents || 0,
          thumbnail_url: row.thumbnail_url || undefined,
        }));
        setPublicEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching public events:', error);
    }
  };

  const fetchPrivateEventsAndRequests = async () => {
    if (!isSalonOwner || !profile?.salon_id) return;

    try {
      // Fetch confirmed private events for this salon
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('salon_id', profile.salon_id)
        .eq('is_private', true)
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      if (eventsData) {
        const mappedEvents: Event[] = eventsData.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          event_date: row.event_date,
          location: row.location || '',
          price_cents: row.price_cents || 0,
          thumbnail_url: row.thumbnail_url || undefined,
        }));
        setPrivateEvents(mappedEvents);
      }

      // Fetch private event requests (pending, reviewing, scheduled_call, confirmed but no event yet)
      const { data: requestsData, error: requestsError } = await supabase
        .from('private_event_requests')
        .select('*')
        .eq('salon_id', profile.salon_id)
        .in('status', ['pending', 'reviewing', 'scheduled_call', 'confirmed'])
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (requestsData) {
        setPrivateRequests(requestsData as PrivateEventRequest[]);
      }
    } catch (error) {
      console.error('Error fetching private events:', error);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchPublicEvents(),
      fetchPrivateEventsAndRequests(),
    ]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPublicEvents(),
      fetchPrivateEventsAndRequests(),
    ]);
    setRefreshing(false);
  }, [profile?.salon_id, isSalonOwner]);

  useEffect(() => {
    fetchAll();
  }, [profile?.salon_id]);

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        <View className="p-4 border-b border-border">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-primary mb-1">Upcoming Events</Text>
                <Text className="text-textMuted">Join us for live workshops and sessions</Text>
              </View>
              {isSalonOwner && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/events/request-private')}
                  className="bg-primary rounded-lg px-3 py-2 flex-row items-center"
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text className="text-white font-medium ml-1 text-sm">Request Private</Text>
                </TouchableOpacity>
              )}
            </View>
        </View>

        <ScrollView
            className="flex-1 p-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
            {loading ? (
                <View className="mt-10 items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
              <>
                {/* My Private Events Section - Only for salon owners */}
                {isSalonOwner && (privateRequests.length > 0 || privateEvents.length > 0) && (
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="lock-closed" size={18} color="#8b5cf6" />
                      <Text className="text-lg font-bold text-text ml-2">My Private Events</Text>
                    </View>

                    {/* Confirmed private events */}
                    {privateEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                      />
                    ))}

                    {/* Pending/In-progress requests */}
                    {privateRequests.map(request => (
                      <PrivateEventRequestCard
                        key={request.id}
                        request={request}
                      />
                    ))}
                  </View>
                )}

                {/* Public Events Section */}
                {(isSalonOwner && (privateRequests.length > 0 || privateEvents.length > 0)) && (
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="globe-outline" size={18} color="#3b82f6" />
                    <Text className="text-lg font-bold text-text ml-2">Public Events</Text>
                  </View>
                )}

                {publicEvents.length === 0 ? (
                  <View className="mt-4 items-center px-4">
                    <Text className="text-textMuted text-center">No upcoming public events scheduled at the moment.</Text>
                  </View>
                ) : (
                  publicEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                    />
                  ))
                )}
              </>
            )}
            <View className="h-8" />
        </ScrollView>
      </View>
    </SafeContainer>
  );
}
