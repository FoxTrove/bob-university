import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface LockedOverlayProps {
  onUpgrade?: () => void;
}

export function LockedOverlay({ onUpgrade }: LockedOverlayProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to subscription screen
      router.push('/subscribe');
    }
  };

  return (
    <View className="absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
      <View className="items-center p-4">
        <Text className="text-3xl mb-2">🔒</Text>
        <Text className="text-white font-semibold text-center mb-3">
          Premium Content
        </Text>
        <Pressable
          onPress={handleUpgrade}
          className="bg-brand-accent px-4 py-2 rounded-full active:opacity-80"
        >
          <Text className="text-white font-medium">Upgrade to Unlock</Text>
        </Pressable>
      </View>
    </View>
  );
}
