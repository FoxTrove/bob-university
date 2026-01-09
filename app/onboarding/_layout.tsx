import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { View, StyleSheet } from 'react-native';

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Semi-transparent dark overlay for contrast */}
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        
        <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }, 
            animation: 'fade'
        }}>
            <Stack.Screen name="index" />
        </Stack>
    </View>
  );
}
