import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="px-6 pt-16 pb-8 bg-white">
        <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider">Welcome back</Text>
        <Text className="text-3xl font-bold text-gray-900 mt-1">
          {user?.email?.split('@')[0] || 'Stylist'}
        </Text>
      </View>

      <View className="p-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Continue Learning</Text>
        
        {/* Placeholder for Continue Learning Card */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
          <View className="h-32 bg-gray-200 rounded-lg mb-4 items-center justify-center">
             <Text className="text-gray-400">Video Thumbnail</Text>
          </View>
          <Text className="text-lg font-bold text-gray-900">The Perfect Bob: Sectioning</Text>
          <Text className="text-gray-500 text-sm mt-1">Module 2 • 8 min left</Text>
          <View className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
            <View className="bg-black h-full w-3/4" />
          </View>
        </View>

        <Text className="text-xl font-bold text-gray-900 mb-4">New Arrivals</Text>
        
        {/* Placeholder for New Arrivals */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="w-64 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <View className="h-32 bg-gray-200 rounded-lg mb-3" />
              <Text className="font-bold text-gray-900">Advanced Texturizing {i}</Text>
              <Text className="text-gray-500 text-xs mt-1">Ray Hornback</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
