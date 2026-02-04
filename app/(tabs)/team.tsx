import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, Salon } from '../../lib/database.types';

export default function TeamTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

      // 2. Get Staff members
      if (salonData) {
        const { data: staffData, error: staffError } = await supabase
          .from('profiles')
          .select('*')
          .eq('salon_id', salonData.id);

        if (staffError) throw staffError;
        setStaff(staffData || []);
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
              {staff.map((member) => (
                <Card key={member.id} className="flex-row items-center p-3">
                  <Avatar
                    name={member.full_name || member.email}
                    source={member.avatar_url}
                    size="md"
                    level={member.community_level ?? undefined}
                    isCertified={member.is_certified ?? undefined}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-text font-bold">{member.full_name || 'Stylist'}</Text>
                    <Text className="text-textMuted text-xs">{member.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmRemoveStaff(member)}
                    disabled={removingId === member.id}
                  >
                    {removingId === member.id ? (
                      <ActivityIndicator size="small" color="#71717a" />
                    ) : (
                      <Ionicons name="ellipsis-horizontal" size={20} color="#71717a" />
                    )}
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
