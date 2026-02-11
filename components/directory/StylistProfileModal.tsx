import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StylistProfile } from './StylistCard';

interface StylistProfileModalProps {
  visible: boolean;
  stylist: StylistProfile | null;
  onClose: () => void;
}

export function StylistProfileModal({ visible, stylist, onClose }: StylistProfileModalProps) {
  if (!stylist) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop - tapping it closes modal */}
        <TouchableOpacity 
            className="absolute top-0 bottom-0 left-0 right-0 bg-black/50" 
            activeOpacity={1} 
            onPress={onClose}
        />

        {/* Modal Content */}
        <View className="bg-surface rounded-t-3xl border-t border-border overflow-hidden h-[85%]">
            
            {/* Header / Cover Image Area (optional, using plain header for now) */}
            <View className="relative">
                 <View className="absolute top-4 right-4 z-10">
                     <TouchableOpacity onPress={onClose} className="bg-black/50 p-2 rounded-full">
                         <Ionicons name="close" size={24} color="white" />
                     </TouchableOpacity>
                 </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Profile Header */}
                <View className="items-center pt-8 pb-6 px-4 bg-surfaceHighlight">
                    <Image 
                        source={{ uri: stylist.avatar_url || 'https://via.placeholder.com/150' }} 
                        className="w-32 h-32 rounded-full border-4 border-primary mb-4"
                    />
                    <Text className="text-2xl font-bold text-text text-center">{stylist.name}</Text>
                    {stylist.salon_name && (
                        <Text className="text-lg text-primary text-center font-semibold mt-1">{stylist.salon_name}</Text>
                    )}
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="location" size={16} color="#a1a1aa" className="mr-1" />
                        <Text className="text-textMuted">{stylist.location}</Text>
                    </View>
                </View>

                {/* Quick Stats / Actions */}
                <View className="flex-row justify-around py-6 border-b border-border px-4">
                    <View className="items-center">
                        <View className="bg-primary/10 p-3 rounded-full mb-2">
                            <Ionicons name="star" size={24} color="#3b82f6" />
                        </View>
                        <Text className="text-text font-bold">{stylist.rating || 'New'}</Text>
                        <Text className="text-xs text-textMuted">Rating</Text>
                    </View>
                     <View className="items-center">
                        <View className="bg-primary/10 p-3 rounded-full mb-2">
                            <Ionicons name="ribbon" size={24} color="#3b82f6" />
                        </View>
                        <Text className="text-text font-bold">{stylist.certifications?.length || 0}</Text>
                        <Text className="text-xs text-textMuted">Certs</Text>
                    </View>
                    <TouchableOpacity 
                        className="items-center" 
                        onPress={() => {
                            if (!stylist.booking_url) return;
                            let url = stylist.booking_url;
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                            }
                            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
                        }}
                    >
                        <View className={`p-3 rounded-full mb-2 ${stylist.booking_url ? 'bg-primary' : 'bg-surfaceHighlight'}`}>
                            <Ionicons name="calendar" size={24} color={stylist.booking_url ? 'white' : '#71717a'} />
                        </View>
                        <Text className={`text-text font-bold ${stylist.booking_url ? 'text-primary' : 'text-textMuted'}`}>Book</Text>
                        <Text className="text-xs text-textMuted">Now</Text>
                    </TouchableOpacity>
                </View>

                {/* Bio & Details */}
                <View className="p-6 space-y-6">
                    <View>
                        <Text className="text-lg font-bold text-text mb-2">Specialties</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {stylist.specialties?.length > 0 ? stylist.specialties.map((spec, i) => (
                                <View key={i} className="bg-surfaceHighlight px-3 py-1.5 rounded-full border border-border">
                                    <Text className="text-textMuted text-sm">{spec}</Text>
                                </View>
                            )) : (
                                <Text className="text-textMuted italic">No specialties listed</Text>
                            )}
                        </View>
                    </View>

                    <View>
                         <Text className="text-lg font-bold text-text mb-2">About</Text>
                         <Text className="text-textMuted leading-6">
                             {stylist.bio || `${stylist.name} is a Bob Company certified stylist ready to help you achieve your perfect look.`}
                         </Text>
                    </View>
                    
                    {stylist.instagram_handle && (
                      <View>
                          <Text className="text-lg font-bold text-text mb-2">Social</Text>
                          <TouchableOpacity 
                            className="flex-row items-center"
                            onPress={() => Linking.openURL(`https://instagram.com/${stylist.instagram_handle?.replace('@', '')}`)}
                          >
                              <Ionicons name="logo-instagram" size={24} color="#E1306C" className="mr-3" />
                              <Text className="text-text font-semibold">@{stylist.instagram_handle.replace('@', '')}</Text>
                          </TouchableOpacity>
                      </View>
                    )}
                </View>
            </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
