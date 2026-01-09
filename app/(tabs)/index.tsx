import { View, Text, TouchableOpacity, ScrollView, Image, ImageBackground } from 'react-native';
import { useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useContinueLearning, useRecentVideos } from '../../lib/hooks/useVideos';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const { user } = useAuth();
  const { videos: continueVideos, loading: continueLoading } = useContinueLearning();
  const { videos: recentVideos, loading: recentLoading } = useRecentVideos();
  const router = useRouter();
  const { onboardingComplete } = useAuth(); // Destructure onboardingComplete

  useEffect(() => {
    if (user && !onboardingComplete) {
      const timer = setTimeout(() => {
        router.push('/onboarding');
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [user, onboardingComplete]);

  // Hero image from assets
  const heroImage = require('../../assets/Bob Company app photos/img_1614.jpg');

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} className="px-6 pb-4 bg-white">
        <View className="flex-row justify-between items-start pt-2">
          <View>
            <Text className="text-3xl font-serif text-primary">Hey there, {user?.user_metadata?.first_name || 'Stylist'}</Text>
            <Text className="text-textMuted text-base font-sans mt-1">
              What's something new you're going to learn today?
            </Text>
          </View>
          <TouchableOpacity className="p-2 -mr-2">
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="px-6 pb-20">
        
        {/* Hero Section */}
        <View className="mt-4 mb-10 rounded-2xl overflow-hidden shadow-sm shadow-black/20 h-[500px]">
          <ImageBackground 
            source={heroImage} 
            className="w-full h-full justify-end"
            resizeMode="cover"
          >
            {/* Gradient Overlay */}
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <View className="p-6">
              <Text className="text-white text-base font-bold uppercase tracking-wider mb-1">
                Welcome to Bob University!
              </Text>
              <Text className="text-white text-4xl font-serifBold leading-tight mb-6">
                SIGNATURE CUTTING COURSE
              </Text>

              <View className="flex-row gap-4">
                <Button 
                  className="bg-white flex-1" 
                >
                  <Ionicons name="play" size={18} color="black" style={{ marginRight: 8 }} />
                  <Text className="text-black font-bold text-base">Watch</Text>
                </Button>
                
                <Button 
                  className="bg-white flex-1"
                >
                  <Ionicons name="add" size={18} color="black" style={{ marginRight: 8 }} />
                  <Text className="text-black font-bold text-base">Save for later</Text>
                </Button>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Continue Learning Section */}
        {continueVideos.length > 0 && (
          <View className="mb-10">
            <Text className="text-2xl font-serif text-primary mb-4">Recent Courses</Text>
            {continueVideos.map((video) => {
              const progress = video.video_progress;
              const percent = progress && progress.duration_seconds 
                ? ((progress.watched_seconds || 0) / progress.duration_seconds) * 100 
                : 0;
              
              return (
                <Link href={`/video/${video.id}`} key={video.id} asChild>
                  <TouchableOpacity className="flex-row mb-6 bg-white rounded-xl overflow-hidden shadow-sm shadow-black/5 border border-gray-100">
                     {/* Horizontal Card Layout */}
                    <View className="w-1/3 h-28 bg-gray-200">
                      {video.thumbnail_url ? (
                        <Image 
                          source={{ uri: video.thumbnail_url }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                         <View className="w-full h-full items-center justify-center">
                            <Text className="text-gray-400 text-xs">No Image</Text>
                         </View>
                      )}
                    </View>
                    <View className="flex-1 p-3 ml-1 justify-center">
                      <Badge label="IN PROGRESS" className="mb-2 bg-yellow-100" />
                      <Text className="font-bold text-base font-serif text-primary leading-tight mb-1" numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text className="text-textMuted text-xs mb-2">
                        {Math.round(percent)}% Complete
                      </Text>
                      <View className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <View 
                          className="bg-accent h-full rounded-full" 
                          style={{ width: `${Math.max(5, percent)}%` }} 
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        )}

        {/* New Arrivals Section */}
        <View className="mb-8">
          <View className="flex-row gap-2 items-center mb-4">
            <Badge label="New" variant="gold" /> 
            <Text className="text-2xl font-serif text-primary">Arrivals</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4 -mx-6 px-6">
            {recentVideos.length === 0 && !recentLoading ? (
              <Text className="text-textMuted italic ml-2">No videos available yet.</Text>
            ) : (
              recentVideos.map((video) => (
                <Link href={`/video/${video.id}`} key={video.id} asChild>
                  <TouchableOpacity className="w-48 mr-4">
                    <View className="h-64 rounded-xl overflow-hidden bg-gray-200 mb-3 shadow-md shadow-black/10">
                      {video.thumbnail_url ? (
                        <Image 
                          source={{ uri: video.thumbnail_url }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                         <View className="w-full h-full items-center justify-center">
                            <Text className="text-gray-400 text-xs">No Image</Text>
                         </View>
                      )}
                      <View className="absolute top-2 left-2">
                        <Badge label="NEW" variant="gold" size="sm" />
                      </View>
                    </View>
                    
                    <Text className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">
                      {video.module?.title || 'Course'}
                    </Text>
                    <Text className="font-bold text-lg font-serif text-primary leading-tight section-title" numberOfLines={2}>
                      {video.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                       <Ionicons name="star" size={12} color="black" />
                       <Text className="text-xs ml-1 font-bold">5.0</Text>
                       <Text className="text-xs text-textMuted ml-1">(24 Reviews)</Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))
            )}
            {/* Spacer */}
            <View className="w-2" />
          </ScrollView>
        </View>

      </View>
    </ScrollView>
  );
}
