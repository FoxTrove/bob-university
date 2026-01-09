import { View, Text } from 'react-native';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { ModuleGrid } from '../../components/modules';
import { useModules } from '../../lib/hooks';

export default function Modules() {
  const { modules, loading, error, refetch } = useModules();

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-3xl font-serifBold text-text">
            Course Library
          </Text>
          <Text className="text-textMuted mt-1">
            Master the art of hair styling
          </Text>
        </View>

        {/* Module Grid */}
        <ModuleGrid
          modules={modules}
          loading={loading}
          error={error}
          onRefresh={refetch}
          emptyMessage="No courses available yet. Check back soon!"
        />
      </View>
    </SafeContainer>
  );
}
