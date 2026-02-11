import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPPORT_EMAIL = 'support@thebobcompany.com';

interface SecondaryNavMenuProps {
  /** Color for the hamburger icon (default: black) */
  iconColor?: string;
}

export function SecondaryNavMenu({ iconColor = 'black' }: SecondaryNavMenuProps) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const navigateTo = (path: string) => {
    closeMenu();
    router.push(path as any);
  };

  const openSupport = () => {
    closeMenu();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Bob Company Support Request`);
  };

  const menuItems = [
    {
      label: 'Community',
      description: 'Connect with other stylists',
      icon: 'chatbubbles-outline' as const,
      iconColor: '#3b82f6',
      iconBg: 'bg-blue-500/10',
      onPress: () => navigateTo('/(tabs)/community'),
    },
    {
      label: 'Stylist Directory',
      description: 'Find certified stylists nearby',
      icon: 'map-outline' as const,
      iconColor: '#22c55e',
      iconBg: 'bg-green-500/10',
      onPress: () => navigateTo('/(tabs)/directory'),
    },
    {
      label: 'Notifications',
      description: 'View your activity',
      icon: 'notifications-outline' as const,
      iconColor: '#f59e0b',
      iconBg: 'bg-amber-500/10',
      onPress: () => navigateTo('/notifications'),
    },
    {
      label: 'Support',
      description: 'Get help with your account',
      icon: 'help-circle-outline' as const,
      iconColor: '#a855f7',
      iconBg: 'bg-purple-500/10',
      onPress: openSupport,
    },
  ];

  return (
    <>
      {/* Hamburger Menu Button */}
      <TouchableOpacity onPress={openMenu} className="p-2 -mr-2">
        <Ionicons name="menu-outline" size={26} color={iconColor} />
      </TouchableOpacity>

      {/* Drawer Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={closeMenu}
        >
          {/* Drawer from right side */}
          <Pressable
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-xl"
            onPress={(e) => e.stopPropagation()}
            style={{ paddingTop: insets.top }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-serifBold text-primary">Menu</Text>
              <TouchableOpacity onPress={closeMenu} className="p-1">
                <Ionicons name="close" size={24} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View className="py-2">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  className="flex-row items-center px-5 py-4 active:bg-gray-50"
                >
                  <View className={`${item.iconBg} p-3 rounded-full mr-4`}>
                    <Ionicons name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text font-semibold text-base">{item.label}</Text>
                    <Text className="text-textMuted text-sm">{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-gray-100" style={{ paddingBottom: insets.bottom + 16 }}>
              <Text className="text-center text-textMuted text-xs">
                Bob Company v1.0.0
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
