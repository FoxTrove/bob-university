import { View, Text, ScrollView, TextInput, Switch, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function StylistSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    instagram_handle: '',
    booking_url: '',
    salon_name: '',
    city: '',
    state: '',
    zip_code: '', 
    is_public: false,
    profile_photo_url: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    fetchStylistProfile();
  }, [user?.id]);

  async function fetchStylistProfile() {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('stylist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stylist profile:', error);
      } else if (data) {
        setFormData({
            display_name: data.display_name || '',
            bio: data.bio || '',
            instagram_handle: data.instagram_handle || '',
            booking_url: data.booking_url || '',
            salon_name: data.salon_name || '',
            city: data.city || '',
            state: data.state || '',
            zip_code: data.zip_code || '',
            is_public: data.is_public || false,
            profile_photo_url: data.profile_photo_url,
            latitude: data.latitude,
            longitude: data.longitude,
        });
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }

  const pickImage = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    } catch (e) {
        Alert.alert('Error', 'Could not pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;
    setUploading(true);
    
    try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        const filePath = `stylist-profiles/${user.id}/${Date.now()}.png`;

        const { data, error } = await supabase.storage
            .from('images') // Using existing 'images' bucket
            .upload(filePath, decode(base64), {
                contentType: 'image/png',
                upsert: true,
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        // Update local state
        setFormData(prev => ({ ...prev, profile_photo_url: publicUrl }));

        // Update database immediately (Upsert requires all non-null fields for the insert path)
        const { error: updateError } = await supabase
            .from('stylist_profiles')
            .upsert({
                user_id: user.id,
                display_name: formData.display_name || 'New Stylist', // Fallback to satisfy constraint
                profile_photo_url: publicUrl,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (updateError) {
             console.error('Error auto-saving photo:', updateError);
             Alert.alert('Warning', 'Photo uploaded but profile update failed. Please click Save manually.');
        } else {
             Alert.alert('Success', 'Profile photo updated!');
        }

    } catch (error: any) {
        console.error('Upload error:', error);
        Alert.alert('Upload Failed', error.message);
    } finally {
        setUploading(false);
    }
  };
  
  // Helper to decode base64 for Supabase
  const decode = (base64: string) => {
    const characters = atob(base64);
    const byteNumbers = new Array(characters.length);
    for (let i = 0; i < characters.length; i++) {
        byteNumbers[i] = characters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return byteArray;
  };

  async function geocodeAddress(cityStr: string, stateStr: string, zipStr: string): Promise<{lat: number, lng: number} | null> {
    let address = '';
    if (zipStr) {
        address = zipStr;
    } else {
        address = `${cityStr}, ${stateStr}`;
    }
    
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
        console.warn('Mapbox token missing');
        return null;
    }

    try {
        console.log('Geocoding address:', address);
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
        );
        const json = await response.json();
        if (json.features && json.features.length > 0) {
            const [lng, lat] = json.features[0].center; 
            return { lat, lng };
        } else {
             console.warn('No geocoding results found for:', address);
        }
    } catch (e) {
        console.error('Geocoding error:', e);
    }
    return null;
  }

  const handleSave = async () => {
    if (!formData.display_name) {
      Alert.alert('Error', 'Display Name is required');
      return;
    }
    
    setSaving(true);
    try {
      let lat = formData.latitude;
      let lng = formData.longitude;

      if (formData.zip_code || (formData.city && formData.state)) {
          const coords = await geocodeAddress(formData.city, formData.state, formData.zip_code);
          if (coords) {
              lat = coords.lat;
              lng = coords.lng;
          } else {
              Alert.alert('Location Warning', 'We could not find your location on the map. Please check your Zip Code or City/State.');
          }
      }

      // @ts-ignore
      const { error } = await supabase
        .from('stylist_profiles')
        .upsert({
          user_id: user!.id,
          display_name: formData.display_name,
          bio: formData.bio || null,
          instagram_handle: formData.instagram_handle || null,
          booking_url: formData.booking_url || null,
          salon_name: formData.salon_name || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          is_public: formData.is_public,
          profile_photo_url: formData.profile_photo_url,
          latitude: lat,
          longitude: lng,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      Alert.alert('Success', 'Your stylist profile has been updated.');
      router.back();
    } catch (e: any) {
        console.error(e);
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
        <SafeContainer>
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#f472b6" />
            </View>
        </SafeContainer>
     )
  }

  return (
    <SafeContainer>
        <Stack.Screen options={{ title: 'Stylist Directory', headerBackTitle: 'Profile', headerShown: true }} />
        <ScrollView className="flex-1 bg-background p-6">
            <Text className="text-2xl font-bold text-primary mb-2">Stylist Profile</Text>
            <Text className="text-textMuted mb-6">
                Manage how you appear in the Certified Stylist Directory.
            </Text>

            {/* Photo Upload Section */}
            <View className="mb-8 items-center">
                <View className="relative">
                    <Image 
                        source={{ uri: formData.profile_photo_url || 'https://via.placeholder.com/150' }} 
                        className="w-32 h-32 rounded-full border-4 border-surface"
                    />
                    <TouchableOpacity 
                        onPress={pickImage}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-background"
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="camera" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text className="text-primary mt-2 font-medium" onPress={pickImage}>
                    {uploading ? 'Uploading...' : 'Change Photo'}
                </Text>
            </View>

            <View className="mb-6">
                 <Text className="text-text font-bold mb-2">Display Name</Text>
                 <TextInput 
                    className="bg-surface text-text p-4 rounded-lg border border-border"
                    value={formData.display_name}
                    onChangeText={(text) => setFormData({...formData, display_name: text})}
                    placeholder="Your professional name"
                    placeholderTextColor="#71717a"
                 />
            </View>

            <View className="mb-6">
                 <Text className="text-text font-bold mb-2">Bio</Text>
                 <TextInput 
                    className="bg-surface text-text p-4 rounded-lg border border-border h-32"
                    value={formData.bio}
                    onChangeText={(text) => setFormData({...formData, bio: text})}
                    placeholder="Tell clients about your expertise..."
                    placeholderTextColor="#71717a"
                    multiline
                    textAlignVertical="top"
                 />
            </View>

            <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                    <Text className="text-text font-bold mb-2">Instagram</Text>
                    <TextInput 
                        className="bg-surface text-text p-4 rounded-lg border border-border"
                        value={formData.instagram_handle}
                        onChangeText={(text) => setFormData({...formData, instagram_handle: text})}
                        placeholder="@username"
                        placeholderTextColor="#71717a"
                        autoCapitalize="none"
                    />
                </View>
                 <View className="flex-1">
                    <Text className="text-text font-bold mb-2">Booking URL</Text>
                    <TextInput 
                        className="bg-surface text-text p-4 rounded-lg border border-border"
                        value={formData.booking_url}
                        onChangeText={(text) => setFormData({...formData, booking_url: text})}
                        placeholder="https://..."
                        placeholderTextColor="#71717a"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <View className="mb-6">
                 <Text className="text-text font-bold mb-2">Location</Text>
                 <Card padding="sm" className="space-y-4">
                    <TextInput 
                        className="bg-background text-text p-3 rounded border border-border"
                        value={formData.salon_name}
                        onChangeText={(text) => setFormData({...formData, salon_name: text})}
                        placeholder="Salon Name"
                        placeholderTextColor="#71717a"
                    />
                    <View className="flex-row gap-4">
                         <TextInput 
                            className="flex-1 bg-background text-text p-3 rounded border border-border"
                            value={formData.city}
                            onChangeText={(text) => setFormData({...formData, city: text})}
                            placeholder="City"
                            placeholderTextColor="#71717a"
                        />
                         <TextInput 
                            className="w-24 bg-background text-text p-3 rounded border border-border"
                            value={formData.state}
                            onChangeText={(text) => setFormData({...formData, state: text})}
                            placeholder="State"
                            placeholderTextColor="#71717a"
                        />
                        <TextInput 
                            className="w-28 bg-background text-text p-3 rounded border border-border"
                            value={formData.zip_code}
                            onChangeText={(text) => setFormData({...formData, zip_code: text})}
                            placeholder="Zip Code"
                            placeholderTextColor="#71717a"
                            keyboardType="number-pad"
                        />
                    </View>
                 </Card>
            </View>

             <View className="flex-row items-center justify-between mb-8">
                <View className="flex-1 mr-4">
                    <Text className="text-text font-bold text-lg">Public Profile</Text>
                    <Text className="text-textMuted text-sm">
                        Allow clients to find you in the directory.
                    </Text>
                </View>
                <Switch 
                    value={formData.is_public}
                    onValueChange={(val) => setFormData({...formData, is_public: val})}
                    trackColor={{ false: '#3f3f46', true: '#f472b6' }}
                />
            </View>

            <Button 
                title={saving ? "Saving..." : "Save Profile"}
                onPress={handleSave}
                disabled={saving}
                className="mb-10"
            />

        </ScrollView>
    </SafeContainer>
  );
}
