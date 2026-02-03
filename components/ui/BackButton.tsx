import { TouchableOpacity, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  label?: string;
  onPress?: () => void;
}

export function BackButton({ label = 'Back', onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center py-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={24} color="#C68976" />
      <Text className="text-primary text-base ml-1">{label}</Text>
    </TouchableOpacity>
  );
}
