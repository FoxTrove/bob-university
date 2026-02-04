import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Image, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { supabase } from '../../lib/supabase';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_certified: boolean | null;
  };
}

interface StylistProfile {
  id: string;
  display_name: string;
  salon_name: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  user_id: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  thumbnail_url: string | null;
}

const tips = [
  {
    id: '1',
    title: 'What to Tell Your Stylist',
    content: 'Bring reference photos and be honest about your daily styling routine.',
    icon: 'chatbubble-outline',
  },
  {
    id: '2',
    title: 'Between Appointments',
    content: 'Use sulfate-free shampoo and avoid excessive heat styling to maintain your cut.',
    icon: 'calendar-outline',
  },
  {
    id: '3',
    title: 'Find the Right Cut',
    content: 'Consider your face shape, hair texture, and lifestyle when choosing a style.',
    icon: 'cut-outline',
  },
];

export default function InspirationTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [styleGallery, setStyleGallery] = useState<CommunityPost[]>([]);
  const [featuredStylists, setFeaturedStylists] = useState<StylistProfile[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch style gallery from community posts (show_your_work category with images)
      // Note: community_posts table exists but types need regeneration
      const { data: postsData } = await (supabase as any)
        .from('community_posts')
        .select(
          `
          id, title, content, image_url, created_at,
          profile:profiles!community_posts_user_id_fkey (
            id, full_name, avatar_url, is_certified
          )
        `
        )
        .eq('is_published', true)
        .eq('is_hidden', false)
        .eq('category', 'show_your_work')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsData) {
        setStyleGallery(postsData as CommunityPost[]);
      }

      // Fetch featured stylists (public, certified)
      const { data: stylistsData } = await supabase
        .from('stylist_profiles')
        .select('id, display_name, salon_name, city, state, profile_photo_url, user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (stylistsData) {
        setFeaturedStylists(stylistsData);
      }

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, event_date, location, thumbnail_url')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      if (eventsData) {
        setUpcomingEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching inspiration data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C68976" />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-6">
          <Text className="text-3xl font-serifBold text-primary mb-2">Inspiration</Text>
          <Text className="text-textMuted mb-6">
            Discover styles, tips, and certified professionals
          </Text>

          {/* Style Gallery */}
          {styleGallery.length > 0 && (
            <View className="mb-8">
              <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                Style Gallery
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                <View className="flex-row gap-3">
                  {styleGallery.map((post) => (
                    <Pressable
                      key={post.id}
                      onPress={() => router.push(`/community/${post.id}`)}
                      className="w-40"
                    >
                      <View className="rounded-xl overflow-hidden bg-surface">
                        {post.image_url && (
                          <Image
                            source={{ uri: post.image_url }}
                            className="w-40 h-48"
                            resizeMode="cover"
                          />
                        )}
                        <View className="p-2">
                          <View className="flex-row items-center">
                            <Avatar
                              name={post.profile?.full_name || 'Stylist'}
                              source={post.profile?.avatar_url}
                              size="xs"
                              isCertified={post.profile?.is_certified ?? undefined}
                            />
                            <Text className="text-textMuted text-xs ml-2" numberOfLines={1}>
                              {post.profile?.full_name || 'Stylist'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Quick Tips */}
          <View className="mb-8">
            <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
              Quick Tips
            </Text>
            <View className="gap-3">
              {tips.map((tip) => (
                <Card key={tip.id} className="flex-row items-start p-4">
                  <View className="bg-primary/10 p-2 rounded-full mr-3">
                    <Ionicons name={tip.icon as any} size={20} color="#C68976" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text font-bold mb-1">{tip.title}</Text>
                    <Text className="text-textMuted text-sm">{tip.content}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Featured Stylists */}
          {featuredStylists.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-textMuted text-sm font-medium uppercase tracking-wider">
                  Featured Stylists
                </Text>
                <Pressable onPress={() => router.push('/directory')}>
                  <Text className="text-primary text-sm">View All</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                <View className="flex-row gap-3">
                  {featuredStylists.map((stylist) => (
                    <Pressable
                      key={stylist.id}
                      onPress={() => router.push(`/stylist/${stylist.id}`)}
                      className="w-32"
                    >
                      <Card padding="none" className="items-center p-3">
                        <Avatar
                          name={stylist.display_name}
                          source={stylist.profile_photo_url}
                          size="lg"
                          className="mb-2"
                        />
                        <Text className="text-text font-bold text-sm text-center" numberOfLines={1}>
                          {stylist.display_name}
                        </Text>
                        {(stylist.city || stylist.state) && (
                          <Text className="text-textMuted text-xs text-center" numberOfLines={1}>
                            {[stylist.city, stylist.state].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </Card>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-textMuted text-sm font-medium uppercase tracking-wider">
                  Upcoming Events
                </Text>
                <Pressable onPress={() => router.push('/events')}>
                  <Text className="text-primary text-sm">View All</Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {upcomingEvents.map((event) => (
                  <Pressable key={event.id} onPress={() => router.push(`/event/${event.id}`)}>
                    <Card className="flex-row items-center p-3">
                      {event.thumbnail_url ? (
                        <Image
                          source={{ uri: event.thumbnail_url }}
                          className="w-16 h-16 rounded-lg mr-3"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-lg bg-primary/10 items-center justify-center mr-3">
                          <Ionicons name="calendar" size={24} color="#C68976" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-text font-bold" numberOfLines={1}>
                          {event.title}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="calendar-outline" size={14} color="#71717a" />
                          <Text className="text-textMuted text-sm ml-1">
                            {formatDate(event.event_date)}
                          </Text>
                        </View>
                        {event.location && (
                          <View className="flex-row items-center mt-0.5">
                            <Ionicons name="location-outline" size={14} color="#71717a" />
                            <Text className="text-textMuted text-sm ml-1" numberOfLines={1}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#71717a" />
                    </Card>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Find a Stylist CTA */}
          <Card className="bg-primary/5 border border-primary/20 items-center py-6">
            <View className="bg-primary/20 p-3 rounded-full mb-3">
              <Ionicons name="search" size={28} color="#C68976" />
            </View>
            <Text className="text-text font-bold text-lg mb-1">Find Your Perfect Stylist</Text>
            <Text className="text-textMuted text-center px-4 mb-4">
              Browse our directory of certified professionals in your area.
            </Text>
            <Pressable
              onPress={() => router.push('/directory')}
              className="bg-primary py-3 px-6 rounded-xl"
            >
              <Text className="text-white font-bold">Browse Directory</Text>
            </Pressable>
          </Card>

          <View className="h-20" />
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
