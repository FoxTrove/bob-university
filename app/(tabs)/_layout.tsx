import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useProfile } from '../../lib/hooks';

export default function TabLayout() {
  const { userType } = useProfile();

  // User type checks for tab visibility
  // Story 1.2 requirements:
  // - Individual Stylist: Home, University, Certify, Events, Profile
  // - Salon Owner: Home, University, Team, Events, Profile
  // - Client: Directory, Profile only
  // Secondary items (Community, Directory) moved to Profile menu for stylists
  const isClient = userType === 'client';
  const isSalonOwner = userType === 'salon_owner';
  const isIndividualStylist = userType === 'individual_stylist';

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
      {/* Home - Stylists only (salon owners and individual) */}
      <Tabs.Screen
        name="index"
        options={{
          href: isClient ? null : undefined,
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      {/* University - Stylists only */}
      <Tabs.Screen
        name="modules"
        options={{
          href: isClient ? null : undefined,
          title: 'University',
          tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={24} color={color} />,
        }}
      />
      {/* Team - Salon owners only (replaces Certify position for owners) */}
      <Tabs.Screen
        name="team"
        options={{
          href: isSalonOwner ? undefined : null,
          title: 'Team',
          tabBarIcon: ({ color }) => <Ionicons name="people-circle-outline" size={24} color={color} />,
        }}
      />
      {/* Certify - Individual stylists only (not salon owners, not clients) */}
      <Tabs.Screen
        name="certification"
        options={{
          href: isIndividualStylist ? undefined : null,
          title: 'Certify',
          tabBarIcon: ({ color }) => <Ionicons name="ribbon-outline" size={24} color={color} />,
        }}
      />
      {/* Events - Stylists only */}
      <Tabs.Screen
        name="events"
        options={{
          href: isClient ? null : undefined,
          title: 'Events',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      {/* Community - Hidden from main tabs, accessed via Profile menu for stylists */}
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Always hidden from tab bar
          title: 'Community',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={24} color={color} />,
        }}
      />
      {/* Directory - Clients see in main tabs, stylists access via Profile menu */}
      <Tabs.Screen
        name="directory"
        options={{
          href: isClient ? undefined : null,
          title: 'Directory',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
        }}
      />
      {/* Inspiration - Client only */}
      <Tabs.Screen
        name="inspiration"
        options={{
          href: isClient ? undefined : null,
          title: 'Inspiration',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={24} color={color} />,
        }}
      />
      {/* Profile - All users */}
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
