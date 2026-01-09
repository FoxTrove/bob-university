import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useEntitlement } from '../../lib/hooks/useEntitlement';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
                {profile?.role === 'stylist' && (
                  <Badge label="Certified Stylist" variant="success" />
                )}
                {profile?.role === 'owner' && (
                  <Badge label="Salon Owner" variant="purple" />
                )}
              </View>
            </View>
          </Card>

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
