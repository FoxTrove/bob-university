import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { VideoList } from '../../components/videos';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useModule } from '../../lib/hooks/useModules';
import { useVideos } from '../../lib/hooks/useVideos';
import { useEntitlement } from '../../lib/hooks/useEntitlement';

export default function ModuleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { module, loading: moduleLoading, error: moduleError } = useModule(id);
  const { videos, loading: videosLoading, error: videosError, refetch } = useVideos(id);
  const { canAccessVideo } = useEntitlement();

  const loading = moduleLoading || videosLoading;
  const error = moduleError || videosError;

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingSpinner fullScreen message="Loading module..." />
      </>
    );
  }

  if (error || !module) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <SafeContainer>
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-red-500 text-center text-lg">
              {error || 'Module not found'}
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

  // Calculate progress
  const completedVideos = videos.filter((v) => v.video_progress?.completed).length;
  const totalVideos = videos.length;
  const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: module.title,
          headerBackTitle: 'Modules',
        }}
      />
      <SafeContainer edges={[]}>
        <View className="flex-1 bg-background">
          {/* Module Header */}
          <View className="px-4 py-4 bg-surface border-b border-border">
            <Text className="text-2xl font-serifBold text-primary">
              {module.title}
            </Text>
            {module.description && (
              <Text className="text-textMuted mt-2">
                {module.description}
              </Text>
            )}

            {/* Progress info */}
            <View className="flex-row items-center mt-4 gap-4">
              <View className="flex-row items-center flex-1">
                 <ProgressBar progress={progressPercent} label={`${completedVideos}/${totalVideos} videos`} showLabel />
              </View>
            </View>
          </View>

          {/* Video List */}
          <VideoList
            videos={videos}
            loading={videosLoading}
            error={videosError}
            onRefresh={refetch}
            emptyMessage="No videos in this module yet."
            canAccessVideo={canAccessVideo}
          />
        </View>
      </SafeContainer>
    </>
  );
}
