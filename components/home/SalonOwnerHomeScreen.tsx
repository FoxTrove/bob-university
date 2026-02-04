import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import type { Profile, Salon } from '../../lib/database.types';
import { SecondaryNavMenu } from '../navigation/SecondaryNavMenu';

interface StaffWithProgress extends Profile {
  completedVideos: number;
  totalVideos: number;
}

interface RecentActivity {
  id: string;
  type: 'video_completed' | 'certification_applied' | 'staff_joined';
  staffName: string;
  description: string;
  timestamp: string;
}

export function SalonOwnerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<StaffWithProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      // 1. Get owner's salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (salonError && salonError.code !== 'PGRST116') throw salonError;
      setSalon(salonData);

      if (!salonData) {
        setLoading(false);
        return;
      }

      // 2. Get total video count for progress calculation
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      setTotalVideos(videoCount || 0);

      // 3. Get staff members with their progress
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .eq('salon_id', salonData.id);

      if (staffError) throw staffError;

      // 4. Get video progress for each staff member
      const staffWithProgress: StaffWithProgress[] = await Promise.all(
        (staffData || []).map(async (member) => {
          const { count: completedCount } = await supabase
            .from('video_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', member.id)
            .eq('completed', true);

          return {
            ...member,
            completedVideos: completedCount || 0,
            totalVideos: videoCount || 0,
          };
        })
      );

      setStaff(staffWithProgress);

      // 5. Get recent activity (last 5 video completions or cert applications)
      const activities: RecentActivity[] = [];

      // Get recent video completions from staff
      const { data: recentCompletions } = await supabase
        .from('video_progress')
        .select(`
          id,
          completed_at,
          user_id,
          video_id,
          videos!inner(title)
        `)
        .in('user_id', staffData?.map((s) => s.id) || [])
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (recentCompletions) {
        for (const completion of recentCompletions) {
          const staffMember = staffData?.find((s) => s.id === completion.user_id);
          if (staffMember && completion.completed_at) {
            activities.push({
              id: completion.id,
              type: 'video_completed',
              staffName: staffMember.full_name || 'Staff member',
              description: `completed "${(completion.videos as any)?.title || 'a video'}"`,
              timestamp: completion.completed_at,
            });
          }
        }
      }

      // Sort by timestamp and take top 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching salon owner home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.id])
  );

  const certifiedCount = staff.filter((s) => s.is_certified).length;
  const avgProgress =
    staff.length > 0
      ? staff.reduce((sum, s) => sum + (s.totalVideos > 0 ? s.completedVideos / s.totalVideos : 0), 0) /
        staff.length
      : 0;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={['top']} className="px-6 pb-4 bg-white">
        <View className="flex-row justify-between items-start pt-2">
          <View>
            <Text className="text-3xl font-serif text-primary">
              Hey there, {user?.user_metadata?.first_name || 'Boss'}
            </Text>
            <Text className="text-textMuted text-base font-sans mt-1">
              {salon?.name || 'Your Salon'} Dashboard
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
            {/* Team Overview Card */}
            <TouchableOpacity onPress={() => router.push('/team')} className="mt-4 mb-6">
              <Card variant="elevated" className="bg-primary overflow-hidden">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white/70 text-sm uppercase tracking-wide mb-1">
                      Team Members
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-white text-5xl font-bold">{staff.length}</Text>
                      <Text className="text-white/70 text-xl ml-1">
                        / {salon?.max_staff || 5}
                      </Text>
                    </View>
                    <Text className="text-white/80 text-sm mt-2">
                      {staff.length === 0
                        ? 'Add your first team member'
                        : `${certifiedCount} certified`}
                    </Text>
                  </View>
                  <View className="bg-white/20 rounded-full p-4">
                    <Ionicons name="people" size={32} color="white" />
                  </View>
                </View>
                <View className="flex-row items-center mt-4 pt-4 border-t border-white/20">
                  <Text className="text-white font-semibold mr-2">Manage Team</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </View>
              </Card>
            </TouchableOpacity>

            {/* Team Certification Progress */}
            <View className="mb-6">
              <Text className="text-2xl font-serif text-primary mb-4">Certification Progress</Text>
              <Card variant="outlined">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-text font-bold text-lg">
                      {certifiedCount} of {staff.length} Certified
                    </Text>
                    <Text className="text-textMuted text-sm">
                      {Math.round(avgProgress * 100)}% average video completion
                    </Text>
                  </View>
                  <View className="bg-accent/10 rounded-full p-3">
                    <Ionicons
                      name={certifiedCount === staff.length && staff.length > 0 ? 'trophy' : 'ribbon'}
                      size={24}
                      color="#C68976"
                    />
                  </View>
                </View>

                {/* Progress bar */}
                <View className="bg-gray-100 h-3 rounded-full overflow-hidden">
                  <View
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${Math.max(5, avgProgress * 100)}%` }}
                  />
                </View>

                {staff.length === 0 && (
                  <Text className="text-textMuted text-sm mt-3 text-center italic">
                    Add team members to track their progress
                  </Text>
                )}
              </Card>
            </View>

            {/* Book Event with Ray CTA */}
            <TouchableOpacity
              onPress={() => router.push('/events')}
              className="mb-6"
            >
              <Card variant="elevated" className="bg-accent overflow-hidden">
                <View className="flex-row items-center">
                  <View className="flex-1 pr-4">
                    <Text className="text-white text-2xl font-serifBold mb-2">
                      Book an Event with Ray
                    </Text>
                    <Text className="text-white/80 text-sm mb-4">
                      In-person training sessions for your team. Elevate your salon's skills
                      together.
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold mr-2">View Events</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </View>
                  </View>
                  <View className="bg-white/20 rounded-full p-4">
                    <Ionicons name="calendar" size={32} color="white" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            {/* Recent Activity */}
            <View className="mb-8">
              <Text className="text-2xl font-serif text-primary mb-4">Recent Activity</Text>

              {recentActivity.length === 0 ? (
                <Card variant="outlined" className="items-center py-6">
                  <Ionicons name="time-outline" size={32} color="#a1a1aa" />
                  <Text className="text-textMuted mt-2">No recent activity</Text>
                  <Text className="text-textMuted text-sm text-center mt-1">
                    Activity will appear here as your team watches videos
                  </Text>
                </Card>
              ) : (
                recentActivity.map((activity) => (
                  <Card key={activity.id} variant="outlined" className="mb-3 flex-row items-center">
                    <View
                      className={`rounded-full p-2 mr-3 ${
                        activity.type === 'video_completed' ? 'bg-green-100' : 'bg-accent/10'
                      }`}
                    >
                      <Ionicons
                        name={
                          activity.type === 'video_completed'
                            ? 'checkmark-circle'
                            : activity.type === 'certification_applied'
                              ? 'ribbon'
                              : 'person-add'
                        }
                        size={20}
                        color={activity.type === 'video_completed' ? '#22c55e' : '#C68976'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-text font-medium">
                        <Text className="font-bold">{activity.staffName}</Text> {activity.description}
                      </Text>
                      <Text className="text-textMuted text-xs mt-0.5">
                        {formatTimeAgo(activity.timestamp)}
                      </Text>
                    </View>
                  </Card>
                ))
              )}
            </View>

            {/* Quick Actions */}
            <View className="mb-8">
              <Text className="text-2xl font-serif text-primary mb-4">Quick Actions</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/team')}
                  className="flex-1"
                >
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-purple-100 rounded-full p-3 mb-2">
                      <Ionicons name="add" size={24} color="#a855f7" />
                    </View>
                    <Text className="text-text font-medium text-sm">Add Staff</Text>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/modules')}
                  className="flex-1"
                >
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-blue-100 rounded-full p-3 mb-2">
                      <Ionicons name="book" size={24} color="#3b82f6" />
                    </View>
                    <Text className="text-text font-medium text-sm">Courses</Text>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/certification')}
                  className="flex-1"
                >
                  <Card variant="outlined" className="items-center py-4">
                    <View className="bg-accent/10 rounded-full p-3 mb-2">
                      <Ionicons name="ribbon" size={24} color="#C68976" />
                    </View>
                    <Text className="text-text font-medium text-sm">Certify</Text>
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
