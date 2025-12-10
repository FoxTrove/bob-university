import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { Module } from '../../lib/database.types';
import { ProgressBar } from '../ui/ProgressBar';

interface ModuleCardProps {
  module: Module;
  videoCount?: number;
  completedCount?: number;
  progressPercent?: number;
}

export function ModuleCard({
  module,
  videoCount = 0,
  completedCount = 0,
  progressPercent = 0,
}: ModuleCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/module/${module.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-brand-surface rounded-xl overflow-hidden border border-brand-border active:opacity-80"
    >
      {/* Thumbnail */}
      <View className="aspect-video bg-brand-muted/20">
        {module.thumbnail_url ? (
          <Image
            source={{ uri: module.thumbnail_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-brand-muted text-4xl">📚</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-brand-primary font-semibold text-lg" numberOfLines={2}>
          {module.title}
        </Text>

        {module.description && (
          <Text className="text-brand-muted text-sm mt-1" numberOfLines={2}>
            {module.description}
          </Text>
        )}

        {/* Video count and progress */}
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-brand-muted text-xs">
              {videoCount} {videoCount === 1 ? 'video' : 'videos'}
            </Text>
            {completedCount > 0 && (
              <Text className="text-brand-accent text-xs font-medium">
                {completedCount}/{videoCount} completed
              </Text>
            )}
          </View>

          {videoCount > 0 && (
            <ProgressBar progress={progressPercent} size="sm" />
          )}
        </View>
      </View>
    </Pressable>
  );
}
