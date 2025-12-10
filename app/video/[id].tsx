import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { MuxVideoPlayer } from '../../components/video';
import { useVideo, useVideoProgress } from '../../lib/hooks/useVideos';
import { useEntitlement } from '../../lib/hooks/useEntitlement';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useCallback } from 'react';

export default function VideoPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { video, loading, error } = useVideo(id);
  const { progress, updateProgress, markCompleted } = useVideoProgress(id);
  const { isPremium, plan, loading: entitlementLoading, canAccessVideo } = useEntitlement();

  // Check if user can access this video
  const canAccess = video ? canAccessVideo(video) : false;

  const handleProgress = useCallback(
    (position: number, duration: number) => {
      updateProgress(Math.floor(position), Math.floor(duration));
    },
    [updateProgress]
  );

  const handleComplete = useCallback(() => {
    markCompleted();
  }, [markCompleted]);

  const handleError = useCallback((errorMessage: string) => {
    console.error('Video playback error:', errorMessage);
  }, []);

  const handleSubscribe = () => {
    router.push('/subscribe');
  };

  if (loading || entitlementLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingSpinner fullScreen message="Loading video..." />
      </>
    );
  }

  if (error || !video) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <SafeContainer>
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-red-500 text-center text-lg">
              {error || 'Video not found'}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-4 bg-brand-accent px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Go Back</Text>
            </Pressable>
          </View>
        </SafeContainer>
      </>
    );
  }

  // Show paywall if video is premium and user doesn't have access
  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: video.title }} />
        <SafeContainer edges={[]}>
          <View className="flex-1 bg-black">
            {/* Locked Video Preview */}
            <View className="aspect-video bg-gray-900 items-center justify-center">
              <View className="items-center p-6">
                <Text className="text-6xl mb-4">🔒</Text>
                <Text className="text-white text-xl font-bold text-center">
                  Premium Content
                </Text>
                <Text className="text-gray-400 text-center mt-2 mb-6">
                  Subscribe to unlock this video and 150+ more
                </Text>
                <Pressable
                  onPress={handleSubscribe}
                  className="bg-brand-accent px-8 py-4 rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">
                    Subscribe Now
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Video Info */}
            <ScrollView className="flex-1 bg-brand-background">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl font-bold text-brand-primary flex-1">
                    {video.title}
                  </Text>
                  <Badge label="Premium" variant="default" />
                </View>
                {video.description && (
                  <Text className="text-brand-muted mt-2">
                    {video.description}
                  </Text>
                )}
                {video.duration_seconds && (
                  <Text className="text-brand-muted text-sm mt-2">
                    Duration: {Math.floor(video.duration_seconds / 60)} min
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: video.title,
          headerShown: true,
          headerTransparent: false,
        }}
      />
      <SafeContainer edges={[]}>
        <View className="flex-1 bg-black">
          {/* Video Player */}
          <MuxVideoPlayer
            playbackId={video.mux_playback_id}
            fallbackUrl={video.video_url}
            title={video.title}
            initialPosition={progress?.watched_seconds || 0}
            onProgress={handleProgress}
            onComplete={handleComplete}
            onError={handleError}
            autoPlay={false}
          />

          {/* Video Info */}
          <ScrollView className="flex-1 bg-brand-background">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-xl font-bold text-brand-primary flex-1">
                  {video.title}
                </Text>
                {video.is_free && <Badge label="Free" variant="success" />}
                {progress?.completed && (
                  <Badge label="Completed" variant="success" />
                )}
              </View>

              {video.description && (
                <Text className="text-brand-muted mt-2">
                  {video.description}
                </Text>
              )}

              {/* Video metadata */}
              <View className="flex-row items-center gap-4 mt-4 pt-4 border-t border-brand-border">
                {video.duration_seconds && (
                  <Text className="text-brand-muted text-sm">
                    {Math.floor(video.duration_seconds / 60)} min
                  </Text>
                )}
                {progress && !progress.completed && progress.watched_seconds > 0 && (
                  <Text className="text-brand-muted text-sm">
                    {Math.floor(progress.watched_seconds / 60)} min watched
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeContainer>
    </>
  );
}
