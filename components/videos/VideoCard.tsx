import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { VideoWithProgress } from '../../lib/database.types';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { LockedOverlay } from './LockedOverlay';

interface VideoCardProps {
  video: VideoWithProgress;
  isLocked?: boolean;
  onPress?: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoCard({ video, isLocked = false, onPress }: VideoCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (isLocked) return;
    if (onPress) {
      onPress();
    } else {
      router.push(`/video/${video.id}`);
    }
  };

  const progress = video.video_progress;
  const watchedPercent = progress?.duration_seconds
    ? Math.round((progress.watched_seconds / progress.duration_seconds) * 100)
    : 0;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLocked}
      className="bg-brand-surface rounded-xl overflow-hidden border border-brand-border active:opacity-80"
    >
      {/* Thumbnail */}
      <View className="aspect-video bg-brand-muted/20 relative">
        {video.thumbnail_url ? (
          <Image
            source={{ uri: video.thumbnail_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-brand-muted text-4xl">🎬</Text>
          </View>
        )}

        {/* Duration badge */}
        {video.duration_seconds && (
          <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded">
            <Text className="text-white text-xs font-medium">
              {formatDuration(video.duration_seconds)}
            </Text>
          </View>
        )}

        {/* Completed check */}
        {progress?.completed && (
          <View className="absolute top-2 right-2 bg-green-500 w-6 h-6 rounded-full items-center justify-center">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}

        {/* Locked overlay */}
        {isLocked && <LockedOverlay />}
      </View>

      {/* Content */}
      <View className="p-3">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-brand-primary font-medium flex-1" numberOfLines={2}>
            {video.title}
          </Text>
          {video.is_free && <Badge label="Free" variant="success" size="sm" />}
        </View>

        {video.description && (
          <Text className="text-brand-muted text-sm mt-1" numberOfLines={2}>
            {video.description}
          </Text>
        )}

        {/* Progress bar */}
        {progress && !progress.completed && watchedPercent > 0 && (
          <View className="mt-2">
            <ProgressBar progress={watchedPercent} size="sm" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
