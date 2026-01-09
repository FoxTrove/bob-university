import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { EventCard, Event } from '../../../components/events/EventCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        setEvents(data);
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
            <Text className="text-2xl font-bold text-primary mb-1">Upcoming Events</Text>
            <Text className="text-textMuted">Join us for live workshops and sessions</Text>
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
