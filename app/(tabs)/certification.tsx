import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { CertificationCard } from '../../components/certification/CertificationCard';
import { useCertifications } from '../../lib/hooks/useCertifications';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function CertificationScreen() {
  const { certifications, loading, error, refetch } = useCertifications();

  if (loading) {
    return (
        <SafeContainer edges={['top']}>
            <LoadingSpinner fullScreen message="Loading certifications..." />
        </SafeContainer>
    );
  }

  // Count certified
  const certifiedCount = certifications.filter(c => c.user_status?.status === 'approved').length;
  const inProgressCount = certifications.filter(c => c.user_status?.status !== 'approved').length;

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-serifBold text-primary">Certifications</Text>
          <Text className="text-gray-400 mt-2 leading-6">
            Validate your skills and earn official credentials from Ray himself.
          </Text>
        </View>

        <ScrollView
            className="flex-1 px-4"
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refetch} />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Stats Banner */}
            {certifications.length > 0 && (
              <View className="flex-row mb-6">
                <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4 mr-2">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text className="text-green-400 font-bold text-2xl ml-2">{certifiedCount}</Text>
                  </View>
                  <Text className="text-green-400/70 text-sm">Certified</Text>
                </View>
                <View className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-4 ml-2">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="ribbon-outline" size={20} color="#C68976" />
                    <Text className="text-primary font-bold text-2xl ml-2">{inProgressCount}</Text>
                  </View>
                  <Text className="text-primary/70 text-sm">Available</Text>
                </View>
              </View>
            )}

            {/* Error State */}
            {error && (
                <Card className="mb-4 bg-red-500/10 border border-red-500/20">
                    <View className="flex-row items-center">
                        <Ionicons name="alert-circle" size={24} color="#ef4444" />
                        <Text className="text-red-400 ml-3 flex-1">{error}</Text>
                    </View>
                </Card>
            )}

            {/* Empty State */}
            {certifications.length === 0 && !loading && !error && (
                <Card className="items-center py-12">
                    <View className="bg-primary/10 p-4 rounded-full mb-4">
                        <Ionicons name="ribbon-outline" size={48} color="#C68976" />
                    </View>
                    <Text className="text-white font-bold text-lg mb-2">No Certifications Yet</Text>
                    <Text className="text-gray-400 text-center">
                        Check back soon for certification opportunities.
                    </Text>
                </Card>
            )}

            {/* Certification Cards */}
            {certifications.map(cert => (
                <CertificationCard
                    key={cert.id}
                    certification={cert}
                    onRefresh={refetch}
                />
            ))}

            {/* Info Card */}
            {certifications.length > 0 && (
              <Card className="mb-6 bg-surface/50">
                <View className="flex-row">
                  <View className="bg-primary/10 p-2 rounded-full mr-3 self-start">
                    <Ionicons name="information-circle" size={20} color="#C68976" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium mb-1">How Certifications Work</Text>
                    <Text className="text-gray-400 text-sm leading-5">
                      Complete the required modules, then submit a video demonstration for Ray's personal review. Once approved, you'll receive your official certification badge.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            <View className="h-8" />
        </ScrollView>
      </View>
    </SafeContainer>
  );
}
