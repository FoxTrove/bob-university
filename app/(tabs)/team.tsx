import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, Salon, Module } from '../../lib/database.types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModuleProgress {
  id: string;
  title: string;
  completedVideos: number;
  totalVideos: number;
}

interface StaffWithProgress extends Profile {
  completedVideos: number;
  totalVideos: number;
  moduleProgress: ModuleProgress[];
}

export default function TeamTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffWithProgress[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSalonData();
  }, [user?.id]);

  async function fetchSalonData() {
    if (!user?.id) return;
    try {
      // 1. Get Owner's Salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (salonError && salonError.code !== 'PGRST116') throw salonError;
      setSalon(salonData);

      // 2. Get Staff members with progress
      if (salonData) {
        const { data: staffData, error: staffError } = await supabase
          .from('profiles')
          .select('*')
          .eq('salon_id', salonData.id);

        if (staffError) throw staffError;

        // 3. Get modules with their videos for progress calculation
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            title,
            videos (
              id,
              is_published
            )
          `)
          .eq('is_published', true)
          .order('sort_order', { ascending: true });

        if (modulesError) throw modulesError;

        // 4. Get video progress for each staff member
        const staffWithProgress: StaffWithProgress[] = await Promise.all(
          (staffData || []).map(async (member) => {
            const { data: progressData } = await supabase
              .from('video_progress')
              .select('video_id')
              .eq('user_id', member.id)
              .eq('completed', true);

            const completedVideoIds = new Set(progressData?.map((p) => p.video_id) || []);

            // Calculate per-module progress
            const moduleProgress: ModuleProgress[] = (modulesData || []).map((module) => {
              const publishedVideos = (module.videos || []).filter((v: { is_published: boolean | null }) => v.is_published === true);
              const totalVideos = publishedVideos.length;
              const completedVideos = publishedVideos.filter((v: { id: string }) => completedVideoIds.has(v.id)).length;

              return {
                id: module.id,
                title: module.title,
                completedVideos,
                totalVideos,
              };
            }).filter((m) => m.totalVideos > 0); // Only include modules with videos

            // Calculate overall progress
            const totalVideos = moduleProgress.reduce((sum, m) => sum + m.totalVideos, 0);
            const completedVideos = moduleProgress.reduce((sum, m) => sum + m.completedVideos, 0);

            return {
              ...member,
              completedVideos,
              totalVideos,
              moduleProgress,
            };
          })
        );

        setStaff(staffWithProgress);
      }
    } catch (e) {
      console.error('Error fetching salon data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function generateAccessCode() {
    if (!user?.id || !salon?.id) {
      Alert.alert('Error', 'No salon found for this user.');
      return;
    }

    setGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 2); // 48 hours

      const { error } = await supabase.from('staff_access_codes').insert({
        owner_id: user.id,
        salon_id: salon.id,
        code: code,
        max_uses: 1,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;
      setGeneratedCode(code);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate code';
      Alert.alert('Error', message);
    } finally {
      setGenerating(false);
    }
  }

  function confirmRemoveStaff(member: Profile) {
    Alert.alert(
      'Remove from Team',
      `Are you sure you want to remove ${member.full_name || member.email} from your team? They will lose access to salon training.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveStaff(member.id),
        },
      ]
    );
  }

  async function handleRemoveStaff(memberId: string) {
    setRemovingId(memberId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ salon_id: null })
        .eq('id', memberId);

      if (error) throw error;

      // Remove from local state
      setStaff((prev) => prev.filter((m) => m.id !== memberId));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove staff member';
      Alert.alert('Error', message);
    } finally {
      setRemovingId(null);
    }
  }

  function toggleExpanded(memberId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === memberId ? null : memberId);
  }

  function getProgressPercent(completed: number, total: number): number {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          <Text className="text-3xl font-serifBold text-primary mb-2">My Team</Text>
          <Text className="text-textMuted mb-6">
            {salon?.name || 'Your Salon'} • {staff.length} / {salon?.max_staff || 5} Staff Members
          </Text>

          {/* Generate Access Code Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-purple-500/20 py-3 px-4 rounded-xl mb-6"
            onPress={generateAccessCode}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#a855f7" />
                <Text className="text-purple-500 font-bold ml-2">Generate Access Code</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Generated Code Display */}
          {generatedCode && (
            <Card className="mb-6 bg-surfaceHighlight border border-purple-500">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-text font-bold text-lg mb-1">New Access Code</Text>
                  <Text className="text-textMuted text-sm mb-2">
                    Share this code with your stylist.
                  </Text>
                  <Text className="text-4xl font-mono text-purple-500 font-bold tracking-widest my-2">
                    {generatedCode}
                  </Text>
                  <Text className="text-textMuted text-xs">Expires in 48 hours. One-time use.</Text>
                </View>
                <TouchableOpacity onPress={() => setGeneratedCode(null)}>
                  <Ionicons name="close" size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Staff List */}
          {staff.length === 0 ? (
            <Card className="items-center py-8">
              <View className="bg-purple-500/10 p-4 rounded-full mb-4">
                <Ionicons name="people" size={32} color="#a855f7" />
              </View>
              <Text className="text-text font-bold text-lg">No Staff Yet</Text>
              <Text className="text-textMuted text-center px-4 mt-2">
                Generate an access code and share it with your stylists to give them access to
                training.
              </Text>
            </Card>
          ) : (
            <View className="gap-4">
              {staff.map((member) => {
                const progressPercent = getProgressPercent(member.completedVideos, member.totalVideos);
                const isExpanded = expandedId === member.id;

                return (
                  <Card key={member.id} className="p-3">
                    <TouchableOpacity
                      onPress={() => toggleExpanded(member.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center"
                    >
                      <Avatar
                        name={member.full_name || member.email}
                        source={member.avatar_url}
                        size="md"
                        level={member.community_level ?? undefined}
                        isCertified={member.is_certified ?? undefined}
                        className="mr-3"
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-text font-bold">{member.full_name || 'Stylist'}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-primary font-bold mr-2">{progressPercent}%</Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="#71717a"
                            />
                          </View>
                        </View>
                        <Text className="text-textMuted text-xs mb-2">{member.email}</Text>
                        <ProgressBar
                          progress={progressPercent}
                          size="sm"
                          variant={progressPercent === 100 ? 'success' : 'brand'}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Module Progress */}
                    {isExpanded && (
                      <View className="mt-4 pt-3 border-t border-surfaceHighlight">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-textMuted text-sm font-medium">Module Progress</Text>
                          <TouchableOpacity
                            onPress={() => confirmRemoveStaff(member)}
                            disabled={removingId === member.id}
                            className="flex-row items-center"
                          >
                            {removingId === member.id ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <>
                                <Ionicons name="person-remove-outline" size={14} color="#ef4444" />
                                <Text className="text-red-500 text-xs ml-1">Remove</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                        {member.moduleProgress.length === 0 ? (
                          <Text className="text-textMuted text-sm italic">No modules available</Text>
                        ) : (
                          member.moduleProgress.map((module) => {
                            const modulePercent = getProgressPercent(module.completedVideos, module.totalVideos);
                            return (
                              <View key={module.id} className="mb-3">
                                <View className="flex-row justify-between items-center mb-1">
                                  <Text className="text-text text-sm flex-1 mr-2" numberOfLines={1}>
                                    {module.title}
                                  </Text>
                                  <Text className="text-textMuted text-xs">
                                    {module.completedVideos}/{module.totalVideos}
                                  </Text>
                                </View>
                                <ProgressBar
                                  progress={modulePercent}
                                  size="sm"
                                  variant={modulePercent === 100 ? 'success' : 'default'}
                                />
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
