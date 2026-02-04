import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { EventCard, Event } from '../../../components/events/EventCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfile } from '../../../lib/hooks/useProfile';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen() {
  const { userType } = useProfile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSalonOwner = userType === 'salon_owner';

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      if (data) {
        // Map database rows to Event interface, providing defaults for nullable fields
        const mappedEvents: Event[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          event_date: row.event_date,
          location: row.location || '',
          price_cents: row.price_cents || 0,
          thumbnail_url: row.thumbnail_url || undefined,
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

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
            ) : events.length === 0 ? (
                <View className="mt-10 items-center px-4">
                    <Text className="text-textMuted text-center">No upcoming events scheduled at the moment.</Text>
                </View>
            ) : (
                events.map(event => (
                    <EventCard 
                        key={event.id} 
                        event={event} 
                    />
                ))
            )}
             <View className="h-8" />
        </ScrollView>
      </View>
    </SafeContainer>
  );
}
