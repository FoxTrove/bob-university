import { View, FlatList, Text, RefreshControl } from 'react-native';
import type { Module } from '../../lib/database.types';
import { ModuleCard } from './ModuleCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ModuleGridProps {
  modules: Module[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  emptyMessage?: string;
}

export function ModuleGrid({
  modules,
  loading = false,
  error = null,
  onRefresh,
  emptyMessage = 'No modules available',
}: ModuleGridProps) {
  if (loading && modules.length === 0) {
    return <LoadingSpinner fullScreen message="Loading modules..." />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (modules.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-brand-muted text-center text-lg">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={modules}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-4 mb-4">
          <ModuleCard module={item} />
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
