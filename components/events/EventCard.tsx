import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  price_cents: number;
  thumbnail_url?: string;
}

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const date = new Date(event.event_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const time = new Date(event.event_date).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable onPress={onPress}>
        <Card className="mb-4 overflow-hidden p-0">
          {event.thumbnail_url && (
            <Image
              source={{ uri: event.thumbnail_url }}
              className="w-full h-40 object-cover"
            />
          )}
          <View className="p-4">
            <Text className="text-xl font-bold text-text mb-2">{event.title}</Text>
            
            <View className="flex-row items-center mb-1">
              <Ionicons name="calendar-outline" size={16} color="#a1a1aa" className="mr-2" />
              <Text className="text-textMuted">{date} • {time}</Text>
            </View>
            
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={16} color="#a1a1aa" className="mr-2" />
              <Text className="text-textMuted">{event.location}</Text>
            </View>

            <View className="flex-row justify-between items-center mt-2">
               <Text className="text-primary font-bold text-lg">
                  {event.price_cents === 0 ? 'Free' : `$${(event.price_cents / 100).toFixed(2)}`}
               </Text>
               <View className="bg-primary px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">Details</Text>
               </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
