import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export interface StylistProfile {
  id: string;
  name: string;
  display_name?: string; // Optional alias if DB field differs
  salon_name?: string;
  location: string;
  avatar_url?: string;
  specialties: string[];
  rating?: number;
  certifications: string[]; // e.g., 'Level 1', 'Master'
  latitude?: number;
  longitude?: number;
  bio?: string;
  instagram_handle?: string;
  booking_url?: string;
}

interface StylistCardProps {
  stylist: StylistProfile;
  onPress: () => void;
}

export function StylistCard({ stylist, onPress }: StylistCardProps) {
  return (
    <Pressable onPress={onPress}>
        <Card padding="md" className="mb-4 flex-row items-center">
            <View className="mr-4">
                {stylist.avatar_url ? (
                    <Image 
                        source={{ uri: stylist.avatar_url }} 
                        className="w-16 h-16 rounded-full bg-surfaceHighlight" 
                    />
                ) : (
                    <View className="w-16 h-16 rounded-full bg-surfaceHighlight items-center justify-center">
                         <Text className="text-xl font-bold text-textMuted">
                             {stylist.name.substring(0, 2).toUpperCase()}
                         </Text>
                    </View>
                )}
                 {stylist.certifications.includes('Master') && (
                     <View className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1 border border-surface">
                         <Ionicons name="star" size={10} color="white" />
                     </View>
                 )}
            </View>

            <View className="flex-1">
                <View className="flex-row justify-between items-start">
                    <Text className="text-lg font-serifBold text-text mb-1">{stylist.name}</Text>
                    {stylist.rating && (
                        <View className="flex-row items-center">
                            <Ionicons name="star" size={14} color="#D4AF37" />
                            <Text className="text-textMuted ml-1 text-xs">{stylist.rating}</Text>
                        </View>
                    )}
                </View>
                
                {stylist.salon_name && (
                    <Text className="text-textMuted text-sm mb-1">{stylist.salon_name}</Text>
                )}
                
                <View className="flex-row items-center mb-2">
                    <Ionicons name="location-outline" size={12} color="#a1a1aa" className="mr-1" />
                    <Text className="text-textMuted text-xs">{stylist.location}</Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                    {stylist.specialties.slice(0, 3).map((spec, index) => (
                         <View key={index} className="bg-surfaceHighlight px-2 py-1 rounded text-xs">
                             <Text className="text-textMuted text-[10px]">{spec}</Text>
                         </View>
                    ))}
                </View>
            </View>
        </Card>
    </Pressable>
  );
}
