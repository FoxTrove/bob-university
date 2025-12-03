import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold mb-8">Your Profile</Text>
      
      <TouchableOpacity 
        className="bg-red-50 px-8 py-3 rounded-full border border-red-100"
        onPress={signOut}
      >
        <Text className="text-red-600 font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
