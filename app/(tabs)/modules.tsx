import { View, Text } from 'react-native';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { ModuleGrid } from '../../components/modules';
import { useModules } from '../../lib/hooks';
import { BobUniversityHeader } from '../../components/branding/BobUniversityHeader';

export default function Modules() {
  const { modules, loading, error, refetch } = useModules();

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-bu-cream">
        {/* Bob University Branded Header */}
        <View className="bg-white border-b border-bu-gold/30 shadow-sm">
          <BobUniversityHeader
            variant="compact"
            subtitle="Course Library"
          />
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
