import { View, Text, TextInput, Pressable, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { StylistCard, StylistProfile } from '../../components/directory/StylistCard';
import { StylistMap } from '../../components/directory/StylistMap';
import { StylistProfileModal } from '../../components/directory/StylistProfileModal';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function DirectoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stylists, setStylists] = useState<StylistProfile[]>([]);
  const [visibleStylists, setVisibleStylists] = useState<StylistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<StylistProfile | null>(null);

  const fetchStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylist_profiles')
        .select('*')
        .eq('is_public', true);

      if (error) throw error;

      if (data) {
        const mappedStylists: StylistProfile[] = data.map((profile: any) => ({
          id: profile.id,
          name: profile.display_name,
          salon_name: profile.salon_name,
          location: `${profile.city}, ${profile.state}`,
          specialties: [], 
          rating: 5.0,
          certifications: ['Ray Certified'],
          avatar_url: profile.profile_photo_url,
          latitude: profile.latitude ? parseFloat(String(profile.latitude)) : undefined,
          longitude: profile.longitude ? parseFloat(String(profile.longitude)) : undefined,
          bio: profile.bio,
          instagram_handle: profile.instagram_handle,
          booking_url: profile.booking_url,
        }));
        setStylists(mappedStylists);
        setVisibleStylists(mappedStylists); // Default to all
      }
    } catch (error) {
      console.error('Error fetching stylists:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStylists();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStylists();
    }, [])
  );

  // Handle map region changes to filter visible stylists
  const handleRegionChange = (bounds: { ne: [number, number], sw: [number, number] }) => {
      const { ne, sw } = bounds;
      
      const filtered = stylists.filter(s => {
          if (!s.latitude || !s.longitude) return false;
          const inLat = s.latitude >= sw[1] && s.latitude <= ne[1];
          const inLng = s.longitude >= sw[0] && s.longitude <= ne[0];
          return inLat && inLng;
      });
      
      setVisibleStylists(filtered);
  };
  
  const displayStylists = (viewMode === 'map' && searchQuery === '') 
      ? visibleStylists 
      : stylists.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.salon_name && s.salon_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        <View className="p-4 border-b border-border z-10 bg-background">
            <Text className="text-3xl font-serifBold text-primary mb-1">Stylist Directory</Text>
            <Text className="text-textMuted mb-4">Find a Bob Company certified stylist near you</Text>
            
            <View className="flex-row gap-2">
                <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 border border-border h-10">
                    <Ionicons name="search" size={20} color="#a1a1aa" className="mr-2" />
                    <TextInput 
                        placeholder="Search by name, city, or salon..." 
                        placeholderTextColor="#a1a1aa"
                        className="flex-1 text-text h-full"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View className="flex-row bg-surface rounded-lg border border-border overflow-hidden h-10">
                    <Pressable 
                        onPress={() => setViewMode('list')}
                        className={`px-3 items-center justify-center ${viewMode === 'list' ? 'bg-surfaceHighlight' : ''}`}
                    >
                        <Ionicons name="list" size={20} color={viewMode === 'list' ? '#3b82f6' : '#a1a1aa'} />
                    </Pressable>
                    <View className="w-[1px] bg-border" />
                    <Pressable 
                        onPress={() => setViewMode('map')}
                        className={`px-3 items-center justify-center ${viewMode === 'map' ? 'bg-surfaceHighlight' : ''}`}
                    >
                        <Ionicons name="map" size={20} color={viewMode === 'map' ? '#3b82f6' : '#a1a1aa'} />
                    </Pressable>
                </View>
            </View>
        </View>

        {loading ? (
             <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        ) : (
            <View className="flex-1">
                {viewMode === 'map' && (
                    <View className="h-[45%] w-full"> 
                        <StylistMap 
                             stylists={stylists} 
                             onRegionChange={handleRegionChange}
                             onSelectStylist={setSelectedStylist}
                        />
                    </View>
                )}
                
                <FlatList
                    data={displayStylists}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                         <StylistCard 
                            stylist={item} 
                            onPress={() => setSelectedStylist(item)}
                        />
                    )}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={
                        <View className="mt-4 items-center px-4">
                             <Text className="text-textMuted text-center">
                                {viewMode === 'map' ? 'No stylists visible in this area.' : 'No stylists found matching your search.'}
                            </Text>
                        </View>
                    }
                    ListHeaderComponent={
                        viewMode === 'map' ? (
                             <Text className="text-textMuted text-sm mb-3">
                                Found {displayStylists.length} stylist{displayStylists.length !== 1 ? 's' : ''} in this area
                            </Text>
                        ) : null
                    }
                />
            </View>
        )}

        <StylistProfileModal 
            visible={!!selectedStylist} 
            stylist={selectedStylist}
            onClose={() => setSelectedStylist(null)}
        />
      </View>
    </SafeContainer>
  );
}
