import { View, FlatList, Text, RefreshControl } from 'react-native';
import type { VideoWithProgress, Video } from '../../lib/database.types';
import { VideoCard } from './VideoCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface VideoListProps {
  videos: VideoWithProgress[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  emptyMessage?: string;
  canAccessVideo?: (video: Video) => boolean;
}

export function VideoList({
  videos,
  loading = false,
  error = null,
  onRefresh,
  emptyMessage = 'No videos available',
  canAccessVideo,
}: VideoListProps) {
  if (loading && videos.length === 0) {
    return <LoadingSpinner fullScreen message="Loading videos..." />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-brand-muted text-center text-lg">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-4 mb-4">
          <VideoCard
            video={item}
            isLocked={canAccessVideo ? !canAccessVideo(item) : false}
          />
        </View>
      )}
      contentContainerStyle={{ paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}
