import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { Module } from '../../lib/database.types';
import { ProgressBar } from '../ui/ProgressBar';

interface ModuleCardProps {
  module: Module & {
    totalVideos?: number;
    completedVideos?: number;
    progressPercent?: number;
  };
}

export function ModuleCard({ module }: ModuleCardProps) {
  const router = useRouter();
  const videoCount = module.totalVideos || 0;
  const completedCount = module.completedVideos || 0;
  const progressPercent = module.progressPercent || 0;

  const handlePress = () => {
    router.push(`/module/${module.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-surface rounded-lg overflow-hidden border border-border active:opacity-80"
    >
      {/* Thumbnail */}
      <View className="aspect-video bg-surfaceHighlight relative">
        {module.thumbnail_url ? (
          <Image
            source={{ uri: module.thumbnail_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-textMuted text-4xl">📚</Text>
          </View>
        )}
        
        {/* Progress Overlay */}
        {completedCount > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <ProgressBar 
                progress={progressPercent} 
                variant="default" // Using default (gray/white) for overlay
                size="sm"
              />
            </View>
            <Text className="text-white text-xs font-medium">
              {progressPercent}%
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-text font-serifBold text-lg" numberOfLines={2}>
          {module.title}
        </Text>

        <Text className="text-textMuted text-sm mt-1" numberOfLines={2}>
          {module.description}
        </Text>
        
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-textMuted text-xs">
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </Text>
          {videoCount > 0 && (
            <ProgressBar progress={progressPercent} size="sm" />
          )}
        </View>
      </View>
    </Pressable>
  );
}
