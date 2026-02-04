import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useProfile } from '../../lib/hooks';

export default function TabLayout() {
  const { userType, loading } = useProfile();

  // While loading, show all tabs to prevent layout shift
  // Tabs will be filtered once userType is known
  const isClient = userType === 'client';
  const isSalonOwner = userType === 'salon_owner';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C68976', // Terra Cotta for active
        tabBarInactiveTintColor: '#71717a', // Zinc-500 for inactive
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={{ flex: 1 }} />
        ),
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          href: isClient ? null : undefined,
          title: 'University',
          tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="certification"
        options={{
          href: isClient ? null : undefined,
          title: 'Certify',
          tabBarIcon: ({ color }) => <Ionicons name="ribbon-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: isClient ? null : undefined,
          title: 'Community',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Stylists',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          href: isClient ? undefined : null,
          title: 'Inspiration',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          href: isSalonOwner ? undefined : null,
          title: 'Team',
          tabBarIcon: ({ color }) => <Ionicons name="people-circle-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
