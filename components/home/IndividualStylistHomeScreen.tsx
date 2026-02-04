import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useProfile } from '../../lib/hooks/useProfile';
import { useContinueLearning } from '../../lib/hooks/useVideos';
import { useModules } from '../../lib/hooks/useModules';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SecondaryNavMenu } from '../navigation/SecondaryNavMenu';

export function IndividualStylistHomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const { videos: continueVideos, loading: continueLoading } = useContinueLearning();
  const { modules, loading: modulesLoading } = useModules();

  const loading = continueLoading || modulesLoading;

  // Calculate overall progress
  const totalVideos = modules.reduce((sum, m) => sum + m.totalVideos, 0);
  const completedVideos = modules.reduce((sum, m) => sum + m.completedVideos, 0);
  const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  // Get modules with progress (started but not completed)
  const modulesInProgress = modules.filter((m) => m.progressPercent > 0 && m.progressPercent < 100);

  // Get next module to start (first module with 0% progress)
  const nextModule = modules.find((m) => m.progressPercent === 0);

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={['top']} className="px-6 pb-4 bg-white">
        <View className="flex-row justify-between items-start pt-2">
          <View>
            <Text className="text-3xl font-serif text-primary">
              Hey there, {user?.user_metadata?.first_name || 'Stylist'}
            </Text>
            <Text className="text-textMuted text-base font-sans mt-1">
              Keep learning. Keep growing.
            </Text>
          </View>
          <SecondaryNavMenu />
        </View>
      </SafeAreaView>

      <View className="px-6 pb-20">
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#C68976" />
          </View>
        ) : (
          <>
            {/* Continue Watching Section */}
            {continueVideos.length > 0 && (
              <View className="mt-4 mb-8">
                <Text className="text-2xl font-serif text-primary mb-4">Continue Watching</Text>
                {continueVideos.slice(0, 3).map((video) => {
                  const progress = video.video_progress;
                  const percent =
                    progress && progress.duration_seconds
                      ? ((progress.watched_seconds || 0) / progress.duration_seconds) * 100
                      : 0;

                  return (
                    <TouchableOpacity
                      key={video.id}
                      onPress={() => router.push(`/video/${video.id}`)}
                      className="flex-row mb-4 bg-white rounded-xl overflow-hidden shadow-sm shadow-black/5 border border-gray-100"
                    >
                      {/* Thumbnail */}
                      <View className="w-1/3 h-28 bg-gray-200">
                        {video.thumbnail_url ? (
                          <Image
                            source={{ uri: video.thumbnail_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Ionicons name="play-circle" size={32} color="#d1d5db" />
                          </View>
                        )}
                        {/* Play overlay */}
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                          <View className="bg-white/90 rounded-full p-2">
                            <Ionicons name="play" size={20} color="#000" />
                          </View>
                        </View>
                      </View>
                      <View className="flex-1 p-3 ml-1 justify-center">
                        <Badge label="IN PROGRESS" className="mb-2 bg-yellow-100" />
                        <Text
                          className="font-bold text-base font-serif text-primary leading-tight mb-1"
                          numberOfLines={2}
                        >
                          {video.title}
                        </Text>
                        <Text className="text-textMuted text-xs mb-2">{Math.round(percent)}% Complete</Text>
                        <View className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <View
                            className="bg-accent h-full rounded-full"
                            style={{ width: `${Math.max(5, percent)}%` }}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Module Progress Section */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-serif text-primary">Your Progress</Text>
                <TouchableOpacity onPress={() => router.push('/modules')}>
                  <Text className="text-accent font-semibold">See All</Text>
                </TouchableOpacity>
              </View>

              {/* Overall Progress Card */}
              <Card variant="elevated" className="bg-primary mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white/70 text-sm uppercase tracking-wide mb-1">
                      Overall Completion
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-white text-5xl font-bold">{overallProgress}%</Text>
                    </View>
                    <Text className="text-white/80 text-sm mt-2">
                      {completedVideos} of {totalVideos} videos completed
                    </Text>
                  </View>
                  <View className="bg-white/20 rounded-full p-4">
                    <Ionicons name="trending-up" size={32} color="white" />
                  </View>
                </View>
                {/* Progress bar */}
                <View className="mt-4 pt-4 border-t border-white/20">
                  <View className="bg-white/20 h-3 rounded-full overflow-hidden">
                    <View
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.max(2, overallProgress)}%` }}
                    />
                  </View>
                </View>
              </Card>

              {/* Modules in Progress */}
              {modulesInProgress.length > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-text mb-3">Keep Going</Text>
                  {modulesInProgress.slice(0, 3).map((module) => (
                    <TouchableOpacity
                      key={module.id}
                      onPress={() => router.push(`/module/${module.id}`)}
                      className="mb-3"
                    >
                      <Card variant="outlined" className="flex-row items-center">
                        <View className="flex-1">
                          <Text className="font-bold text-text" numberOfLines={1}>
                            {module.title}
                          </Text>
                          <Text className="text-textMuted text-sm">
                            {module.completedVideos} of {module.totalVideos} lessons
                          </Text>
                        </View>
                        <View className="items-end ml-3">
                          <Text className="text-accent font-bold text-lg">
                            {module.progressPercent}%
                          </Text>
                          <View className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                            <View
                              className="bg-accent h-full rounded-full"
                              style={{ width: `${Math.max(5, module.progressPercent)}%` }}
                            />
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Next Module to Start */}
              {nextModule && (
                <View>
                  <Text className="text-lg font-semibold text-text mb-3">Up Next</Text>
                  <TouchableOpacity onPress={() => router.push(`/module/${nextModule.id}`)}>
                    <Card variant="outlined" className="flex-row items-center">
                      <View className="bg-accent/10 rounded-full p-3 mr-3">
                        <Ionicons name="play" size={20} color="#C68976" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-text" numberOfLines={1}>
                          {nextModule.title}
                        </Text>
                        <Text className="text-textMuted text-sm">{nextModule.totalVideos} lessons</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
                    </Card>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Certification Upsell - Only show if not certified */}
            {!profile?.is_certified && (
              <TouchableOpacity onPress={() => router.push('/certification')} className="mb-8">
                <Card variant="elevated" className="bg-accent overflow-hidden">
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center mb-2">
                        <Badge label="UNLOCK YOUR POTENTIAL" variant="gold" size="sm" />
                      </View>
                      <Text className="text-white text-2xl font-serifBold mb-2">
                        Get Certified
                      </Text>
                      <Text className="text-white/80 text-sm mb-4">
                        Complete your training and earn your Bob University certification. Stand out
                        to clients and salons.
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold mr-2">Learn More</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                      </View>
                    </View>
                    <View className="bg-white/20 rounded-full p-4">
                      <Ionicons name="ribbon" size={32} color="white" />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}

            {/* Certified Badge - Show if certified */}
            {profile?.is_certified && (
              <Card variant="outlined" className="mb-8 flex-row items-center">
                <View className="bg-green-100 rounded-full p-3 mr-3">
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-text">You're Certified!</Text>
                  <Text className="text-textMuted text-sm">
                    Congratulations on completing your certification
                  </Text>
                </View>
              </Card>
            )}

            {/* Quick Actions */}
            <View className="mb-8">
              <Text className="text-2xl font-serif text-primary mb-4">Quick Actions</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => router.push('/modules')} className="flex-1">
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-blue-100 rounded-full p-3 mb-2">
                      <Ionicons name="book" size={24} color="#3b82f6" />
                    </View>
                    <Text className="text-text font-medium text-sm">Courses</Text>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/directory')} className="flex-1">
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-purple-100 rounded-full p-3 mb-2">
                      <Ionicons name="person" size={24} color="#a855f7" />
                    </View>
                    <Text className="text-text font-medium text-sm">My Profile</Text>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/events')} className="flex-1">
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-accent/10 rounded-full p-3 mb-2">
                      <Ionicons name="calendar" size={24} color="#C68976" />
                    </View>
                    <Text className="text-text font-medium text-sm">Events</Text>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
