import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useEntitlement } from '../../lib/hooks/useEntitlement';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar, getLevelProgress, LEVEL_THRESHOLDS } from '../../components/ui/CircularProgress';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const levelTitles: Record<number, string> = {
  1: 'Newcomer',
  2: 'Contributor',
  3: 'Regular',
  4: 'Active Member',
  5: 'Engaged',
  6: 'Enthusiast',
  7: 'Expert',
  8: 'Master',
  9: 'Legend',
  10: 'Community Champion',
};

export default function Profile() {
  const { user } = useAuth();
  const { isPremium, plan } = useEntitlement();
  const router = useRouter();
  const [profile, setProfile] = React.useState<any>(null); // TODO: strict typing
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user?.id]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const handleUpgrade = () => {
    router.push('/subscribe');
  };

  const navigateToStylistSettings = () => {
    router.push('/stylist-settings');
  };

  const navigateToSalonTeam = () => {
    router.push('/salon-team');
  };

  return (
    <SafeContainer>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          <Text className="text-3xl font-serifBold text-primary mb-8">Profile</Text>

          {/* User Info Card */}
          <Card className="mb-6 flex-row items-center p-4">
            <Avatar
              name={profile?.full_name || user?.email || 'User'}
              source={profile?.avatar_url}
              size="lg"
              level={profile?.community_level}
              isCertified={profile?.is_certified}
              className="mr-4"
            />
            <View className="flex-1">
              <Text className="text-text font-bold text-lg" numberOfLines={1}>
                {profile?.full_name || user?.email}
              </Text>
              <Text className="text-textMuted text-sm mb-2" numberOfLines={1}>
                {user?.email}
              </Text>
              <View className="flex-row items-center flex-wrap gap-2">
                <Badge
                  label={isPremium ? (plan === 'salon' ? 'Salon Pro' : 'Premium') : 'Free Member'}
                  variant={isPremium ? 'premium' : 'default'}
                />
                {profile?.is_certified && (
                  <Badge label="Certified" variant="success" />
                )}
                {profile?.role === 'owner' && (
                  <Badge label="Salon Owner" variant="purple" />
                )}
              </View>
            </View>
          </Card>

          {/* Community Stats */}
          <View className="mb-8">
            <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
              Community
            </Text>
            <Card padding="none">
              {(() => {
                const currentLevel = profile?.community_level || 1;
                const currentPoints = profile?.community_points || 0;
                const { progress, pointsToNext } = getLevelProgress(currentPoints, currentLevel);
                const levelTitle = levelTitles[Math.min(currentLevel, 10)];
                const isMaxLevel = currentLevel >= 10;

                return (
                  <View className="p-4">
                    {/* Level and Points Row */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center mr-3">
                          <Text className="text-primary text-xl font-bold">{currentLevel}</Text>
                        </View>
                        <View>
                          <Text className="text-text font-bold text-base">{levelTitle}</Text>
                          <Text className="text-textMuted text-sm">{currentPoints.toLocaleString()} points</Text>
                        </View>
                      </View>
                      {profile?.is_certified && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-full flex-row items-center">
                          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                          <Text className="text-green-600 text-xs font-medium ml-1">Certified</Text>
                        </View>
                      )}
                    </View>

                    {/* Progress to Next Level */}
                    <View className="mb-4">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-textMuted text-xs">Progress to Level {isMaxLevel ? 10 : currentLevel + 1}</Text>
                        <Text className="text-textMuted text-xs">{Math.round(progress * 100)}%</Text>
                      </View>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </View>
                      {!isMaxLevel && (
                        <Text className="text-textMuted text-xs mt-1">
                          {pointsToNext} points to next level
                        </Text>
                      )}
                      {isMaxLevel && (
                        <Text className="text-amber-600 text-xs mt-1 font-medium">
                          Max level achieved!
                        </Text>
                      )}
                    </View>

                    {/* View Profile Button */}
                    <Pressable
                      onPress={() => router.push(`/community/profile/${user?.id}`)}
                      className="flex-row items-center justify-center bg-surface border border-border rounded-xl py-3"
                    >
                      <Ionicons name="person-outline" size={18} color="#C68976" />
                      <Text className="text-primary font-medium ml-2">View Community Profile</Text>
                    </Pressable>
                  </View>
                );
              })()}
            </Card>
          </View>

          {/* Role Specific Actions */}
          {(profile?.role === 'stylist' || profile?.role === 'owner') && (
            <View className="mb-8">
              <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                Professional Tools
              </Text>
              
              {profile?.role === 'stylist' && (
                <Card className="mb-4">
                  <TouchableOpacity 
                    className="flex-row items-center justify-between p-2"
                    onPress={navigateToStylistSettings}
                  >
                     <View className="flex-row items-center">
                      <View className="bg-primary/10 p-2 rounded-full mr-3">
                        <Ionicons name="cut-outline" size={24} color="#f472b6" />
                      </View>
                      <View>
                        <Text className="text-text font-bold">Stylist Directory</Text>
                        <Text className="text-textMuted text-xs">Manage your public profile</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525b" />
                  </TouchableOpacity>
                </Card>
              )}

              {profile?.role === 'owner' && (
                <Card>
                  <TouchableOpacity 
                    className="flex-row items-center justify-between p-2"
                    onPress={navigateToSalonTeam}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-purple-500/10 p-2 rounded-full mr-3">
                        <Ionicons name="people-outline" size={24} color="#a855f7" />
                      </View>
                      <View>
                         <Text className="text-text font-bold">Salon Team</Text>
                         <Text className="text-textMuted text-xs">Manage staff access</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525b" />
                  </TouchableOpacity>
                </Card>
              )}
            </View>
          )}

          {/* Subscription Status */}
          <View className="mb-8">
            <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
              Membership
            </Text>
            
            {!isPremium ? (
              <Card className="bg-surface border-l-4 border-l-primary p-5">
                <View className="flex-row items-start mb-4">
                  <View className="bg-primary/20 p-2 rounded-full mr-3">
                    <Ionicons name="star" size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-serifBold text-lg mb-1">
                      Upgrade to Premium
                    </Text>
                    <Text className="text-textMuted text-sm">
                      Unlock over 150+ exclusive cutting tutorials and master the Bob method.
                    </Text>
                  </View>
                </View>
                <Button 
                  title="Unlock Full Access" 
                  onPress={handleUpgrade}
                  fullWidth
                />
              </Card>
            ) : (
              <Card padding="md">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-text font-medium">Current Plan</Text>
                  <Text className="text-primary font-bold capitalize">{plan}</Text>
                </View>
                <Text className="text-textMuted text-sm">
                  Your subscription is active. Thank you for being a member!
                </Text>
              </Card>
            )}
          </View>

          {/* Account Settings */}
          <View className="mb-8">
             <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
              Account
            </Text>
            <Card padding="none" className="overflow-hidden">
              <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <Ionicons name="help-circle-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>
            </Card>
          </View>

          <Button 
            title="Sign Out" 
            variant="ghost" 
            onPress={signOut}
            className="mt-4"
          />
          
          <Text className="text-center text-textMuted text-xs mt-8 mb-4">
            Version 1.0.0 (Build 100)
          </Text>

          {/* Debug Tools - Development Only */}
          {__DEV__ && (
            <View className="mb-10 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <Text className="text-red-500 font-bold mb-2">Debug Tools</Text>
                <Button 
                    title="Reset Onboarding" 
                    variant="outline"
                    onPress={async () => {
                        if (!user?.id) return;
                        await supabase.from('profiles').update({ has_completed_onboarding: false }).eq('id', user.id);
                        // Force a refresh via auth context would be ideal, 
                        // but for now simple alert or reload prompt
                        alert('Onboarding reset! Reload the app to test.');
                    }}
                />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
