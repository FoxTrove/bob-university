import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-600">Bob Company</Text>
      <Text className="text-gray-500 mt-2">Vibe Coding in Progress...</Text>
      <StatusBar style="auto" />
    </View>
  );
}
