import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import type { Tables } from '../lib/database.types';

// Type aliases using Supabase's Tables helper
type Profile = Tables<'profiles'>;
type Salon = Tables<'salons'>;

export default function SalonTeam() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

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

        const { error } = await supabase
            .from('staff_access_codes')
            .insert({
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

  if (loading) {
     return (
        <SafeContainer>
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        </SafeContainer>
     )
  }

  return (
    <SafeContainer>
        <Stack.Screen options={{ title: 'Salon Team', headerBackTitle: 'Profile', headerShown: true }} />
        <ScrollView className="flex-1 bg-background p-6">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-primary">My Team</Text>
                <TouchableOpacity 
                    className="bg-primary/20 p-2 rounded-full"
                    onPress={generateAccessCode}
                    disabled={generating}
                >
                    {generating ? (
                        <ActivityIndicator size="small" color="#f472b6" />
                    ) : (
                        <Ionicons name="add" size={24} color="#f472b6" />
                    )}
                </TouchableOpacity>
            </View>
            
            <Text className="text-textMuted mb-6">
                {salon?.name || 'Your Salon'} • {staff.length} / {salon?.max_staff || 5} Staff Members
            </Text>

            {generatedCode && (
                <Card className="mb-6 bg-surfaceHighlight border border-primary">
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-text font-bold text-lg mb-1">New Access Code</Text>
                            <Text className="text-textMuted text-sm mb-2">
                                Share this code with your stylist.
                            </Text>
                            <Text className="text-4xl font-mono text-primary font-bold tracking-widest my-2">
                                {generatedCode}
                            </Text>
                            <Text className="text-textMuted text-xs">
                                Expires in 48 hours. One-time use.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setGeneratedCode(null)}>
                            <Ionicons name="close" size={20} color="#71717a" />
                        </TouchableOpacity>
                    </View>
                </Card>
            )}

            {staff.length === 0 ? (
                <Card className="items-center py-8">
                    <View className="bg-surface-light p-4 rounded-full mb-4">
                        <Ionicons name="people" size={32} color="#71717a" />
                    </View>
                    <Text className="text-text font-bold text-lg">No Staff Yet</Text>
                    <Text className="text-textMuted text-center px-4 mt-2 mb-4">
                        Invite your stylists to join your salon team to give them access to training.
                    </Text>
                    <Button title="Add Staff Member" variant="outline" />
                </Card>
            ) : (
                <View className="gap-4">
                    {staff.map((member) => (
                        <Card key={member.id} className="flex-row items-center p-3">
                             <View className="h-10 w-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                                <Text className="text-primary font-bold">
                                    {(member.full_name || member.email)[0].toUpperCase()}
                                </Text>
                             </View>
                             <View className="flex-1">
                                <Text className="text-text font-bold">{member.full_name || 'Stylist'}</Text>
                                <Text className="text-textMuted text-xs">{member.email}</Text>
                             </View>
                             <TouchableOpacity>
                                <Ionicons name="ellipsis-horizontal" size={20} color="#71717a" />
                             </TouchableOpacity>
                        </Card>
                    ))}
                </View>
            )}

        </ScrollView>
    </SafeContainer>
  );
}
