import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { CertificationCard } from '../../components/certification/CertificationCard';
import { useCertifications } from '../../lib/hooks/useCertifications';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function CertificationScreen() {
  const { certifications, loading, error, refetch } = useCertifications();

  if (loading) {
    return (
        <SafeContainer edges={['top']}>
            <LoadingSpinner fullScreen message="Loading certifications..." />
        </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        <View className="p-4 border-b border-border">
            <Text className="text-3xl font-serifBold text-primary">Certifications</Text>
            <Text className="text-textMuted mt-1">Validate your skills and grow your business</Text>
        </View>

        <ScrollView 
            className="flex-1 p-4"
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refetch} />
            }
        >
            {error && (
                <View className="bg-destructive/10 p-4 rounded-lg mb-4">
                    <Text className="text-destructive">{error}</Text>
                </View>
            )}

            {certifications.length === 0 && !loading && !error && (
                <View className="items-center justify-center py-12">
                    <Text className="text-textMuted text-lg">No certifications available.</Text>
                </View>
            )}

            {certifications.map(cert => (
                <CertificationCard 
                    key={cert.id} 
                    certification={cert}
                    onRefresh={refetch}
                />
            ))}
            
            <View className="h-8" />
        </ScrollView>
      </View>
    </SafeContainer>
  );
}
