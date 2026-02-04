import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StylistProfile } from '../directory/StylistCard';
import { Event } from '../events/EventCard';

// Quick tips for clients
const QUICK_TIPS = [
  {
    id: '1',
    icon: 'cut-outline' as const,
    title: 'Communicate Clearly',
    description: 'Bring reference photos to help your stylist understand exactly what you want.',
  },
  {
    id: '2',
    icon: 'water-outline' as const,
    title: 'Hair Prep Matters',
    description: 'Come with clean, dry hair unless your stylist asks otherwise.',
  },
  {
    id: '3',
    icon: 'calendar-outline' as const,
    title: 'Book Ahead',
    description: 'The best stylists fill up fast. Book your next appointment before leaving.',
  },
];

export function ClientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [featuredStylists, setFeaturedStylists] = useState<StylistProfile[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch featured stylists (limit to 5 for carousel)
      const { data: stylists } = await supabase
        .from('stylist_profiles')
        .select('*')
        .eq('is_public', true)
        .limit(5);

      if (stylists) {
        const mappedStylists: StylistProfile[] = stylists.map((profile: any) => ({
          id: profile.id,
          name: profile.display_name,
          salon_name: profile.salon_name,
          location: `${profile.city}, ${profile.state}`,
          specialties: [],
          rating: 5.0,
          certifications: ['Ray Certified'],
          avatar_url: profile.profile_photo_url,
          bio: profile.bio,
        }));
        setFeaturedStylists(mappedStylists);
      }

      // Fetch upcoming events (limit to 3)
      const { data: events } = await supabase
        .from('events')
        .select('id, title, description, event_date, location, price_cents, thumbnail_url')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      if (events) {
        const mappedEvents: Event[] = events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          event_date: e.event_date,
          location: e.location || '',
          price_cents: e.price_cents || 0,
          thumbnail_url: e.thumbnail_url || undefined,
        }));
        setUpcomingEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={['top']} className="px-6 pb-4 bg-white">
        <View className="flex-row justify-between items-start pt-2">
          <View>
            <Text className="text-3xl font-serif text-primary">
              Hey there, {user?.user_metadata?.first_name || 'Beautiful'}
            </Text>
            <Text className="text-textMuted text-base font-sans mt-1">
              Ready to find your perfect stylist?
            </Text>
          </View>
          <TouchableOpacity className="p-2 -mr-2">
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="px-6 pb-20">
        {/* Find a Stylist CTA */}
        <TouchableOpacity
          onPress={() => router.push('/directory')}
          className="mt-4 mb-8"
        >
          <Card variant="elevated" className="bg-primary overflow-hidden">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-white text-2xl font-serifBold mb-2">
                  Find a Stylist
                </Text>
                <Text className="text-white/80 text-sm mb-4">
                  Browse our directory of certified Bob University stylists near you.
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white font-bold mr-2">Explore Directory</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
              </View>
              <View className="bg-white/20 rounded-full p-4">
                <Ionicons name="search" size={32} color="white" />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Featured Stylists Carousel */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-serif text-primary">Featured Stylists</Text>
            <TouchableOpacity onPress={() => router.push('/directory')}>
              <Text className="text-accent font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#C68976" />
          ) : featuredStylists.length === 0 ? (
            <Text className="text-textMuted italic">No stylists available yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-6 px-6"
            >
              {featuredStylists.map((stylist) => (
                <TouchableOpacity
                  key={stylist.id}
                  onPress={() => router.push('/directory')}
                  className="mr-4 w-36"
                >
                  <View className="items-center">
                    {stylist.avatar_url ? (
                      <Image
                        source={{ uri: stylist.avatar_url }}
                        className="w-24 h-24 rounded-full bg-surfaceHighlight mb-3"
                      />
                    ) : (
                      <View className="w-24 h-24 rounded-full bg-surfaceHighlight items-center justify-center mb-3">
                        <Text className="text-2xl font-bold text-textMuted">
                          {stylist.name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      className="text-base font-serifBold text-primary text-center"
                      numberOfLines={1}
                    >
                      {stylist.name}
                    </Text>
                    <Text className="text-xs text-textMuted text-center" numberOfLines={1}>
                      {stylist.salon_name || stylist.location}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={12} color="#D4AF37" />
                      <Text className="text-xs text-textMuted ml-1">Certified</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <View className="w-4" />
            </ScrollView>
          )}
        </View>

        {/* Upcoming Events */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-serif text-primary">Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/events')}>
              <Text className="text-accent font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#C68976" />
          ) : upcomingEvents.length === 0 ? (
            <Card variant="outlined" className="items-center py-6">
              <Ionicons name="calendar-outline" size={32} color="#a1a1aa" />
              <Text className="text-textMuted mt-2">No upcoming events</Text>
            </Card>
          ) : (
            upcomingEvents.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id} asChild>
                <TouchableOpacity className="mb-3">
                  <Card variant="outlined" className="flex-row items-center">
                    <View className="bg-primary/10 rounded-lg p-3 mr-4 items-center justify-center w-16">
                      <Text className="text-primary text-xs font-bold uppercase">
                        {formatEventDate(event.event_date).split(' ')[0]}
                      </Text>
                      <Text className="text-primary text-xl font-bold">
                        {formatEventDate(event.event_date).split(' ')[1]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-serifBold text-primary" numberOfLines={1}>
                        {event.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="location-outline" size={12} color="#a1a1aa" />
                        <Text className="text-xs text-textMuted ml-1" numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
                  </Card>
                </TouchableOpacity>
              </Link>
            ))
          )}
        </View>

        {/* Quick Tips */}
        <View className="mb-8">
          <Text className="text-2xl font-serif text-primary mb-4">Quick Tips</Text>

          {QUICK_TIPS.map((tip) => (
            <Card key={tip.id} variant="outlined" className="mb-3 flex-row items-start">
              <View className="bg-accent/10 rounded-full p-3 mr-4">
                <Ionicons name={tip.icon} size={20} color="#C68976" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-primary mb-1">{tip.title}</Text>
                <Text className="text-sm text-textMuted">{tip.description}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
