import { View, Text, TouchableOpacity, ScrollView, Pressable, Linking, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useEntitlement, useProfile, useSalonInvites } from '../../lib/hooks';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getLevelProgress } from '../../components/ui/CircularProgress';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIVACY_POLICY_URL = 'https://thebobcompany.com/privacy';
const SUPPORT_EMAIL = 'support@thebobcompany.com';

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
  const { profile, userType, refetch: refetchProfile } = useProfile();
  const { pendingCount: pendingInvites } = useSalonInvites();
  const router = useRouter();

  // Join Salon modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [joining, setJoining] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function handleJoinSalon() {
    if (!user?.id || !accessCode.trim()) return;

    const normalizedCode = accessCode.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character access code.');
      return;
    }

    setJoining(true);
    try {
      // 1. Find the access code
      const { data: codeData, error: codeError } = await supabase
        .from('staff_access_codes')
        .select('*')
        .eq('code', normalizedCode)
        .single();

      if (codeError || !codeData) {
        Alert.alert('Invalid Code', 'This access code was not found. Please check and try again.');
        return;
      }

      // 2. Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        Alert.alert('Expired Code', 'This access code has expired. Please ask your salon owner for a new code.');
        return;
      }

      // 3. Check if code has remaining uses
      const usedCount = codeData.used_count || 0;
      const maxUses = codeData.max_uses || 1;
      if (usedCount >= maxUses) {
        Alert.alert('Code Already Used', 'This access code has already been used. Please ask your salon owner for a new code.');
        return;
      }

      // 4. Update user's profile with salon_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ salon_id: codeData.salon_id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 5. Increment used_count on the code
      await supabase
        .from('staff_access_codes')
        .update({ used_count: usedCount + 1 })
        .eq('id', codeData.id);

      // 6. Refresh profile and close modal
      await refetchProfile();
      setShowJoinModal(false);
      setAccessCode('');
      Alert.alert('Success', 'You have successfully joined the salon!');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to join salon';
      Alert.alert('Error', message);
    } finally {
      setJoining(false);
    }
  }

  const handleUpgrade = () => {
    router.push('/subscribe');
  };

  const navigateToStylistSettings = () => {
    router.push('/stylist-settings');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Bob Company Support Request`);
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
              level={profile?.community_level ?? undefined}
              isCertified={profile?.is_certified ?? undefined}
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
                {/* Hide certification badge for clients */}
                {userType !== 'client' && profile?.is_certified && (
                  <Badge label="Certified" variant="success" />
                )}
                {userType === 'salon_owner' && (
                  <Badge label="Salon Owner" variant="purple" />
                )}
              </View>
            </View>
          </Card>

          {/* Community Stats - Hidden for clients */}
          {userType !== 'client' && (
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
          )}

          {/* Quick Access - For all stylists (individual and salon owners) */}
          {(userType === 'individual_stylist' || userType === 'salon_owner') && (
            <View className="mb-8">
              <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                Quick Access
              </Text>
              <Card padding="none" className="overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4 border-b border-border"
                  onPress={() => router.push('/(tabs)/community')}
                >
                  <View className="flex-row items-center">
                    <View className="bg-blue-500/10 p-2 rounded-full mr-3">
                      <Ionicons name="chatbubbles-outline" size={24} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-text font-bold">Community</Text>
                      <Text className="text-textMuted text-xs">Connect with other stylists</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-between p-4"
                  onPress={() => router.push('/(tabs)/directory')}
                >
                  <View className="flex-row items-center">
                    <View className="bg-green-500/10 p-2 rounded-full mr-3">
                      <Ionicons name="map-outline" size={24} color="#22c55e" />
                    </View>
                    <View>
                      <Text className="text-text font-bold">Stylist Directory</Text>
                      <Text className="text-textMuted text-xs">Find certified stylists nearby</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>
              </Card>
            </View>
          )}

          {/* Role Specific Actions - Only show for individual stylists */}
          {userType === 'individual_stylist' && (
            <View className="mb-8">
              <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                Professional Tools
              </Text>
              <Card padding="none" className="overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4 border-b border-border"
                  onPress={navigateToStylistSettings}
                >
                   <View className="flex-row items-center">
                    <View className="bg-primary/10 p-2 rounded-full mr-3">
                      <Ionicons name="cut-outline" size={24} color="#f472b6" />
                    </View>
                    <View>
                      <Text className="text-text font-bold">My Directory Profile</Text>
                      <Text className="text-textMuted text-xs">Manage your public listing</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>

                {/* Salon Invites - Show if there are pending invites and user not in a salon */}
                {!profile?.salon_id && pendingInvites > 0 && (
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 border-b border-border"
                    onPress={() => router.push('/salon-invites')}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-purple-500/10 p-2 rounded-full mr-3">
                        <Ionicons name="mail" size={24} color="#a855f7" />
                      </View>
                      <View>
                        <Text className="text-text font-bold">Salon Invites</Text>
                        <Text className="text-textMuted text-xs">You have team invitations waiting</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <View className="bg-purple-500 rounded-full px-2 py-0.5 mr-2">
                        <Text className="text-white text-xs font-bold">{pendingInvites}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#52525b" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Join a Salon - Only for individual_stylists not already in a salon */}
                {!profile?.salon_id && (
                  <TouchableOpacity
                    className={`flex-row items-center justify-between p-4 ${pendingInvites > 0 ? '' : ''}`}
                    onPress={() => setShowJoinModal(true)}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-purple-500/10 p-2 rounded-full mr-3">
                        <Ionicons name="people" size={24} color="#a855f7" />
                      </View>
                      <View>
                        <Text className="text-text font-bold">Join a Salon</Text>
                        <Text className="text-textMuted text-xs">Enter an access code from your salon owner</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525b" />
                  </TouchableOpacity>
                )}
              </Card>
            </View>
          )}

          {/* Salon Management - Only for salon owners */}
          {userType === 'salon_owner' && (
            <View className="mb-8">
              <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                Salon Management
              </Text>
              <Card padding="none" className="overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4 border-b border-border"
                  onPress={() => router.push('/(tabs)/team')}
                >
                  <View className="flex-row items-center">
                    <View className="bg-purple-500/10 p-2 rounded-full mr-3">
                      <Ionicons name="people" size={24} color="#a855f7" />
                    </View>
                    <View>
                      <Text className="text-text font-bold">Manage Team</Text>
                      <Text className="text-textMuted text-xs">View team progress and add staff</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4"
                  onPress={() => router.push('/(tabs)/certification')}
                >
                  <View className="flex-row items-center">
                    <View className="bg-amber-500/10 p-2 rounded-full mr-3">
                      <Ionicons name="ribbon" size={24} color="#f59e0b" />
                    </View>
                    <View>
                      <Text className="text-text font-bold">Certifications</Text>
                      <Text className="text-textMuted text-xs">Earn your official credentials</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>
              </Card>
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
              <Card padding="none">
                <View className="p-4 border-b border-border">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-text font-medium">Current Plan</Text>
                    <Text className="text-primary font-bold capitalize">{plan}</Text>
                  </View>
                  <Text className="text-textMuted text-sm">
                    Your subscription is active. Thank you for being a member!
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4"
                  onPress={() => router.push('/subscription-cancel')}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="card-outline" size={20} color="#a1a1aa" />
                    <Text className="text-text ml-3">Manage Subscription</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#52525b" />
                </TouchableOpacity>
              </Card>
            )}
          </View>

          {/* Account Settings */}
          <View className="mb-8">
             <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
              Account
            </Text>
            <Card padding="none" className="overflow-hidden">
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 border-b border-border"
                onPress={() => router.push('/notifications')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between p-4 border-b border-border"
                onPress={() => router.push('/receipt-history')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="receipt-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Receipt History</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between p-4 border-b border-border"
                onPress={openPrivacyPolicy}
              >
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={20} color="#a1a1aa" />
                  <Text className="text-text ml-3">Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between p-4"
                onPress={openSupport}
              >
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

      {/* Join Salon Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setShowJoinModal(false)}
        >
          <Pressable
            className="bg-surface w-full rounded-2xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text font-serifBold text-xl">Join a Salon</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={24} color="#71717a" />
              </TouchableOpacity>
            </View>

            <Text className="text-textMuted mb-4">
              Enter the 6-character access code provided by your salon owner.
            </Text>

            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-text text-center text-2xl font-mono tracking-widest mb-4"
              placeholder="ABC123"
              placeholderTextColor="#71717a"
              value={accessCode}
              onChangeText={(text) => setAccessCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Button
              title={joining ? 'Joining...' : 'Join Salon'}
              onPress={handleJoinSalon}
              disabled={joining || accessCode.length !== 6}
              fullWidth
            />

            {joining && (
              <ActivityIndicator size="small" color="#a855f7" className="mt-4" />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeContainer>
  );
}
